'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Box, Grid as Grid3D, Text, Plane } from '@react-three/drei';
import type { PlacedCabinet, Appearance } from '@/lib/types';
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
  onClick,
  appearance,
}: {
  placedCabinet: PlacedCabinet;
  isSelected: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  appearance: Appearance;
}) {
  const cabinetInfo = cabinetData.find(c => c.id === placedCabinet.cabinetId);
  if (!cabinetInfo) return null;

  const scale = 0.005;
  const layoutScale = 0.04;
  const posX = placedCabinet.x * layoutScale;
  const posZ = placedCabinet.y * layoutScale;
  
  const height = placedCabinet.height * scale;
  const selectionColor = '#fcc419';

  const frontMaterial = <meshStandardMaterial color={isSelected ? selectionColor : appearance.frontColor} roughness={0.5} metalness={0.1} />;
  const carcassMaterial = <meshStandardMaterial color={isSelected ? '#dddddd' : appearance.carcassColor} roughness={0.8} metalness={0.1} />;
  const countertopMaterial = <meshStandardMaterial color={isSelected ? selectionColor : appearance.countertopColor} roughness={0.3} metalness={0.2} />;
  const jProfileMaterial = <meshStandardMaterial color={isSelected ? selectionColor : appearance.frontColor} roughness={0.4} metalness={0.2} />;


  if (placedCabinet.cabinetId === 'base-corner-900') {
    const wallSpace = placedCabinet.width * scale;
    const cabinetBodyDepth1 = placedCabinet.depth * scale;
    const cabinetBodyDepth2 = (placedCabinet.depth2 || placedCabinet.depth) * scale;
    
    const door1Width = (placedCabinet.width - (placedCabinet.depth2 || placedCabinet.depth)) * scale;
    const door2Width = (placedCabinet.width - placedCabinet.depth) * scale;
    const doorHeight = height - (2 * scale); // small gap
    const doorThickness = 0.09;

    return (
      <group position={[posX, 0, posZ]} onClick={onClick}>
        {/* Carcass */}
        <Box args={[wallSpace, height, cabinetBodyDepth1]} position={[wallSpace / 2, height / 2, cabinetBodyDepth1 / 2]} castShadow receiveShadow>
          {carcassMaterial}
        </Box>
        <Box args={[cabinetBodyDepth2, height, wallSpace - cabinetBodyDepth1]} position={[cabinetBodyDepth2 / 2, height / 2, cabinetBodyDepth1 + (wallSpace - cabinetBodyDepth1) / 2]} castShadow receiveShadow>
          {carcassMaterial}
        </Box>

        {/* Doors (simplified bifocal) */}
        <Box args={[door1Width, doorHeight, doorThickness]} position={[cabinetBodyDepth2 + door1Width / 2, height/2, cabinetBodyDepth1 - doorThickness/2]} castShadow>{frontMaterial}</Box>
        <Box args={[doorThickness, doorHeight, door2Width]} position={[cabinetBodyDepth2 - doorThickness/2, height/2, cabinetBodyDepth1 + door2Width / 2]} castShadow>{frontMaterial}</Box>
        
        {/* Countertop */}
        <group>
            <Box args={[wallSpace, 0.05, cabinetBodyDepth1]} position={[wallSpace / 2, height + 0.025, cabinetBodyDepth1 / 2]} castShadow>
              {countertopMaterial}
            </Box>
            <Box args={[cabinetBodyDepth2, 0.05, wallSpace - cabinetBodyDepth1]} position={[cabinetBodyDepth2 / 2, height + 0.025, cabinetBodyDepth1 + (wallSpace - cabinetBodyDepth1) / 2]} castShadow>
              {countertopMaterial}
            </Box>
        </group>
      </group>
    );
  }

  const width = placedCabinet.width * scale;
  const depth = placedCabinet.depth * scale;
  const treatAsHorizontalDoors = placedCabinet.type !== 'tall' && placedCabinet.components.length > 1 && placedCabinet.components.every(c => c.type === 'door');
  const doorThickness = 0.09;

  return (
    <group position={[posX + width / 2, 0, posZ + depth / 2]} onClick={onClick}>
      {/* Carcass */}
      <Box args={[width, height, depth]} position={[0, height / 2, 0]} castShadow receiveShadow>
        {carcassMaterial}
      </Box>

      {/* Components (fronts) */}
      <group position={[0, 0, depth / 2 + doorThickness/2]}>
        {treatAsHorizontalDoors ? (
          // Horizontal Doors
          placedCabinet.components.map((comp, index) => {
            const doorWidth = (width / placedCabinet.components.length) - (0.01 * (placedCabinet.components.length > 1 ? 1 : 0));
            const doorHeight = (comp.height * scale) - 0.02;
            const xOffset = (index * (doorWidth + 0.01)) - width/2 + doorWidth/2;

            return (
              <group key={comp.id} position={[xOffset, 0, 0]}>
                <Box args={[doorWidth - 0.02, doorHeight, doorThickness]} position={[0, height / 2, 0]} castShadow>
                  {frontMaterial}
                </Box>
                 {comp.handle === 'j-profile' && (
                    <Box args={[doorWidth - 0.02, 0.13, 0.02]} position={[0, height - 0.065, (doorThickness/2)+0.01]}>
                        {jProfileMaterial}
                    </Box>
                )}
              </group>
            )
          })
        ) : (
          // Vertical Components
          (() => {
            let yOffset = 0;
            const renderedComponents = [];
            for (const comp of placedCabinet.components) {
              const compHeight = comp.height * scale;
              const isVanityTwoDoor = comp.type === 'door' && placedCabinet.cabinetId === 'vanity-600-patas';

              if (comp.type !== 'opening') {
                if (isVanityTwoDoor) {
                  const doorWidth = (width / 2) - 0.01;
                  const doorHeight = compHeight - 0.02;
                  const xOffset = (doorWidth / 2) + 0.005;

                  renderedComponents.push(
                    <group key={comp.id} position={[0, yOffset, 0]}>
                      <Box args={[doorWidth, doorHeight, doorThickness]} position={[-xOffset, doorHeight / 2, 0]} castShadow>
                          {frontMaterial}
                      </Box>
                      <Box args={[doorWidth, doorHeight, doorThickness]} position={[xOffset, doorHeight / 2, 0]} castShadow>
                          {frontMaterial}
                      </Box>
                    </group>
                  );
                } else {
                  renderedComponents.push(
                    <group key={comp.id} position={[0, yOffset, 0]}>
                      <Box args={[width - 0.02, compHeight - 0.02, doorThickness]} position={[0, compHeight / 2, 0]} castShadow>
                        {frontMaterial}
                      </Box>
                      {comp.handle === 'j-profile' && (
                        <Box args={[width - 0.02, 0.13, 0.02]} position={[0, compHeight - 0.065, (doorThickness/2)+0.01]}>
                            {jProfileMaterial}
                        </Box>
                      )}
                      {comp.type === 'door' && comp.hinge === 'top' && (
                        <group position={[0, compHeight - 0.02, doorThickness/2]}>
                            <Box args={[0.1, 0.02, 0.02]} position={[-0.2, 0, 0]} />
                            <Box args={[0.1, 0.02, 0.02]} position={[0.2, 0, 0]} />
                        </group>
                      )}
                    </group>
                  );
                }
              }
              yOffset += compHeight + (placedCabinet.components.length > 1 ? 0.01 : 0);
            }
            return renderedComponents;
          })()
        )}
      </group>

      {/* Countertop */}
      {cabinetInfo.type === 'base' && (
        <Box args={[width, 0.05, depth]} position={[0, height + 0.025, 0]} castShadow>
          {countertopMaterial}
        </Box>
      )}
    </group>
  );
}


