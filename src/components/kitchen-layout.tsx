'use client';

import React, { Suspense, useRef, useCallback, memo, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  Bounds,
  Box as DreiBox,
} from '@react-three/drei';
import type { PlacedCabinet, Appearance } from '@/lib/types';
import { Button } from './ui/button';
import { Trash2, Edit, RotateCcw, Move, LayoutGrid, View as ViewIcon } from 'lucide-react';
import * as THREE from 'three';
import { KitchenLayout2D } from './kitchen-layout-2d';

const SCALE = 1.5; // Visual scale factor

const Cabinet = memo(function Cabinet({
  cabinet,
  appearance,
}: {
  cabinet: PlacedCabinet;
  appearance: Appearance;
}) {
  const cabinetWidth = cabinet.width / 1000;
  const cabinetHeight = cabinet.height / 1000;
  const cabinetDepth = cabinet.depth / 1000;

  const isCorner = cabinet.cabinetId === 'base-corner-900';
  const isPlacar = cabinet.type === 'placar';

  // A single box represents the cabinet carcass visually for simplicity
  const boxArgs: [number, number, number] = [cabinetWidth, cabinetHeight, cabinetDepth];

  return (
    <group scale={SCALE}>
      {/* Carcass */}
      {isPlacar ? (
        <>
            {/* Floor */}
            <mesh position={[0, -cabinetHeight / 2 + 0.018 / 2, 0]}>
                <boxGeometry args={[cabinetWidth, 0.018, cabinetDepth]} />
                <meshStandardMaterial color={appearance.carcassColor} />
            </mesh>
            {/* Top */}
            <mesh position={[0, cabinetHeight / 2 - 0.018 / 2, 0]}>
                <boxGeometry args={[cabinetWidth, 0.018, cabinetDepth]} />
                <meshStandardMaterial color={appearance.carcassColor} />
            </mesh>
            {/* Left Side */}
            <mesh position={[-cabinetWidth / 2 + 0.018 / 2, 0, 0]}>
                <boxGeometry args={[0.018, cabinetHeight - 0.036, cabinetDepth]} />
                <meshStandardMaterial color={appearance.carcassColor} />
            </mesh>
            {/* Right Side */}
            <mesh position={[cabinetWidth / 2 - 0.018 / 2, 0, 0]}>
                <boxGeometry args={[0.018, cabinetHeight - 0.036, cabinetDepth]} />
                <meshStandardMaterial color={appearance.carcassColor} />
            </mesh>
            {/* Back */}
            <mesh position={[0, 0, -cabinetDepth / 2 + 0.003 / 2]}>
                <boxGeometry args={[cabinetWidth - 0.036, cabinetHeight - 0.036, 0.003]} />
                <meshStandardMaterial color={appearance.carcassColor} transparent opacity={0.5} />
            </mesh>
        </>
      ) : (
        <mesh>
          <boxGeometry args={boxArgs} />
          <meshStandardMaterial color={appearance.carcassColor} />
        </mesh>
      )}


       {/* Countertop for base cabinets */}
      {cabinet.type === 'base' && !isCorner && (
        <mesh position={[0, cabinetHeight / 2 + 0.015, 0]}>
            <boxGeometry args={[cabinetWidth, 0.03, cabinetDepth]} />
            <meshStandardMaterial color={appearance.countertopColor} />
        </mesh>
      )}

      {/* Front Components (Doors/Drawers) or Placar Interior */}
      {isPlacar ? (
        cabinet.components.map((comp, index) => {
            const totalHeightSoFar = cabinet.components
              .slice(0, index)
              .reduce((acc, c) => acc + c.height / 1000, 0);

            const compHeight = comp.height / 1000;
            const interiorBottomY = -cabinetHeight / 2 + 0.018; 
            const yPos = interiorBottomY + totalHeightSoFar + compHeight / 2;
            
            if (comp.type === 'shelf') {
                 return (
                    <mesh
                        key={comp.id}
                        position={[0, yPos, 0]}
                    >
                        <boxGeometry args={[cabinetWidth - 0.036, compHeight, cabinetDepth - 0.02]} />
                        <meshStandardMaterial color={appearance.frontColor} />
                    </mesh>
                );
            }

            if (comp.type === 'hanging-rail') {
                 return (
                    <mesh
                        key={comp.id}
                        position={[0, yPos, 0]}
                        rotation={[0, 0, Math.PI / 2]}
                    >
                        <cylinderGeometry args={[0.012, 0.012, cabinetWidth - 0.05, 16]} />
                        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
                    </mesh>
                );
            }
            return null;
        })
      ) : (
       !isCorner && cabinet.components.map((comp, index) => {
        const totalHeightSoFar = cabinet.components
          .slice(0, index)
          .reduce((acc, c) => acc + c.height / 1000, 0);

        const compHeight = comp.height / 1000;
        const yPos = -cabinetHeight / 2 + totalHeightSoFar + compHeight / 2;

        const treatAsHorizontalDoors = cabinet.type !== 'tall' && cabinet.components.length > 1 && cabinet.components.every(c => c.type === 'door');
        
        // Special rendering for two-door vanitory
        const isVanityTwoDoor = comp.type === 'door' && cabinet.cabinetId.startsWith('vanity');
        if (isVanityTwoDoor) {
             const singleDoorWidth = (cabinetWidth - 0.015) / 2;
             return (
                 <React.Fragment key={comp.id}>
                    {/* Left Door */}
                    <mesh position={[-singleDoorWidth/2 - 0.0025, yPos, cabinetDepth / 2 + 0.001]}>
                        <boxGeometry args={[singleDoorWidth, compHeight - 0.01, 0.018]} />
                        <meshStandardMaterial color={appearance.frontColor} />
                    </mesh>
                     {/* Right Door */}
                    <mesh position={[singleDoorWidth/2 + 0.0025, yPos, cabinetDepth / 2 + 0.001]}>
                        <boxGeometry args={[singleDoorWidth, compHeight - 0.01, 0.018]} />
                        <meshStandardMaterial color={appearance.frontColor} />
                    </mesh>
                 </React.Fragment>
             )
        }

        // Rendering for horizontal doors
        if (treatAsHorizontalDoors) {
            const numHorizontalDoors = cabinet.components.length;
            const doorWidth = (cabinetWidth / numHorizontalDoors) - 0.005;
            const xPos = (-cabinetWidth/2) + (index * (doorWidth + 0.005)) + (doorWidth/2);
            return (
                 <mesh
                    key={comp.id}
                    position={[xPos, yPos, cabinetDepth / 2 + 0.001]}
                >
                    <boxGeometry args={[doorWidth, compHeight - 0.01, 0.018]} />
                    <meshStandardMaterial color={appearance.frontColor} />
                </mesh>
            );
        }
        
        // Default single front component
        return (
          <mesh
            key={comp.id}
            position={[0, yPos, cabinetDepth / 2 + 0.001]}
          >
            <boxGeometry args={[cabinetWidth - 0.01, compHeight - 0.01, 0.018]} />
            <meshStandardMaterial color={appearance.frontColor} />
          </mesh>
        );
      }))}
    </group>
  );
});


