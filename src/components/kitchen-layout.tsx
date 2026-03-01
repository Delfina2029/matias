'use client';

import React, { Suspense, useRef, useCallback, memo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  Box,
  Plane,
} from '@react-three/drei';
import type { PlacedCabinet, Appearance } from '@/lib/types';
import { Button } from './ui/button';
import { Trash2, Edit, RotateCcw, Move } from 'lucide-react';
import * as THREE from 'three';

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

  return (
    <group
      name={cabinet.instanceId}
      position={cabinet.position}
      rotation={cabinet.rotation}
    >
      {/* Carcass */}
      <Box args={[cabinetWidth, cabinetHeight, cabinetDepth]}>
        <meshStandardMaterial color={appearance.carcassColor} />
      </Box>

      {/* Countertop for base cabinets */}
      {(cabinet.type === 'base') && (
        <Box
          args={[cabinetWidth, 0.03, cabinetDepth]}
          position={[0, cabinetHeight / 2 + 0.015, 0]}
        >
          <meshStandardMaterial color={appearance.countertopColor} />
        </Box>
      )}
      
      {/* Front Components (Doors/Drawers) */}
      {cabinet.components.map((comp) => {
        // Calculate the running total height of components before this one
        const totalHeightSoFar = cabinet.components
          .slice(0, cabinet.components.findIndex((c) => c.id === comp.id))
          .reduce((acc, c) => acc + c.height / 1000, 0);

        const compHeight = comp.height / 1000;
        const yPos = -cabinetHeight / 2 + totalHeightSoFar + compHeight / 2;

        return (
          <Box
            key={comp.id}
            args={[cabinetWidth - 0.01, compHeight - 0.01, 0.018]}
            position={[0, yPos, cabinetDepth / 2 + 0.009]}
          >
            <meshStandardMaterial color={appearance.frontColor} />
          </Box>
        );
      })}
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
  onOpenEditor,
}: Omit<KitchenLayoutProps, 'onClearLayout' | 'onRemoveCabinet'> & { transformMode: 'translate' | 'rotate' }) {
  const controlRef = useRef<any>(null);
  const orbitControlsRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Group>(null);

  const selectedObject = React.useMemo(() => {
    if (selectedInstanceId && sceneRef.current) {
      return sceneRef.current.getObjectByName(selectedInstanceId);
    }
    return undefined;
  }, [selectedInstanceId]);

  // Disable orbit controls when transform controls are being dragged
  useEffect(() => {
    const control = controlRef.current;
    if (control) {
      const callback = (event: any) => (orbitControlsRef.current.enabled = !event.value);
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

  const findCabinetGroup = useCallback(
    (object: THREE.Object3D): THREE.Group | null => {
      if (!object) return null;
      if (object.name && object.name.startsWith('cab_') && object.type === 'Group') {
        return object as THREE.Group;
      }
      if (object.parent) {
        return findCabinetGroup(object.parent);
      }
      return null;
    },
    []
  );

  const handleSceneClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (e.delta < 2) { 
        const group = findCabinetGroup(e.object);
        onSelectInstance(group?.name ?? null);
      }
    },
    [findCabinetGroup, onSelectInstance]
  );

  const handleSceneDoubleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      const group = findCabinetGroup(e.object);
      if (group) {
        onOpenEditor(group.name);
      }
    },
    [findCabinetGroup, onOpenEditor]
  );
  
  return (
    <group ref={sceneRef} onClick={handleSceneClick} onDoubleClick={handleSceneDoubleClick}>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <hemisphereLight groundColor="white" intensity={0.5} />

      <Plane
        args={[10, 10]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial color="#A0785A" />
      </Plane>
      <Plane args={[10, 4]} rotation={[0, 0, 0]} position={[0, 2, -5]}>
        <meshStandardMaterial color="#F5F5DC" />
      </Plane>
      <Plane args={[10, 4]} rotation={[0, Math.PI / 2, 0]} position={[-5, 2, 0]}>
        <meshStandardMaterial color="#F5F5DC" />
      </Plane>

      <Suspense fallback={null}>
        {placedCabinets.map((cabinet) => (
          <Cabinet
            key={cabinet.instanceId}
            cabinet={cabinet}
            appearance={appearance}
          />
        ))}
      </Suspense>

      {selectedObject && (
        <TransformControls
          ref={controlRef}
          object={selectedObject as THREE.Object3D}
          mode={transformMode}
          onMouseUp={handleTransformEnd}
        />
      )}

      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        minDistance={0.1}
        maxPolarAngle={Math.PI / 2}
        target={[0, 1, -4]}
      />
    </group>
  );
});

export function KitchenLayout(props: KitchenLayoutProps) {
  const { onClearLayout, onOpenEditor, selectedInstanceId, onRemoveCabinet } = props;
  const [transformMode, setTransformMode] =
    React.useState<'translate' | 'rotate'>('translate');

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm relative">
      <div className="p-2 border-b flex justify-between items-center">
        <h2 className="text-lg font-headline pl-2">Diseñador 3D</h2>
        <div className="flex items-center space-x-2">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selectedInstanceId && onOpenEditor(selectedInstanceId)}
            disabled={!selectedInstanceId}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Medidas
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
      <Canvas
        shadows
        camera={{ position: [2, 1.5, 0], fov: 60 }}
        className="flex-1 bg-muted/20"
      >
        <Scene {...props} transformMode={transformMode} />
      </Canvas>
    </div>
  );
}

type SceneProps = Omit<KitchenLayoutProps, 'onClearLayout' | 'onRemoveCabinet'> & {
  transformMode: 'translate' | 'rotate';
};

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
  onOpenEditor: (id: string) => void;
}
