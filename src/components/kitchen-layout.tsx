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
  const height = placedCabinet.height * scale;
  
  // Map 2D pixels to 3D world units
  const layoutScale = 0.04;
  const posX = placedCabinet.x * layoutScale;
  const posZ = placedCabinet.y * layoutScale;

  if (placedCabinet.cabinetId === 'base-corner-900') {
    const width = placedCabinet.width * scale;
    const depth = placedCabinet.depth * scale;
    const cabinetBodyDepth = 580 * scale; // Standard depth, should match other base cabinets

    return (
      <group position={[posX, 0, posZ]} onClick={onClick}>
        {/* This creates the L-shape by combining two boxes. */}
        {/* Main box along one wall */}
        <Box args={[width, height, cabinetBodyDepth]} position={[width/2, height/2, cabinetBodyDepth/2]} castShadow receiveShadow>
          <meshStandardMaterial color={isSelected ? '#fcc419' : '#f8f9fa'} roughness={0.5} metalness={0.1} />
        </Box>
        {/* Second box to complete the L */}
        <Box args={[cabinetBodyDepth, height, depth - cabinetBodyDepth]} position={[cabinetBodyDepth/2, height/2, cabinetBodyDepth + (depth-cabinetBodyDepth)/2]} castShadow receiveShadow>
          <meshStandardMaterial color={isSelected ? '#fcc419' : '#f8f9fa'} roughness={0.5} metalness={0.1} />
        </Box>

        {/* Countertop for the L-shape */}
        <group>
            <Box args={[width, 0.05, cabinetBodyDepth]} position={[width / 2, height + 0.025, cabinetBodyDepth / 2]} castShadow>
                <meshStandardMaterial color="#343a40" roughness={0.3} metalness={0.2} />
            </Box>
            <Box args={[cabinetBodyDepth, 0.05, depth - cabinetBodyDepth]} position={[cabinetBodyDepth / 2, height + 0.025, cabinetBodyDepth + (depth - cabinetBodyDepth) / 2]} castShadow>
                <meshStandardMaterial color="#343a40" roughness={0.3} metalness={0.2} />
            </Box>
        </group>
      </group>
    );
  }

  // Fallback for regular rectangular cabinets
  const width = placedCabinet.width * scale;
  const depth = placedCabinet.depth * scale;

  return (
    <group position={[posX + width/2, height / 2, posZ + depth/2]} onClick={onClick}>
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


function View3D({ placedCabinets, selectedCabinetId, onSelectCabinet }: { placedCabinets: PlacedCabinet[], selectedCabinetId?: string, onSelectCabinet: (id: string | null) => void }) {
    const layoutSize = 60; // Represents the size of the kitchen area in 3D units
    const wallHeight = 15;

    return (
        <div className="flex-1 relative">
            <Canvas 
              shadows 
              camera={{ position: [layoutSize * 0.7, 12, layoutSize * 0.7], fov: 50 }} 
              onPointerMissed={() => onSelectCabinet(null)}
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
                    isSelected={selectedCabinetId === placed.instanceId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCabinet(placed.instanceId);
                    }}
                  />
              ))}
              
              <OrbitControls makeDefault minDistance={2} maxDistance={50} target={[layoutSize/3, 2, layoutSize/3]} />
            </Canvas>
            <div className="absolute bottom-2 right-2 bg-background/80 p-2 rounded-md text-xs text-muted-foreground">
                Usa el ratón para orbitar, hacer zoom y moverte. Haz clic en un gabinete para seleccionarlo.
            </div>
      </div>
    )
}