const Scene = memo(function Scene({
  placedCabinets,
  appearance,
  selectedInstanceId,
  transformMode,
  onSelectInstance,
  onUpdateTransform,
}: Omit<KitchenLayoutProps, 'onClearLayout' | 'onRemoveCabinet'> & { transformMode: 'translate' | 'rotate' }) {
  const controlRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Group>(null);

  const selectedObject = React.useMemo(() => {
    if (selectedInstanceId && sceneRef.current) {
      return sceneRef.current.getObjectByName(selectedInstanceId);
    }
    return undefined;
  }, [selectedInstanceId, placedCabinets]); // depend on placedCabinets to re-find object if list changes

  useEffect(() => {
    const control = controlRef.current;
    if (control) {
      const callback = (event: any) => {
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = !event.value;
          }
      };
      control.addEventListener('dragging-changed', callback);
      return () => control.removeEventListener('dragging-changed', callback);
    }
  });

  const handleTransformEnd = useCallback(() => {
    if (controlRef.current?.object) {
      const object = controlRef.current.object;
      onUpdateTransform(object.name, {
        position: [object.position.x, object.position.y, object.position.z],
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
      });
    }
  }, [onUpdateTransform]);
  
  const handlePointerMissed = useCallback(
      (e: any) => {
          if (e.type === 'click' && e.target.localName !== 'canvas') {
              onSelectInstance(null);
          }
      },
      [onSelectInstance]
  );
  
  const handleObjectClick = useCallback((e: any, instanceId: string) => {
      e.stopPropagation();
      onSelectInstance(instanceId);
  }, [onSelectInstance]);

  const handleObjectDoubleClick = useCallback((e: any, instanceId: string) => {
      e.stopPropagation();
      onSelectInstance(instanceId);
  }, [onSelectInstance]);
  
  useEffect(() => {
    const control = controlRef.current;
    if (control) {
      // This is the callback that will be executed when the user drags the object.
      const handleCollisionDetection = () => {
        if (!control.object) return;
        
        const object = control.object;
        const cabinetInfo = placedCabinets.find(c => c.instanceId === object.name);

        if (!cabinetInfo) return;

        // Get the cabinet's dimensions (in meters)
        const cabinetWidth = (cabinetInfo.width / 1000) * SCALE;
        const cabinetHeight = (cabinetInfo.height / 1000) * SCALE;
        const cabinetDepth = (cabinetInfo.depth / 1000) * SCALE;

        // --- Collision with the Floor ---
        const floorLimitY = cabinetHeight / 2;
        if (object.position.y < floorLimitY) {
          object.position.y = floorLimitY;
        }

        // --- Collision with the Back Wall ---
        const backWallLimitZ = cabinetDepth / 2;
        if (object.position.z < backWallLimitZ) {
          object.position.z = backWallLimitZ;
        }
        
        // --- Collision with the Left Side Wall ---
        const leftWallLimitX = -10 + (cabinetWidth / 2);
        if (object.position.x < leftWallLimitX) {
          object.position.x = leftWallLimitX;
        }
        
        // --- Collision with the Right Side Wall ---
        const rightWallLimitX = 10 - (cabinetWidth / 2);
        if (object.position.x > rightWallLimitX) {
          object.position.x = rightWallLimitX;
        }
      };

      control.addEventListener('objectChange', handleCollisionDetection);
      
      return () => control.removeEventListener('objectChange', handleCollisionDetection);
    }
  }, [placedCabinets, selectedObject]);


  return (
    <Bounds fit clip observe margin={1.2}>
      <group ref={sceneRef} onPointerMissed={handlePointerMissed}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <hemisphereLight groundColor="white" intensity={0.5} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 10]}
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#A0785A" />
      </mesh>
      
      {/* Back Wall */}
      <mesh position={[0, 2, 0]} >
         <planeGeometry args={[20, 4]} />
         <meshStandardMaterial color="#F5F5DC" />
      </mesh>
      
      {/* Side Wall (Left) */}
      <mesh position={[-10, 2, 10]} rotation={[0, Math.PI / 2, 0]} >
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>
      
      {/* Side Wall (Right) */}
      <mesh position={[10, 2, 10]} rotation={[0, -Math.PI / 2, 0]} >
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>


      <Suspense fallback={null}>
        {placedCabinets.map((cabinet) => {
            const isSelected = selectedInstanceId === cabinet.instanceId;
            return (
                <group 
                    key={cabinet.instanceId} 
                    name={cabinet.instanceId}
                    position={cabinet.position}
                    rotation={cabinet.rotation}
                    onClick={(e) => handleObjectClick(e, cabinet.instanceId)} 
                    onDoubleClick={(e) => handleObjectDoubleClick(e, cabinet.instanceId)}
                >
                    <Cabinet
                        cabinet={cabinet}
                        appearance={appearance}
                    />
                     {isSelected && (
                        <DreiBox
                            scale={SCALE}
                            args={[
                                (cabinet.width / 1000) + 0.02, 
                                (cabinet.height / 1000) + 0.02, 
                                (cabinet.depth / 1000) + 0.02
                            ]}
                        >
                            <meshStandardMaterial color={'hsl(var(--accent))'} emissive={'hsl(var(--accent))'} emissiveIntensity={0.4} wireframe />
                        </DreiBox>
                    )}
                </group>
            )
        })}
      </Suspense>

      {selectedObject && (
        <TransformControls
          ref={controlRef}
          object={selectedObject as THREE.Object3D}
          mode={transformMode}
          onMouseUp={handleTransformEnd}
          onDraggingChanged={(e) => orbitControlsRef.current && (orbitControlsRef.current.enabled = !e.value)}
        />
      )}
      </group>

      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        minDistance={1}
        maxDistance={25}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, 1.2, 0]}
      />
    </Bounds>
  );
});

