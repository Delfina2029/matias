'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Box, Grid as Grid3D, Text, Plane } from '@react-three/drei';
import type { PlacedCabinet } from '@/lib/types';
import { cabinetData } from '@/lib/cabinets';
import { Button } from './ui/button';
import { Trash2, X, Cuboid } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"


type KitchenLayoutProps = {
  placedCabinets: PlacedCabinet[];
  onUpdateLayout: React.Dispatch<React.SetStateAction<PlacedCabinet[]>>;
  onClearLayout: () => void;
  onRemoveCabinet: (instanceId: string) => void;
};

const GRID_SIZE = 20;

// --- 3D Components ---

function Cabinet3D({ 
  placedCabinet, 
  isSelected,
  onClick
}: { 
  placedCabinet: PlacedCabinet, 
  isSelected: boolean,
  onClick: (event: ThreeEvent<MouseEvent>) => void,
}) {
  const cabinetInfo = cabinetData.find(c => c.id === placedCabinet.cabinetId);
  if (!cabinetInfo) return null;

  const scale = 0.005;
  const width = cabinetInfo.width * scale;
  const height = cabinetInfo.height * scale;
  const depth = cabinetInfo.depth * scale;
  
  // Map 2D pixels to 3D world units
  const layoutScale = 0.04;
  const posX = placedCabinet.x * layoutScale + width / 2;
  const posZ = placedCabinet.y * layoutScale + depth / 2;


  return (
    <group position={[posX, height / 2, posZ]} onClick={onClick}>
      <Box args={[width, height, depth]} castShadow receiveShadow>
        <meshStandardMaterial color={isSelected ? '#fcc419' : '#f8f9fa'} roughness={0.5} metalness={0.1} />
      </Box>
      {cabinetInfo.type === 'base' && (
         <Box args={[width, 0.05, depth]} position={[0, height/2 + 0.025, 0]} castShadow>
            <meshStandardMaterial color="#343a40" roughness={0.3} metalness={0.2} />
         </Box>
      )}
      <Text
        position={[0, height / 2 + 0.3, 0]}
        fontSize={0.2}
        color="black"
        anchorX="center"
        anchorY="middle"
        visible={false}
      >
        {cabinetInfo.name}
      </Text>
    </group>
  );
}

function View3D({ placedCabinets }: { placedCabinets: PlacedCabinet[] }) {
    const layoutSize = 60; // Represents the size of the kitchen area in 3D units
    const wallHeight = 15;
    const [selectedCabinet, setSelectedCabinet] = useState<string | null>(null);

    return (
        <div className="flex-1 relative">
            <Canvas 
              shadows 
              camera={{ position: [layoutSize * 0.7, 12, layoutSize * 0.7], fov: 50 }} 
              onPointerMissed={() => setSelectedCabinet(null)}
            >
              <ambientLight intensity={0.8} />
              <directionalLight 
                  castShadow
                  position={[layoutSize * 0.25, 20, layoutSize * 0.25]}
                  intensity={1.5}
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                  shadow-camera-far={70}
                  shadow-camera-left={-35}
                  shadow-camera-right={35}
                  shadow-camera-top={35}
                  shadow-camera-bottom={-35}
              />
              
              {/* Floor */}
              <Plane args={[layoutSize, layoutSize]} rotation={[-Math.PI / 2, 0, 0]} position={[layoutSize/2, 0, layoutSize/2]} receiveShadow>
                  <meshStandardMaterial color="#d1b7a3" roughness={0.7} />
              </Plane>
              
              {/* Walls in a corner */}
              <Plane args={[layoutSize, wallHeight]} rotation={[0, 0, 0]} position={[layoutSize/2, wallHeight/2, 0]} receiveShadow>
                  <meshStandardMaterial color="#e9ecef" />
              </Plane>
              <Plane args={[layoutSize, wallHeight]} rotation={[0, Math.PI / 2, 0]} position={[0, wallHeight/2, layoutSize/2]} receiveShadow>
                  <meshStandardMaterial color="#e9ecef" />
              </Plane>
              
              <Grid3D
                  position={[0, 0.01, 0]}
                  args={[100, 100]}
                  sectionColor="#999999"
                  cellColor="#cccccc"
                  cellThickness={1}
                  sectionThickness={1.5}
                  fadeDistance={60}
                  infiniteGrid
              />

              {placedCabinets.map((placed) => (
                  <Cabinet3D 
                    key={placed.instanceId} 
                    placedCabinet={placed}
                    isSelected={selectedCabinet === placed.instanceId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCabinet(placed.instanceId);
                    }}
                  />
              ))}
              
              <OrbitControls makeDefault minDistance={2} maxDistance={50} target={[layoutSize/3, 2, layoutSize/3]} />
            </Canvas>
            <div className="absolute bottom-2 right-2 bg-background/80 p-2 rounded-md text-xs text-muted-foreground">
                Use mouse to orbit, zoom, and pan. Click a cabinet to select.
            </div>
      </div>
    )
}