// --- 2D Components ---
function View2D({ 
    placedCabinets, 
    onUpdateLayout, 
    onSelectCabinet, 
    onRemoveCabinet, 
    selectedCabinetId 
}: Pick<KitchenLayoutProps, 'placedCabinets' | 'onUpdateLayout' | 'onSelectCabinet' | 'onRemoveCabinet' | 'selectedCabinetId'>) {
    const layoutRef = useRef<HTMLDivElement>(null);
    const scaleFactor = 8;
    const [dragging, setDragging] = useState<string | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    const isDraggingRef = useRef(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const DRAG_THRESHOLD = 5;

    const handleMouseDown = (e: React.MouseEvent, instanceId: string) => {
        if ((e.target as HTMLElement).closest('.remove-btn')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        setDragging(instanceId);
        
        const cabinetElement = (e.currentTarget as HTMLDivElement);
        const rect = cabinetElement.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        dragStartPos.current = { x: e.clientX, y: e.clientY };
        isDraggingRef.current = false;
    };
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging || !layoutRef.current) return;

        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        if (!isDraggingRef.current && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
            isDraggingRef.current = true;
        }

        if (isDraggingRef.current) {
            const layoutRect = layoutRef.current.getBoundingClientRect();
            
            const newX = e.clientX - layoutRect.left + layoutRef.current.scrollLeft - dragOffset.current.x;
            const newY = e.clientY - layoutRect.top + layoutRef.current.scrollTop - dragOffset.current.y;
            
            onUpdateLayout((prev) =>
                prev.map((cab) =>
                    cab.instanceId === dragging ? { ...cab, x: Math.max(0, newX), y: Math.max(0, newY) } : cab
                )
            );
        }
    }, [dragging, onUpdateLayout]);

    const handleMouseUp = useCallback(() => {
        if (dragging && !isDraggingRef.current) {
            onSelectCabinet(dragging);
        }
        setDragging(null);
        isDraggingRef.current = false;
    }, [dragging, onSelectCabinet]);

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


    return (
        <div 
            className="flex-1 relative overflow-auto bg-muted/10 p-4" 
            ref={layoutRef}
            onClick={(e) => {
                if (e.target === e.currentTarget || e.target === layoutRef.current?.querySelector('.relative.w-\\[3000px\\].h-\\[2000px\\]')) {
                    onSelectCabinet(null);
                }
            }}
        >
             <div className="relative w-[3000px] h-[2000px]">
                 {placedCabinets.map((placed) => {
                    const isCornerCabinet = placed.cabinetId === 'base-corner-900';

                    if (isCornerCabinet) {
                        const cabinetWidth = placed.width / scaleFactor;
                        const cabinetDepth = placed.depth / scaleFactor;
                        const bodyDepth = 580; // Standard cabinet depth in mm

                        return (
                            <div
                                key={placed.instanceId}
                                onMouseDown={(e) => handleMouseDown(e, placed.instanceId)}
                                className={cn(
                                    'absolute group cursor-grab active:cursor-grabbing',
                                    dragging === placed.instanceId && 'shadow-lg z-20',
                                    selectedCabinetId === placed.instanceId && 'z-10'
                                )}
                                style={{
                                    left: placed.x,
                                    top: placed.y,
                                    width: cabinetWidth,
                                    height: cabinetDepth,
                                }}
                            >
                                <div
                                    className={cn(
                                        'w-full h-full',
                                        selectedCabinetId === placed.instanceId && 'ring-2 ring-offset-2 ring-accent'
                                    )}
                                    style={{
                                        clipPath: `polygon(0% 0%, 100% 0%, 100% ${ (bodyDepth / placed.depth) * 100 }%, ${ (bodyDepth / placed.width) * 100 }% ${ (bodyDepth / placed.depth) * 100 }%, ${ (bodyDepth / placed.width) * 100 }% 100%, 0% 100%)`
                                    }}
                                >
                                    <div className="w-full h-full bg-card border-2 border-primary/50 group-hover:border-primary transition-colors rounded-md flex items-center justify-center text-xs font-mono text-muted-foreground/50">
                                        {/* Visual representation of L-shape, no internal components */}
                                    </div>
                                </div>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="remove-btn absolute -top-3 -right-3 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onClick={(e) => { e.stopPropagation(); onRemoveCabinet(placed.instanceId); }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )
                    }

                    const treatAsHorizontalDoors = placed.type !== 'tall' && placed.components.length > 1 && placed.components.every(c => c.type === 'door');
                    return (
                        <div
                            key={placed.instanceId}
                            onMouseDown={(e) => handleMouseDown(e, placed.instanceId)}
                            className={cn(
                            'absolute bg-card border-2 border-primary/50 group cursor-grab active:cursor-grabbing hover:border-primary transition-colors flex rounded-md',
                            selectedCabinetId === placed.instanceId && 'ring-2 ring-offset-2 ring-accent z-10',
                            dragging === placed.instanceId && 'shadow-lg z-20'
                            )}
                            style={{
                                left: placed.x,
                                top: placed.y,
                                width: placed.width / scaleFactor,
                                height: placed.depth / scaleFactor,
                            }}
                        >
                        {/* Render components inside */}
                        <div className={`h-full w-full flex p-1 gap-px ${treatAsHorizontalDoors ? 'flex-row' : 'flex-col-reverse'}`}>
                            {placed.components.map(comp => {
                                const compStyle = treatAsHorizontalDoors 
                                    ? { width: `${100 / placed.components.length}%` }
                                    : { height: `${(comp.height / placed.height) * 100}%` };

                                return (
                                    <div 
                                        key={comp.id}
                                        className={`relative bg-primary/20 border border-primary/30 rounded-sm flex items-center justify-center ${treatAsHorizontalDoors ? 'h-full' : 'w-full'}`}
                                        style={compStyle}
                                    >
                                        <span className="text-[9px] font-medium text-primary-foreground/70 select-none">{comp.type === 'drawer' ? 'Cajón' : 'Puerta'}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <Button
                            size="icon"
                            variant="destructive"
                            className="remove-btn absolute -top-3 -right-3 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={(e) => { e.stopPropagation(); onRemoveCabinet(placed.instanceId); }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                        </div>
                    );
                 })}
             </div>
        </div>
    );
}

// --- Main Component ---
export function KitchenLayout(props: KitchenLayoutProps) {
  const [is3D, setIs3D] = useState(false);

  const { onClearLayout } = props;

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm min-w-0">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-headline">Diseño de Cocina</h2>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <Label htmlFor="view-mode">Alzado 2D</Label>
                <Switch id="view-mode" checked={is3D} onCheckedChange={setIs3D} />
                <Label htmlFor="view-mode" className="flex items-center gap-1">
                    <Cuboid className="w-4 h-4" /> 3D
                </Label>
            </div>
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClearLayout} aria-label="Limpiar Diseño">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpiar Diseño</p>
              </TooltipContent>
            </Tooltip>
            </TooltipProvider>
        </div>
      </div>
      {is3D ? (
        <View3D 
            placedCabinets={props.placedCabinets} 
            selectedCabinetId={props.selectedCabinetId} 
            onSelectCabinet={props.onSelectCabinet} /> 
      ) : (
        <View2D 
            placedCabinets={props.placedCabinets} 
            onUpdateLayout={props.onUpdateLayout}
            onSelectCabinet={props.onSelectCabinet}
            onRemoveCabinet={props.onRemoveCabinet}
            selectedCabinetId={props.selectedCabinetId}
        />
      )}
    </div>
  );
}

// KitchenLayoutProps needs to be defined
interface KitchenLayoutProps {
  placedCabinets: PlacedCabinet[];
  onUpdateLayout: React.Dispatch<React.SetStateAction<PlacedCabinet[]>>;
  onClearLayout: () => void;
  onRemoveCabinet: (instanceId: string) => void;
  onSelectCabinet: (instanceId: string | null) => void;
  selectedCabinetId?: string | null;
}