export function KitchenLayout(props: KitchenLayoutProps) {
  const { onClearLayout, onSelectInstance, selectedInstanceId, onRemoveCabinet } = props;
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm relative">
      <div className="p-2 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-headline pl-2">Diseñador</h2>
            <div className="flex items-center rounded-md bg-muted p-1">
                <Button
                    variant={viewMode === '2d' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('2d')}
                    title="Vista 2D"
                >
                    <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                    variant={viewMode === '3d' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('3d')}
                    title="Vista 3D"
                >
                    <ViewIcon className="w-4 h-4" />
                </Button>
            </div>
        </div>
        <div className="flex items-center space-x-2">
           {viewMode === '3d' && (
             <>
                <Button
                    variant={transformMode === 'translate' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setTransformMode('translate')}
                    disabled={!selectedInstanceId}
                    title="Mover"
                >
                    <Move className="w-5 h-5" />
                </Button>
                <Button
                    variant={transformMode === 'rotate' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setTransformMode('rotate')}
                    disabled={!selectedInstanceId}
                    title="Rotar"
                >
                    <RotateCcw className="w-5 h-5" />
                </Button>
             </>
           )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectedInstanceId && onSelectInstance(selectedInstanceId)}
            disabled={!selectedInstanceId}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectedInstanceId && onRemoveCabinet(selectedInstanceId)}
            disabled={!selectedInstanceId}
            title="Eliminar mueble"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearLayout}
            aria-label="Limpiar Diseño"
            title="Limpiar todo el diseño"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {viewMode === '3d' ? (
        <Canvas
            shadows
            camera={{ position: [0, 1.5, 12], fov: 50 }}
            className="flex-1 bg-muted/20"
        >
            <Scene {...props} transformMode={transformMode} />
        </Canvas>
      ) : (
        <KitchenLayout2D 
            placedCabinets={props.placedCabinets}
            selectedInstanceId={props.selectedInstanceId}
            onSelectInstance={props.onSelectInstance}
        />
      )}
    </div>
  );
}

interface KitchenLayoutProps {
  placedCabinets: PlacedCabinet[];
  onClearLayout: () => void;
  onRemoveCabinet: (id: string) => void;
  appearance: Appearance;
  selectedInstanceId: string | null;
  onSelectInstance: (id: string | null) => void;
  onUpdateTransform: (
    id: string,
    transform: {
      position: [number, number, number];
      rotation: [number, number, number];
    }
  ) => void;
}
