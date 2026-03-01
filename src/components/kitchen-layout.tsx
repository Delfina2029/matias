'use client';

import React, { Suspense, useRef, useCallback, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls, useCursor, Box, Plane } from '@react-three/drei';
import type { PlacedCabinet, Appearance } from '@/lib/types';
import { Button } from './ui/button';
import { Trash2, Edit, RotateCcw, Move } from 'lucide-react';
import * as THREE from 'three';

// Helper component to render a single cabinet
const Cabinet = memo(({ 
    cabinet, 
    appearance,
    onClick,
    onDoubleClick,
}: { 
    cabinet: PlacedCabinet, 
    appearance: Appearance,
    onClick: (id: string) => void,
    onDoubleClick: (id: string) => void
}) => {
  const [hovered, setHovered] = React.useState(false);
  useCursor(hovered);

  const cabinetWidth = cabinet.width / 1000;
  const cabinetHeight = cabinet.height / 1000;
  const cabinetDepth = cabinet.depth / 1000;

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(true);
  }, []);

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation();
    setHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    onClick(cabinet.instanceId);
  }, [onClick, cabinet.instanceId]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(cabinet.instanceId);
  }, [onDoubleClick, cabinet.instanceId]);
  
  return (
    <group 
      name={cabinet.instanceId} // Use instanceId as name to find it in the scene
      position={cabinet.position} 
      rotation={cabinet.rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
        {/* Main carcass */}
        <Box args={[cabinetWidth, cabinetHeight, cabinetDepth]}>
            <meshStandardMaterial color={appearance.carcassColor} transparent opacity={hovered ? 0.9 : 1.0} />
        </Box>
        
        {/* Countertop for base cabinets */}
        {cabinet.type === 'base' && (
            <Box args={[cabinetWidth, 0.03, cabinetDepth]} position={[0, cabinetHeight / 2 + 0.015, 0]}>
                <meshStandardMaterial color={appearance.countertopColor} />
            </Box>
        )}
         
        {cabinet.components.map((comp) => {
            const totalHeightSoFar = cabinet.components
                .slice(0, cabinet.components.findIndex(c => c.id === comp.id))
                .reduce((acc, c) => acc + c.height / 1000, 0);

            const compHeight = comp.height / 1000;
            const yPos = -cabinetHeight / 2 + totalHeightSoFar + compHeight / 2;

            return (
                 <Box key={comp.id} args={[cabinetWidth - 0.01, compHeight - 0.01, 0.018]} position={[0, yPos, cabinetDepth/2 + 0.009]}>
                    <meshStandardMaterial color={appearance.frontColor} />
                </Box>
            )
        })}

    </group>
  );
});
Cabinet.displayName = 'Cabinet';


// The main scene component
function Scene({ 
    placedCabinets, 
    appearance, 
    selectedInstanceId, 
    onSelectInstance, 
    onUpdateTransform,
    onOpenEditor,
    transformMode,
}: SceneProps) {
    
    const controlRef = useRef<any>(null);
    const sceneRef = useRef<THREE.Scene>(null);

    const selectedObject = React.useMemo(() => {
      if (selectedInstanceId && sceneRef.current) {
        return sceneRef.current.getObjectByName(selectedInstanceId);
      }
      return undefined;
    }, [selectedInstanceId]);


    const handleTransformEnd = useCallback(() => {
        if (controlRef.current?.object) {
            const object = controlRef.current.object;
            onUpdateTransform(object.name, {
                position: [object.position.x, object.position.y, object.position.z],
                rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
            });
        }
    }, [onUpdateTransform]);

    const findCabinetGroup = useCallback((object: THREE.Object3D): THREE.Object3D | null => {
        if (!object) return null;
        if (object.name && object.name.startsWith('cab_')) {
            return object;
        }
        if (object.parent) {
            return findCabinetGroup(object.parent);
        }
        return null;
    }, []);

    const handleSceneClick = useCallback((e: any) => {
        e.stopPropagation();
        const group = findCabinetGroup(e.object);
        if (group) {
            onSelectInstance(group.name);
        } else {
            onSelectInstance(null);
        }
    }, [findCabinetGroup, onSelectInstance]);
    
    const handleSceneDoubleClick = useCallback((e: any) => {
        e.stopPropagation();
        const group = findCabinetGroup(e.object);
        if (group) {
            onOpenEditor(group.name);
        }
    }, [findCabinetGroup, onOpenEditor]);
    
    return (
        <scene 
            ref={sceneRef}
        >
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <hemisphereLight groundColor="white" intensity={0.5} />
            
            <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={handleSceneClick}>
                <meshStandardMaterial color="#A0785A" />
            </Plane>
            <Plane args={[10, 4]} rotation={[0, 0, 0]} position={[0, 2, -5]} onClick={handleSceneClick}>
                <meshStandardMaterial color="#F5F5DC" />
            </Plane>
            <Plane args={[10, 4]} rotation={[0, Math.PI / 2, 0]} position={[-5, 2, 0]} onClick={handleSceneClick}>
                <meshStandardMaterial color="#F5F5DC" />
            </Plane>
            
            <Suspense fallback={null}>
                {placedCabinets.map(cabinet => (
                    <Cabinet
                        key={cabinet.instanceId}
                        cabinet={cabinet}
                        appearance={appearance}
                        onClick={onSelectInstance}
                        onDoubleClick={onOpenEditor}
                    />
                ))}
            </Suspense>
            
            {selectedObject && (
                <TransformControls 
                    ref={controlRef} 
                    object={selectedObject as THREE.Object3D} 
                    mode={transformMode}
                    onMouseUp={handleTransformEnd}
                    onObjectChange={() => {
                      if (controlRef.current) {
                        const object = controlRef.current.object;
                        if (object.position.y < 0) {
                          object.position.y = 0;
                        }
                      }
                    }}
                />
            )}

            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2} />
        </scene>
    );
}

export function KitchenLayout(props: KitchenLayoutProps) {
  const { onClearLayout, onOpenEditor, selectedInstanceId } = props;
  const [transformMode, setTransformMode] = React.useState<'translate' | 'rotate'>('translate');

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm relative">
      <div className="p-2 border-b flex justify-between items-center">
        <h2 className="text-lg font-headline pl-2">Diseñador 3D</h2>
        <div className="flex items-center space-x-2">
            <Button variant={transformMode === 'translate' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTransformMode('translate')} disabled={!selectedInstanceId} title="Mover">
                <Move className="w-5 h-5" />
            </Button>
            <Button variant={transformMode === 'rotate' ? 'secondary' : 'ghost'} size="icon" onClick={() => setTransformMode('rotate')} disabled={!selectedInstanceId} title="Rotar">
                <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onOpenEditor(selectedInstanceId)} disabled={!selectedInstanceId}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Medidas
            </Button>
            <Button variant="ghost" size="icon" onClick={onClearLayout} aria-label="Limpiar Diseño">
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
        </div>
      </div>
      <Canvas
        shadows
        camera={{ position: [4, 2.5, 5], fov: 50 }}
        className="flex-1 bg-muted/20"
      >
        <Scene {...props} transformMode={transformMode} />
      </Canvas>
    </div>
  );
}

type SceneProps = KitchenLayoutProps;

interface KitchenLayoutProps {
  placedCabinets: PlacedCabinet[];
  onClearLayout: () => void;
  appearance: Appearance;
  selectedInstanceId: string | null;
  onSelectInstance: (id: string | null) => void;
  onUpdateTransform: (id: string, transform: { position: [number, number, number], rotation: [number, number, number] }) => void;
  onOpenEditor: (id: string | null) => void;
}
