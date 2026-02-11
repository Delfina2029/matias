'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Grid as Grid3D, Text } from '@react-three/drei';
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

function Cabinet3D({ placedCabinet }: { placedCabinet: PlacedCabinet }) {
  const cabinetInfo = cabinetData.find(c => c.id === placedCabinet.cabinetId);
  if (!cabinetInfo) return null;

  const scale = 0.005; // smaller scale for better camera handling
  const width = cabinetInfo.width * scale;
  const height = cabinetInfo.height * scale;
  const depth = cabinetInfo.depth * scale;
  
  // position from top-left 2d grid to center-based 3d grid
  const layoutScale = 0.05;
  const posX = placedCabinet.x * layoutScale - (1200 * layoutScale / 2) + width / 2;
  const posZ = placedCabinet.y * layoutScale - (700 * layoutScale / 2) + depth / 2;


  return (
    <group position={[posX, height / 2, posZ]}>
      <Box args={[width, height, depth]}>
        <meshStandardMaterial color="#fdfdfd" />
      </Box>
      <Text
        position={[0, height / 2 + 0.2, 0]}
        fontSize={0.25}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {cabinetInfo.name}
      </Text>
    </group>
  );
}

function View3D({ placedCabinets }: { placedCabinets: PlacedCabinet[] }) {
    return (
        <div className="flex-1 relative">
            <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={0.5}/>
            
            <Grid3D
                position={[0, 0.01, 0]}
                args={[100, 100]}
                cellSize={0.5}
                cellThickness={1}
                cellColor="#cccccc"
                sectionSize={1}
                sectionThickness={1.5}
                sectionColor="#999999"
                fadeDistance={50}
                fadeStrength={1}
                infiniteGrid
            />

            {placedCabinets.map((placed) => (
                <Cabinet3D key={placed.instanceId} placedCabinet={placed} />
            ))}
            
            <OrbitControls makeDefault />
            </Canvas>
            <div className="absolute bottom-2 right-2 bg-background/80 p-2 rounded-md text-xs text-muted-foreground">
                Use mouse to orbit, zoom, and pan.
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