function View3D({ placedCabinets, selectedCabinetId, onSelectCabinet, appearance }: { placedCabinets: PlacedCabinet[], selectedCabinetId?: string, onSelectCabinet: (id: string | null) => void, appearance: Appearance }) {
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
                    appearance={appearance}
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
    const scaleFactor = 4;
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
                        const wallSpace = placed.width; // in mm
                        const bodyDepth1 = placed.depth; // in mm
                        const bodyDepth2 = placed.depth2 || placed.depth;

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
                                    width: wallSpace / scaleFactor,
                                    height: wallSpace / scaleFactor,
                                }}
                            >
                                <div
                                    className={cn(
                                        'w-full h-full',
                                        selectedCabinetId === placed.instanceId && 'ring-2 ring-offset-2 ring-accent'
                                    )}
                                    style={{
                                        clipPath: `polygon(0% 0%, 100% 0%, 100% ${ (bodyDepth2 / wallSpace) * 100 }%, ${ (bodyDepth1 / wallSpace) * 100 }% ${ (bodyDepth2 / wallSpace) * 100 }%, ${ (bodyDepth1 / wallSpace) * 100 }% 100%, 0% 100%)`
                                    }}
                                >
                                    <div className="w-full h-full bg-white border-2 border-slate-400 group-hover:border-slate-600 transition-colors rounded-md flex items-center justify-center text-xs font-mono text-slate-400">
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
                            'absolute bg-white border-2 border-slate-400 group cursor-grab active:cursor-grabbing hover:border-slate-600 transition-colors flex rounded-md shadow',
                            selectedCabinetId === placed.instanceId && 'ring-2 ring-offset-2 ring-accent z-10',
                            dragging === placed.instanceId && 'z-20'
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

                                const isVanityTwoDoor = comp.type === 'door' && placed.cabinetId === 'vanity-600-patas';

                                return (
                                    <div 
                                        key={comp.id}
                                        className={cn(
                                            'relative flex items-center justify-center', 
                                            isVanityTwoDoor ? '' : 'bg-slate-100 border border-slate-300 rounded-sm',
                                            treatAsHorizontalDoors ? 'h-full' : 'w-full'
                                        )}
                                        style={compStyle}
                                    >
                                      {isVanityTwoDoor ? (
                                          <div className="h-full w-full flex gap-px">
                                              <div className="w-1/2 h-full bg-slate-100 border border-slate-300 rounded-sm flex items-center justify-center">
                                                  <span className="text-[9px] font-semibold text-slate-600 select-none">Puerta</span>
                                              </div>
                                              <div className="w-1/2 h-full bg-slate-100 border border-slate-300 rounded-sm flex items-center justify-center">
                                                  <span className="text-[9px] font-semibold text-slate-600 select-none">Puerta</span>
                                              </div>
                                          </div>
                                      ) : (
                                          <span className="text-[9px] font-semibold text-slate-600 select-none">{comp.type === 'drawer' ? 'Cajón' : 'Puerta'}</span>
                                      )}
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
  const [is3D, setIs3D] = useState(true);

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
            onSelectCabinet={props.onSelectCabinet} 
            appearance={props.appearance}
        /> 
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
  appearance: Appearance;
}
