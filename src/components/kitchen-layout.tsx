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
  onSelectCabinet: (instanceId: string | null) => void;
  selectedCabinetId?: string;
};

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
  const width = placedCabinet.width * scale;
  const height = placedCabinet.height * scale;
  const depth = placedCabinet.depth * scale;
  
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
function View2D({ placedCabinets, onSelectCabinet, onRemoveCabinet, selectedCabinetId }: Pick<KitchenLayoutProps, 'placedCabinets' | 'onSelectCabinet' | 'onRemoveCabinet' | 'selectedCabinetId'>) {
    const layoutRef = useRef<HTMLDivElement>(null);
    const scaleFactor = 6;

    // Scroll to the end when a new cabinet is added
    useEffect(() => {
        if (layoutRef.current) {
            layoutRef.current.scrollLeft = layoutRef.current.scrollWidth;
        }
    }, [placedCabinets.length]);

    return (
        <div className="flex-1 p-4 overflow-x-auto overflow-y-hidden bg-muted/10" ref={layoutRef}>
             <div className="relative w-max h-full flex flex-row items-end gap-2">
                 {placedCabinets.map((placed) => {
                      return (
                          <div
                              key={placed.instanceId}
                              onClick={() => onSelectCabinet(placed.instanceId)}
                              className={cn(
                                'relative bg-card border-2 border-primary/50 group cursor-pointer hover:border-primary transition-colors flex flex-col-reverse p-1 gap-px rounded-md',
                                selectedCabinetId === placed.instanceId && 'ring-2 ring-offset-2 ring-accent'
                              )}
                              style={{
                                  width: placed.width / scaleFactor,
                                  height: placed.height / scaleFactor,
                              }}
                          >
                            {/* Render components inside */}
                            {placed.components.map(comp => {
                                const compHeightPercentage = (comp.height / placed.height) * 100;
                                return (
                                    <div 
                                        key={comp.id}
                                        className="relative w-full bg-primary/20 border border-primary/30 rounded-sm flex items-center justify-center"
                                        style={{ height: `${compHeightPercentage}%` }}
                                    >
                                        <span className="text-[9px] font-medium text-primary-foreground/70 select-none">{comp.type === 'drawer' ? 'Cajón' : 'Puerta'}</span>
                                    </div>
                                )
                            })}

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
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm">
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
            onSelectCabinet={props.onSelectCabinet}
            onRemoveCabinet={props.onRemoveCabinet}
            selectedCabinetId={props.selectedCabinetId}
        />
      )}
    </div>
  );
}