// --- 2D Components ---

function View2D({ placedCabinets, onUpdateLayout, onRemoveCabinet }: Pick<KitchenLayoutProps, 'placedCabinets' | 'onUpdateLayout' | 'onRemoveCabinet'>) {
    const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number; } | null>(null);
    const layoutRef = useRef<HTMLDivElement>(null);
  
    const handleMouseDown = (
      e: React.MouseEvent<HTMLDivElement>,
      id: string
    ) => {
      if ((e.target as HTMLElement).closest('.remove-btn')) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setDragging({
        id,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      });
      e.preventDefault();
    };
  
    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!dragging || !layoutRef.current) return;
      
      const layoutRect = layoutRef.current.getBoundingClientRect();
      let x = e.clientX - layoutRect.left - dragging.offsetX;
      let y = e.clientY - layoutRect.top - dragging.offsetY;
  
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;
      
      const cabinet = placedCabinets.find(c => c.instanceId === dragging.id);
      if(!cabinet) return;
      const cabWidth = getCabinetWidth(cabinet.cabinetId);
      const cabHeight = getCabinetDepth(cabinet.cabinetId);

      x = Math.max(0, Math.min(x, layoutRect.width - cabWidth));
      y = Math.max(0, Math.min(y, layoutRect.height - cabHeight));
  
      onUpdateLayout((prev) =>
        prev.map((c) => (c.instanceId === dragging.id ? { ...c, x, y } : c))
      );
    }, [dragging, onUpdateLayout, placedCabinets]);
  
    const handleMouseUp = useCallback(() => {
      setDragging(null);
    }, []);
  
    useEffect(() => {
      if (dragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      } else {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [dragging, handleMouseMove, handleMouseUp]);
    
    const getCabinetWidth = (cabinetId: string) => {
      const cabinet = cabinetData.find(c => c.id === cabinetId);
      return cabinet ? cabinet.width / 10 : 60; // scale factor for display
    }
    
    const getCabinetDepth = (cabinetId: string) => {
      const cabinet = cabinetData.find(c => c.id === cabinetId);
      return cabinet ? cabinet.depth / 10 : 58; // scale factor for display
    }

    return (
        <div className="flex-1 p-4 relative overflow-auto" ref={layoutRef}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
        />
        {placedCabinets.map((placed) => {
          const cabinetInfo = cabinetData.find(c => c.id === placed.cabinetId);
          return (
            <div
              key={placed.instanceId}
              onMouseDown={(e) => handleMouseDown(e, placed.instanceId)}
              className={cn(
                'absolute bg-primary/20 border-2 border-primary rounded-md group transition-all duration-100 ease-in-out',
                dragging?.id === placed.instanceId ? 'cursor-grabbing shadow-2xl z-10' : 'cursor-grab'
              )}
              style={{
                left: placed.x,
                top: placed.y,
                width: getCabinetWidth(placed.cabinetId),
                height: getCabinetDepth(placed.cabinetId),
                transition: dragging?.id === placed.instanceId ? 'none' : 'all 0.2s ease',
              }}
            >
              <div className="w-full h-full flex items-center justify-center p-2">
                 <span className="text-xs text-primary-foreground/80 font-medium select-none truncate">
                  {cabinetInfo?.name}
                </span>
              </div>
              <Button
                size="icon"
                variant="destructive"
                className="remove-btn absolute -top-3 -right-3 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveCabinet(placed.instanceId)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    )
}

// --- Main Component ---
export function KitchenLayout(props: KitchenLayoutProps) {
  const [is3D, setIs3D] = useState(false);

  const { onClearLayout, ...rest } = props;

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-headline">Kitchen Layout</h2>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <Label htmlFor="view-mode">2D</Label>
                <Switch id="view-mode" checked={is3D} onCheckedChange={setIs3D} />
                <Label htmlFor="view-mode" className="flex items-center gap-1">
                    <Cuboid className="w-4 h-4" /> 3D
                </Label>
            </div>
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClearLayout} aria-label="Clear Layout">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Layout</p>
              </TooltipContent>
            </Tooltip>
            </TooltipProvider>
        </div>
      </div>
      {is3D ? <View3D placedCabinets={props.placedCabinets} /> : <View2D {...rest} />}
    </div>
  );
}
