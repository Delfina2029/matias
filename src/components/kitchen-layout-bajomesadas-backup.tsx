'use client';

import React, { Suspense, useRef, useCallback, memo, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  TransformControls,
  Bounds,
  Box as DreiBox,
} from '@react-three/drei';
import type { PlacedCabinet, Appearance } from '@/lib/types';
import { Button } from './ui/button';
import { Trash2, Edit, RotateCcw, Move, LayoutGrid, View as ViewIcon, Sparkles, Loader2, Square, Ruler } from 'lucide-react';
import * as THREE from 'three';
import { KitchenLayoutPlan } from './kitchen-layout-plan';
import { TechnicalView2D } from './technical-view-2d';
import { getTexture } from '@/lib/textures';

const SCALE = 1.5; // Visual scale factor

function CADBox({ 
  args, 
  position, 
  rotation, 
  map,
  color,
  opacity,
  transparent,
  onClick,
}: { 
  args: [number, number, number]; 
  position?: [number, number, number]; 
  rotation?: [number, number, number]; 
  map?: any; 
  color?: string; 
  opacity?: number;
  transparent?: boolean;
  onClick?: (e: any) => void;
}) {
  const [w, h, d] = args;
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), [w, h, d]);
  
  return (
    <mesh position={position} rotation={rotation} onClick={onClick}>
      <boxGeometry args={args} />
      <meshStandardMaterial 
        map={map} 
        color={color} 
        roughness={0.6} 
        metalness={0.05}
        opacity={opacity}
        transparent={transparent}
      />
      <lineSegments geometry={edgesGeom}>
        <lineBasicMaterial color="#1a202c" linewidth={2} />
      </lineSegments>
    </mesh>
  );
}

function CADLShapeComponent({ 
  w1, w2, d1, d2, thickness, y, map, color, onClick
}: any) {
  const { shape, extrudeSettings } = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w1/2, -w2/2); // Outer Back Left
    s.lineTo(w1/2, -w2/2);  // Outer Back Right
    s.lineTo(w1/2, -w2/2 + d1); // Inner Front Right
    s.lineTo(-w1/2 + d2, -w2/2 + d1); // Inner Corner
    s.lineTo(-w1/2 + d2, w2/2); // Inner Front Left
    s.lineTo(-w1/2, w2/2); // Outer Front Left
    s.lineTo(-w1/2, -w2/2);
    return { shape: s, extrudeSettings: { depth: thickness, bevelEnabled: false } };
  }, [w1, w2, d1, d2, thickness]);
  
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(new THREE.ExtrudeGeometry(shape, extrudeSettings)), [shape, extrudeSettings]);

  return (
    <mesh position={[0, y + thickness / 2, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={onClick}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial map={map} color={color} />
      <lineSegments geometry={edgesGeom}>
        <lineBasicMaterial color="#1a202c" linewidth={2} />
      </lineSegments>
    </mesh>
  );
}

function CADHandle({ 
  length = 0.15, 
  vertical = false,
  position 
}: { 
  length?: number; 
  vertical?: boolean; 
  position: [number, number, number];
}) {
  const rotation: [number, number, number] = vertical ? [0, 0, Math.PI / 2] : [0, 0, 0];
  
  return (
    <group position={position} rotation={rotation}>
      {/* Pull Bar */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[length, 0.008, 0.008]} />
        <meshStandardMaterial color="#dcdcdc" metalness={0.95} roughness={0.08} />
      </mesh>
      {/* Left/Top post */}
      <mesh position={[-length / 2 + 0.01, 0, 0.0075]}>
        <boxGeometry args={[0.006, 0.006, 0.015]} />
        <meshStandardMaterial color="#dcdcdc" metalness={0.95} roughness={0.08} />
      </mesh>
      {/* Right/Bottom post */}
      <mesh position={[length / 2 - 0.01, 0, 0.0075]}>
        <boxGeometry args={[0.006, 0.006, 0.015]} />
        <meshStandardMaterial color="#dcdcdc" metalness={0.95} roughness={0.08} />
      </mesh>
    </group>
  );
}

const Cabinet = memo(function Cabinet({
  cabinet,
  appearance,
  explode = 0,
  openedComponents = {},
  toggleComponentOpen = () => {},
  onSelectPiece = () => {},
}: {
  cabinet: PlacedCabinet;
  appearance: Appearance;
  explode?: number;
  openedComponents?: Record<string, boolean>;
  toggleComponentOpen?: (id: string) => void;
  onSelectPiece?: (piece: { name: string, dimensions: string } | null) => void;
}) {
  const cabinetWidth = cabinet.width / 1000;
  const cabinetHeight = cabinet.height / 1000;
  const cabinetDepth = cabinet.depth / 1000;
  const isHangingVanity = cabinet.cabinetId.startsWith('vanity-hanging');
  const isGolaPatasVanity = cabinet.cabinetId === 'vanity-patas-1d1o' || cabinet.cabinetId === 'vanity-patas-3d' || cabinet.cabinetId === 'vanity-patas-1d2p' || cabinet.cabinetId === 'vanity-patas-2p';
  const isGolaVanity = isHangingVanity || isGolaPatasVanity;
  const isGolaBaseDoor = cabinet.cabinetId === 'base-1p' || cabinet.cabinetId === 'base-2p';
  const isGolaBaseDrawer = cabinet.cabinetId === 'base-2c' || cabinet.cabinetId === 'base-3c' || cabinet.cabinetId === 'base-4c';
  const isGolaBase = isGolaBaseDoor || isGolaBaseDrawer;
  const isInset = appearance.frontStyle === 'inset' || isGolaVanity;
  const carcassDepth = isInset ? cabinetDepth : cabinetDepth - 0.02; // full depth if inset
  const interiorDepth = cabinetDepth - 0.02;
  const melamineThickness = 0.018;
  const interiorWidth = cabinetWidth - 2 * melamineThickness;

  const isCorner = cabinet.cabinetId === 'base-corner';
  const cabinetWidth2 = (cabinet.width2 || cabinet.width) / 1000;
  const cabinetDepth2 = (cabinet.depth2 || cabinet.depth) / 1000;
  const carcassDepth1 = isInset ? cabinetDepth : cabinetDepth - 0.02; // full depth if inset
  const carcassDepth2 = isInset ? cabinetDepth2 : cabinetDepth2 - 0.02; // same for the second body

  const legHeight = cabinet.useLegs ? 0.1 : 0;

  const frontTexture = useMemo(() => getTexture('#ffffff', appearance.frontColorName), [appearance.frontColorName]);
  const carcassTexture = useMemo(() => getTexture('#ffffff', appearance.carcassColorName), [appearance.carcassColorName]);
  const countertopTexture = useMemo(() => getTexture('#ffffff', appearance.countertopColorName), [appearance.countertopColorName]);

  return (
    <group scale={SCALE}>
      {/* Carcass */}
      {isCorner ? (
        <group>
            {/* Fondo Esquinero Trasero 1 (Fibroplus) */}
            <CADBox 
              args={[cabinetWidth, cabinetHeight - legHeight, 0.003]}
              position={[0, legHeight / 2, -cabinetWidth2 / 2 + 0.0015]}
              map={undefined}
              color="#f8f9fa"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Fondo Esquinero Trasero 1', dimensions: `${Math.round(cabinetWidth * 1000)} x ${Math.round((cabinetHeight - legHeight) * 1000)} x 3 mm (Fibroplus)` });
              }}
            />
            {/* Fondo Esquinero Trasero 2 (Fibroplus) */}
            <CADBox 
              args={[0.003, cabinetHeight - legHeight, cabinetWidth2 - 0.003]}
              position={[-cabinetWidth / 2 + 0.0015, legHeight / 2, 0.0015]}
              map={undefined}
              color="#f8f9fa"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Fondo Esquinero Trasero 2', dimensions: `${Math.round((cabinetWidth2 - 0.003) * 1000)} x ${Math.round((cabinetHeight - legHeight) * 1000)} x 3 mm (Fibroplus)` });
              }}
            />
            
            {/* Lateral Esquinero Derecho (18mm) */}
            <CADBox
              args={[melamineThickness, cabinetHeight - legHeight, carcassDepth1]}
              position={[cabinetWidth / 2 - melamineThickness / 2, legHeight / 2, -cabinetWidth2 / 2 + carcassDepth1 / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Lateral Esquinero Derecho', dimensions: `${Math.round(carcassDepth1 * 1000)} x ${Math.round((cabinetHeight - legHeight) * 1000)} x 18 mm` });
              }}
            />

            {/* Lateral Esquinero Izquierdo (18mm) */}
            <CADBox
              args={[carcassDepth2, cabinetHeight - legHeight, melamineThickness]}
              position={[-cabinetWidth / 2 + carcassDepth2 / 2, legHeight / 2, cabinetWidth2 / 2 - melamineThickness / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Lateral Esquinero Izquierdo', dimensions: `${Math.round(carcassDepth2 * 1000)} x ${Math.round((cabinetHeight - legHeight) * 1000)} x 18 mm` });
              }}
            />
            {/* L-Shape Bottom Floor */}
            <CADLShapeComponent
              w1={cabinetWidth}
              w2={cabinetWidth2}
              d1={carcassDepth1}
              d2={carcassDepth2}
              thickness={melamineThickness}
              y={-cabinetHeight / 2 + legHeight}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e: any) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Piso Esquinero (L)', dimensions: `${Math.round(cabinetWidth * 1000)} x ${Math.round(cabinetWidth2 * 1000)} x 18 mm (Corte L)` });
              }}
            />



            {/* Estante Esquinero (L) */}
            {cabinet.type === 'base' && (
              <CADLShapeComponent
                w1={cabinetWidth - 0.005}
                w2={cabinetWidth2 - 0.005}
                d1={carcassDepth1 - 0.005}
                d2={carcassDepth2 - 0.005}
                thickness={melamineThickness}
                y={legHeight / 2}
                map={carcassTexture}
                color={appearance.carcassColor}
                onClick={(e: any) => {
                  e.stopPropagation();
                  onSelectPiece({ name: 'Estante Esquinero (L)', dimensions: `${Math.round(cabinetWidth * 1000)} x ${Math.round(cabinetWidth2 * 1000)} x 18 mm (Corte L)` });
                }}
              />
            )}

            {/* Back Reinforcements to ensure no gaps at wall face */}
            <CADBox 
              args={[cabinetWidth, melamineThickness, melamineThickness]}
              position={[0, cabinetHeight / 2 - melamineThickness / 2, -cabinetWidth2 / 2 + melamineThickness / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Refuerzo Esquinero Trasero', dimensions: `${Math.round(cabinetWidth * 1000)} x 100 x 18 mm` });
              }}
            />

            {/* Gola Reinforcement Right Arm */}
            <CADBox
              args={[cabinetWidth, 0.100, melamineThickness]}
              position={[0, cabinetHeight / 2 - 0.050, -cabinetWidth2 / 2 + carcassDepth1 - 0.050 + melamineThickness / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
            />
            <CADBox
              args={[cabinetWidth, melamineThickness, 0.050]}
              position={[0, cabinetHeight / 2 - 0.100 + melamineThickness / 2, -cabinetWidth2 / 2 + carcassDepth1 - 0.025]}
              map={carcassTexture}
              color={appearance.carcassColor}
            />

            {/* Gola Reinforcement Left Arm */}
            <CADBox
              args={[melamineThickness, 0.100, cabinetWidth2]}
              position={[-cabinetWidth / 2 + carcassDepth2 - 0.050 + melamineThickness / 2, cabinetHeight / 2 - 0.050, 0]}
              map={carcassTexture}
              color={appearance.carcassColor}
            />
            <CADBox
              args={[0.050, melamineThickness, cabinetWidth2]}
              position={[-cabinetWidth / 2 + carcassDepth2 - 0.025, cabinetHeight / 2 - 0.100 + melamineThickness / 2, 0]}
              map={carcassTexture}
              color={appearance.carcassColor}
            />

            {/* 5 Black Legs for Corner Cabinet */}
            {cabinet.useLegs && (
              <group>
                {[
                  [-cabinetWidth/2 + 0.05, -cabinetWidth2/2 + 0.05], // Outer Back Left
                  [-cabinetWidth/2 + 0.05, cabinetWidth2/2 - 0.05], // Outer Front Left
                  [-cabinetWidth/2 + carcassDepth2 - 0.05, cabinetWidth2/2 - 0.05], // Inner Front Left
                  [cabinetWidth/2 - 0.05, -cabinetWidth2/2 + carcassDepth1 - 0.05], // Inner Front Right
                  [cabinetWidth/2 - 0.05, -cabinetWidth2/2 + 0.05] // Outer Back Right
                ].map((pos, i) => (
                  <group key={`corner_leg_${i}`} position={[pos[0], -cabinetHeight / 2 + 0.05, pos[1]]}>
                    <mesh>
                      <cylinderGeometry args={[0.012, 0.012, 0.1, 16]} />
                      <meshStandardMaterial color="#222222" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, -0.045, 0]}>
                      <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                      <meshStandardMaterial color="#222222" roughness={0.9} />
                    </mesh>
                  </group>
                ))}
              </group>
            )}

            {/* Corner Components (Doors) */}
            {cabinet.components.map((comp, index) => {
                const effectiveCarcassHeight = (cabinet.type === 'base' && cabinet.useLegs) ? (cabinet.height - legHeight * 1000) / 1000 : cabinet.height / 1000;
                
                const totalHeightSoFar = cabinet.components
                  .slice(0, index)
                  .reduce((acc, c) => acc + effectiveCarcassHeight, 0); // Assuming one door fills the space

                const compHeight = effectiveCarcassHeight;
                const interiorBottomY = -cabinetHeight / 2 + legHeight; 
                const yPos = interiorBottomY + totalHeightSoFar + compHeight / 2;

                const innerCornerX = -cabinetWidth / 2 + carcassDepth2;
                const rightX = cabinetWidth / 2;
                const door1Width = rightX - innerCornerX - 0.003;
                const door1Z = -cabinetWidth2 / 2 + carcassDepth1;

                const bottomZ = cabinetWidth2 / 2;
                const door2Width = (bottomZ - (-cabinetWidth2 / 2 + carcassDepth1)) - 0.018 - 0.004;
                const door2X = -cabinetWidth / 2 + carcassDepth2;

                const isCompOpen = openedComponents[comp.id] || false;
                const compExplode = isCompOpen ? 1 : explode;

                const finalFrontHeight = compHeight - 0.053;
                const finalFrontYOffset = -0.0235;

                return (
                    <group key={comp.id}>
                        {/* Door 1 (Right Arm) - Hinge on the right edge */}
                        <group 
                          position={[rightX, yPos + finalFrontYOffset, door1Z + 0.009]} 
                          rotation={[0, Math.PI * 0.65 * compExplode, 0]}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Puerta Esquinera Derecha', dimensions: `${Math.round(door1Width * 1000)} x ${Math.round(finalFrontHeight * 1000)} x 18 mm` });
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            toggleComponentOpen(comp.id);
                          }}
                        >
                            <CADBox
                                args={[door1Width, finalFrontHeight, 0.018]}
                                position={[-door1Width / 2, 0, 0]}
                                map={frontTexture}
                                color={appearance.frontColor}
                            />
                        </group>
                        {/* Door 2 (Left Arm) - Hinge on the front edge */}
                        <group 
                          position={[door2X + 0.009, yPos + finalFrontYOffset, bottomZ]} 
                          rotation={[0, -Math.PI / 2 - Math.PI * 0.65 * compExplode, 0]}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Puerta Esquinera Izquierda', dimensions: `${Math.round(door2Width * 1000)} x ${Math.round(finalFrontHeight * 1000)} x 18 mm` });
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            toggleComponentOpen(comp.id);
                          }}
                        >
                            <CADBox
                                args={[door2Width, finalFrontHeight, 0.018]}
                                position={[-door2Width / 2, 0, 0]}
                                map={frontTexture}
                                color={appearance.frontColor}
                            />
                        </group>
                    </group>
                );
            })}
        </group>
      ) : (
        <group>
            {/* Sides */}
            <CADBox
              args={[melamineThickness, cabinetHeight - legHeight, carcassDepth]}
              position={[-cabinetWidth / 2 + melamineThickness / 2, legHeight / 2, 0]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Lateral Izquierdo', dimensions: `${Math.round((cabinetHeight - legHeight)*1000)} x ${Math.round(carcassDepth*1000)} x 18 mm` });
              }}
            />
            <CADBox
              args={[melamineThickness, cabinetHeight - legHeight, carcassDepth]}
              position={[cabinetWidth / 2 - melamineThickness / 2, legHeight / 2, 0]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Lateral Derecho', dimensions: `${Math.round((cabinetHeight - legHeight)*1000)} x ${Math.round(carcassDepth*1000)} x 18 mm` });
              }}
            />
            
            {/* Top and Bottom based on type */}
            {cabinet.type === 'base' ? (
                <>
                    {/* Bottom */}
                    <CADBox
                      args={[interiorWidth, melamineThickness, isGolaVanity ? cabinetDepth : interiorDepth]}
                      position={[0, -cabinetHeight / 2 + legHeight + melamineThickness / 2, (isInset && !isGolaVanity) ? -0.01 : 0]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPiece({ name: 'Piso', dimensions: `${Math.round(interiorWidth*1000)} x ${Math.round((isGolaVanity ? cabinetDepth : interiorDepth)*1000)} x 18 mm` });
                      }}
                    />
                    {/* Top Reinforcements */}
                    {cabinet.cabinetId.startsWith('vanity') ? (
                      <>
                        {/* Front Vertical Reinforcement */}
                        <CADBox
                          args={[interiorWidth, 0.100, melamineThickness]}
                          position={[
                            0, 
                            cabinetHeight / 2 - 0.050, 
                            isInset ? (cabinetDepth / 2 - 0.038 - 0.009) : (cabinetDepth / 2 - 0.02 - 0.009)
                          ]}
                          map={carcassTexture}
                          color={appearance.carcassColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Refuerzo Superior Delantero (Vertical)', dimensions: `${Math.round(interiorWidth*1000)} x 100 x 18 mm` });
                          }}
                        />
                        {/* Back Vertical Reinforcement */}
                        <CADBox
                          args={[interiorWidth, 0.100, melamineThickness]}
                          position={[
                            0, 
                            cabinetHeight / 2 - 0.050, 
                            -cabinetDepth / 2 + melamineThickness / 2 + 0.003
                          ]}
                          map={carcassTexture}
                          color={appearance.carcassColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Refuerzo Superior Trasero (Vertical)', dimensions: `${Math.round(interiorWidth*1000)} x 100 x 18 mm` });
                          }}
                        />
                      </>
                    ) : isGolaBase ? (
                      <>
                        {/* Refuerzo Gola Base - Parte Vertical Trasera (crea el bolsillo) */}
                        <CADBox
                          args={[interiorWidth, 0.100 - melamineThickness, melamineThickness]}
                          position={[
                            0, 
                            cabinetHeight / 2 - (0.100 - melamineThickness) / 2, 
                            (cabinetDepth / 2 - 0.02) - 0.050 + melamineThickness / 2
                          ]}
                          map={carcassTexture}
                          color={appearance.carcassColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Refuerzo Gola Madera (Vertical)', dimensions: `${Math.round(interiorWidth*1000)} x ${Math.round((0.100-melamineThickness)*1000)} x 18 mm` });
                          }}
                        />
                        {/* Refuerzo Gola Base - Parte Horizontal (piso del bolsillo, madera abajo) */}
                        <CADBox
                          args={[interiorWidth, melamineThickness, 0.050]}
                          position={[
                            0, 
                            cabinetHeight / 2 - 0.100 + melamineThickness / 2, 
                            (cabinetDepth / 2 - 0.02) - 0.025
                          ]}
                          map={carcassTexture}
                          color={appearance.carcassColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Refuerzo Gola Madera (Horizontal L)', dimensions: `${Math.round(interiorWidth*1000)} x 50 x 18 mm` });
                          }}
                        />
                        {/* Refuerzo Superior Trasero (Vertical) para rigidez estructural */}
                        <CADBox
                          args={[interiorWidth, 0.100, melamineThickness]}
                          position={[
                            0, 
                            cabinetHeight / 2 - 0.050, 
                            -cabinetDepth / 2 + melamineThickness / 2 + 0.003
                          ]}
                          map={carcassTexture}
                          color={appearance.carcassColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Refuerzo Superior Trasero (Vertical)', dimensions: `${Math.round(interiorWidth*1000)} x 100 x 18 mm` });
                          }}
                        />
                      </>
                    ) : (
                      <>
                        {/* Front Horizontal Reinforcement */}
                        <CADBox
                          args={[interiorWidth, melamineThickness, 0.100]}
                          position={[0, cabinetHeight / 2 - melamineThickness / 2, isInset ? (cabinetDepth / 2 - 0.038) - 0.05 : (cabinetDepth / 2 - 0.02) - 0.05]}
                          map={carcassTexture}
                          color={appearance.carcassColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Refuerzo Superior Delantero (Fleje)', dimensions: `${Math.round(interiorWidth*1000)} x 100 x 18 mm` });
                          }}
                        />
                        {/* Back Horizontal Reinforcement */}
                        <CADBox
                          args={[interiorWidth, melamineThickness, 0.100]}
                          position={[0, cabinetHeight / 2 - melamineThickness / 2, -cabinetDepth / 2 + 0.05]}
                          map={carcassTexture}
                          color={appearance.carcassColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Refuerzo Superior Trasero (Fleje)', dimensions: `${Math.round(interiorWidth*1000)} x 100 x 18 mm` });
                          }}
                        />
                      </>
                    )}
                </>
            ) : ( // For wall, tall, and placar
                 <>
                    {/* Bottom */}
                    <CADBox
                      args={[interiorWidth, melamineThickness, interiorDepth]}
                      position={[0, -cabinetHeight / 2 + legHeight + melamineThickness / 2, isInset ? -0.01 : 0]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPiece({ name: 'Piso', dimensions: `${Math.round(interiorWidth*1000)} x ${Math.round(interiorDepth*1000)} x 18 mm` });
                      }}
                    />
                    {/* Top */}
                    <CADBox
                      args={[interiorWidth, melamineThickness, interiorDepth]}
                      position={[0, cabinetHeight / 2 - melamineThickness / 2, isInset ? -0.01 : 0]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPiece({ name: 'Techo', dimensions: `${Math.round(interiorWidth*1000)} x ${Math.round(interiorDepth*1000)} x 18 mm` });
                      }}
                    />
                 </>
            )}

            {/* Back Panel - only for hanging vanities that have an opening/shelf (not all-drawer) */}
            {(() => {
              const hasOnlyDrawers = cabinet.components.every(c => c.type === 'drawer');
              // Hide back panel if hanging vanity with only drawers
              if (isGolaVanity && hasOnlyDrawers) return null;

              const drawerComponents = cabinet.components.filter(c => c.type === 'drawer');
              const drawerHeightM = drawerComponents.reduce((sum, c) => sum + c.height, 0) / 1000;
              const backPanelHeightM = isHangingVanity 
                ? (drawerHeightM > 0 ? drawerHeightM - 0.005 : 0)
                : cabinetHeight - legHeight - (cabinet.type === 'base' ? melamineThickness : 2 * melamineThickness);
              
              if (backPanelHeightM <= 0) return null;
              
              return (
                <CADBox
                  args={[interiorWidth, backPanelHeightM, 0.003]}
                  position={[0, isHangingVanity ? (cabinetHeight / 2 - backPanelHeightM / 2) : legHeight / 2, -cabinetDepth / 2 + 0.003 / 2]}
                  map={undefined}
                  color="#f8f9fa"
                  transparent
                  opacity={0.55}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPiece({ name: 'Fondo (Trasera)', dimensions: `${Math.round(interiorWidth*1000)} x ${Math.round(backPanelHeightM*1000)} x 3 mm` });
                  }}
                />
              );
            })()}

            {/* Intermediate Reinforcement between drawers for hanging vanities (1 fleje vertical delantero) */}
            {isGolaVanity && (() => {
              // Extract all drawer and door components to place reinforcements between them
              const golaFrontComps = cabinet.components.filter(c => c.type === 'drawer' || c.type === 'door');
              if (golaFrontComps.length < 2) return null;

              // Match the exact same scaleFactor / interiorBottomY used in component rendering
              const effH = (cabinet.type === 'base' && cabinet.useLegs) ? cabinet.height - 100 : cabinet.height;
              const totalGap = (golaFrontComps.length - 1) * 30 + 6;
              const sf = (effH - totalGap) / effH;
              const intBotY = -cabinetHeight / 2 + legHeight + melamineThickness; // isInset = true for hanging/patas

              return golaFrontComps.slice(0, -1).map((comp, idx) => {
                // totalHeightBelow = sum of scaled heights of all components UP TO and including this one
                const totalHeightBelow = cabinet.components
                  .slice(0, cabinet.components.indexOf(comp) + 1)
                  .reduce((acc, c) => acc + (c.height * sf) / 1000, 0);
                // Place the strip exactly at the junction between the two drawers
                const junctionY = intBotY + totalHeightBelow;
                const refY = junctionY; // center the 100mm strip on the junction

                return (
                  <group key={`refuerzo-inter-${idx}`}>
                    {/* Fleje delantero VERTICAL - misma profundidad que el refuerzo superior */}
                    <CADBox
                      args={[interiorWidth, 0.100, melamineThickness]}
                      position={[0, refY, cabinetDepth / 2 - 0.038 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPiece({ name: 'Refuerzo Intermedio', dimensions: `${Math.round(interiorWidth * 1000)} x 100 x 18 mm` });
                      }}
                    />
                  </group>
                );
              });
            })()}


            {/* Legs rendering */}
            {cabinet.useLegs && (
              <>
                {/* Front Left Leg */}
                <group position={[-cabinetWidth / 2 + 0.05, -cabinetHeight / 2 + 0.05, cabinetDepth / 2 - 0.06]}>
                  <mesh>
                    <cylinderGeometry args={[0.012, 0.012, 0.1, 16]} />
                    <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, -0.045, 0]}>
                    <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                    <meshStandardMaterial color="#222222" roughness={0.9} />
                  </mesh>
                </group>
                {/* Front Right Leg */}
                <group position={[cabinetWidth / 2 - 0.05, -cabinetHeight / 2 + 0.05, cabinetDepth / 2 - 0.06]}>
                  <mesh>
                    <cylinderGeometry args={[0.012, 0.012, 0.1, 16]} />
                    <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, -0.045, 0]}>
                    <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                    <meshStandardMaterial color="#222222" roughness={0.9} />
                  </mesh>
                </group>
                {/* Back Left Leg */}
                <group position={[-cabinetWidth / 2 + 0.05, -cabinetHeight / 2 + 0.05, -cabinetDepth / 2 + 0.06]}>
                  <mesh>
                    <cylinderGeometry args={[0.012, 0.012, 0.1, 16]} />
                    <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, -0.045, 0]}>
                    <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                    <meshStandardMaterial color="#222222" roughness={0.9} />
                  </mesh>
                </group>
                {/* Back Right Leg */}
                <group position={[cabinetWidth / 2 - 0.05, -cabinetHeight / 2 + 0.05, -cabinetDepth / 2 + 0.06]}>
                  <mesh>
                    <cylinderGeometry args={[0.012, 0.012, 0.1, 16]} />
                    <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, -0.045, 0]}>
                    <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                    <meshStandardMaterial color="#222222" roughness={0.9} />
                  </mesh>
                </group>
              </>
            )}
        </group>
      )}


        {/* Countertop for base cabinets (excluding vanities) */}
      {cabinet.type === 'base' && !isCorner && !cabinet.cabinetId.startsWith('vanity') && (
        <CADBox
          args={[cabinetWidth, 0.03, cabinetDepth]}
          position={[0, cabinetHeight / 2 + 0.015, 0]}
          map={countertopTexture}
          color={appearance.countertopColor}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPiece({ name: 'Encimera (Mesada)', dimensions: `${Math.round(cabinetWidth*1000)} x ${Math.round(cabinetDepth*1000)} x 30 mm` });
          }}
        />
      )}

      {/* Countertop for corner cabinets */}
      {cabinet.type === 'base' && isCorner && (
        <CADLShapeComponent
          w1={cabinetWidth}
          w2={cabinetWidth2}
          d1={carcassDepth1}
          d2={carcassDepth2}
          thickness={0.03}
          y={cabinetHeight / 2 + 0.015}
          map={countertopTexture}
          color={appearance.countertopColor}
          onClick={(e: any) => {
            e.stopPropagation();
            onSelectPiece({ name: 'Encimera Esquinera (Mesada L)', dimensions: `${Math.round(cabinetWidth*1000)} x ${Math.round(cabinetWidth2*1000)} x 30 mm (Corte L)` });
          }}
        />
      )}

      {/* Front Components (Doors/Drawers) or Placar Interior */}
      {cabinet.type === 'placar' ? (
        cabinet.components.map((comp, index) => {
            const totalHeightSoFar = cabinet.components
              .slice(0, index)
              .reduce((acc, c) => acc + c.height / 1000, 0);

            const compHeight = comp.height / 1000;
            const interiorBottomY = -cabinetHeight / 2 + legHeight + melamineThickness; 
            const yPos = interiorBottomY + totalHeightSoFar + compHeight / 2;
            
            if (comp.type === 'shelf') {
                 return (
                    <CADBox
                        key={comp.id}
                        args={[interiorWidth - 0.002, compHeight, carcassDepth - 0.02]}
                        position={[0, yPos, -0.01]}
                        map={frontTexture}
                        color={appearance.frontColor}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPiece({ name: 'Estante de Placar', dimensions: `${Math.round((interiorWidth - 0.002)*1000)} x ${Math.round((carcassDepth - 0.02)*1000)} x 18 mm` });
                        }}
                    />
                );
            }

            if (comp.type === 'hanging-rail') {
                 return (
                    <mesh
                        key={comp.id}
                        position={[0, yPos, 0]}
                        rotation={[0, 0, Math.PI / 2]}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPiece({ name: 'Barral de Colgar', dimensions: `${Math.round((interiorWidth - 0.01)*1000)} mm (Largo)` });
                        }}
                    >
                        <cylinderGeometry args={[0.012, 0.012, interiorWidth - 0.01, 16]} />
                        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
                    </mesh>
                );
            }
            return null;
        })
      ) : (
       !isCorner && cabinet.components.map((comp, index) => {
        const isBlindCorner = cabinet.cabinetId === 'base-blind-corner';
        const blindWidth = 0.5; // 500mm in meters
        
        const effectiveHeight = (cabinet.type === 'base' && cabinet.useLegs) ? cabinet.height - (legHeight * 1000) : cabinet.height;
        const numVanityFronts = cabinet.components.filter(c => c.type === 'drawer' || c.type === 'door').length;
        const golaGap = isGolaVanity && numVanityFronts > 0 
          ? (numVanityFronts - 1) * 30 + 6 
          : (isInset ? 4 : 0); // 4mm fallback for standard inset
        const rawTotalHeight = cabinet.components.reduce((sum, c) => sum + c.height, 0);
        
        let targetHeight = isInset ? effectiveHeight - golaGap : effectiveHeight;
        const numGolaBaseDrawers = isGolaBaseDrawer ? cabinet.components.filter(c => c.type === 'drawer' || c.type === 'door').length : 0;
        if (isGolaBaseDrawer && numGolaBaseDrawers > 0) {
            const golaBaseDrawerTotalGaps = 50 + (numGolaBaseDrawers - 1) * 40 + 3;
            targetHeight = effectiveHeight - golaBaseDrawerTotalGaps;
        }

        const shouldScale = rawTotalHeight > 0 && Math.abs(rawTotalHeight - targetHeight) > 1;
        const scaleFactor = shouldScale ? targetHeight / rawTotalHeight : 1;
        
        const compHeight = (comp.height * scaleFactor) / 1000;

        const totalHeightSoFar = cabinet.components
          .slice(0, index)
          .reduce((acc, c) => acc + (c.height * scaleFactor) / 1000, 0);

        const interiorBottomY = -cabinetHeight / 2 + legHeight + (isInset ? melamineThickness : 0);
        
        // Add accumulated gaps for Gola base drawers
        const accumulatedGapsBaseGola = isGolaBaseDrawer ? 3 + index * 40 : 0;
        const yPos = interiorBottomY + totalHeightSoFar + compHeight / 2 + (isInset ? 0.002 : 0) + (accumulatedGapsBaseGola / 1000);
        
        const numCompDoors = comp.numDoors || 1;
        const availableWidth = isBlindCorner ? (cabinetWidth - blindWidth) : cabinetWidth;
        const doorWidth = isInset ? (interiorWidth / numCompDoors) - 0.004 : (availableWidth / numCompDoors) - 0.004;

        // Dynamic Gola front sizing for hanging/patas vanities (Applies to both doors and drawers)
        const golaFrontComps = cabinet.components.filter(c => c.type === 'drawer' || c.type === 'door');
        let finalFrontHeight = compHeight - 0.004;
        let finalFrontYOffset = 0;
        
        if (isGolaVanity && (comp.type === 'drawer' || comp.type === 'door')) {
          // ==============================================================
          // LOCKED BY USER REQUEST: Vanitory colgante y de patas (1d1o, 3d, 1d2p)
          // DO NOT MODIFY THIS BLOCK WHILE WORKING ON OTHER CABINETS
          // ==============================================================
          // Dynamic logic: 3mm top/bottom gaps, 30mm middle gaps.
          const totalGaps = (golaFrontComps.length - 1) * 30 + 6;
          const deductionPerFront = totalGaps / golaFrontComps.length / 1000;
          finalFrontHeight = compHeight - deductionPerFront;
          
          const isTopmostComponent = index === cabinet.components.length - 1;
          const isBottommostComponent = index === 0;
          
          if (isTopmostComponent) {
            finalFrontYOffset = compHeight/2 - 0.003 - finalFrontHeight/2;
          } else if (isBottommostComponent) {
            finalFrontYOffset = -compHeight/2 + 0.003 + finalFrontHeight/2;
          }
        } else if (isGolaBaseDoor && comp.type === 'door') {
          // Gola para bajo mesadas con puertas: 50mm luz arriba, 3mm luz abajo
          finalFrontHeight = compHeight - 0.053; 
          finalFrontYOffset = -0.0235;
        } else if (isGolaBaseDrawer && (comp.type === 'drawer' || comp.type === 'door')) {
          // Gola para bajo mesadas cajoneros: Heights and gaps are already baked into compHeight and yPos!
          // We don't need further deductions because targetHeight distributed exactly what was left,
          // and yPos placed them with the exact physical gaps.
          finalFrontHeight = compHeight;
          finalFrontYOffset = 0;
        }
        
        // Drawer handling
        if (comp.type === 'drawer') {
          const drawerComponents = cabinet.components.filter(c => c.type === 'drawer');
          const drawerIndex = drawerComponents.findIndex(d => d.id === comp.id);
          const activeIndex = drawerIndex !== -1 ? drawerIndex : 0;
          const isTopDrawer = drawerIndex === drawerComponents.length - 1;
          const isBottomDrawer = drawerIndex === 0;
          const isVanity = cabinet.cabinetId.startsWith('vanity');
          const isUshape = isVanity && isTopDrawer;

          const isCompOpen = openedComponents[comp.id] || false;
          const compExplode = isCompOpen ? 1 : explode;
          
          let boxHeight = (compHeight - 0.04) * 0.7; // standard drawer box height
          let boxLiftOffset = 0; 
          
          if (isGolaVanity) {
            // ==============================================================
            // LOCKED BY USER REQUEST: Vanitory colgante y de patas (1d1o, 3d, 1d2p)
            // DO NOT MODIFY THIS BLOCK WHILE WORKING ON OTHER CABINETS
            // ==============================================================
            boxHeight = 0.100; // 100mm drawer box side height
            if (index > 0) {
              // Top drawer: shifted slightly up (12mm) to clear the top and middle reinforcements
              boxLiftOffset = 0.012; 
            } else {
              // Bottom drawer: shifted up (30mm) to clear bottom panel and middle reinforcement
              boxLiftOffset = 0.030;
            }
          } else if (isGolaBaseDrawer) {
            // Calculate a safe box height so it doesn't crash into the Gola reinforcement hanging from the gap above.
            // The reinforcement hangs down 40mm from the top of the drawer front.
            // We need a few millimeters of clearance.
            const maxBoxHeight = compHeight - 0.055;
            boxHeight = Math.max(0.040, Math.min(0.120, maxBoxHeight)); 
            boxLiftOffset = 0;
          }
          
          const boxDepth = carcassDepth - 0.04;
          const openDistance = boxDepth * 0.90 * compExplode;
          
          const drawerFrontWidth = isInset ? interiorWidth - 0.004 : availableWidth - 0.006;
          const xPos = isBlindCorner ? (-cabinetWidth/2 + blindWidth + availableWidth/2) : 0;
          
          const zBase = isInset && !isGolaVanity ? cabinetDepth / 2 - 0.02 - 0.009 : cabinetDepth / 2 - 0.009;
          const zPos = zBase + openDistance;

          return (
            <React.Fragment key={`wrapper_${comp.id}`}>
              {/* Intermediate Gola Reinforcement for Base Drawers */}
              {isGolaBaseDrawer && index > 0 && (
                <group position={[0, yPos - compHeight/2 - 0.020, 0]}>
                  {/* Vertical part (recessed 50mm, 80mm tall) */}
                  <CADBox
                    args={[interiorWidth, 0.080, melamineThickness]}
                    position={[
                      0, 
                      -0.020, // Center is 20mm below the gap center, spanning from +20 to -60
                      (cabinetDepth / 2 - 0.02) - 0.050 + melamineThickness / 2
                    ]}
                    map={carcassTexture}
                    color={appearance.carcassColor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Refuerzo Gola Medio (Vertical)', dimensions: `${Math.round(interiorWidth*1000)} x 80 x 18 mm` });
                    }}
                  />
                  {/* Horizontal part (50mm deep, floor of the pocket, at the bottom of the vertical part) */}
                  <CADBox
                    args={[interiorWidth, melamineThickness, 0.050]}
                    position={[
                      0, 
                      -0.060 + melamineThickness / 2, // At the bottom edge of the 80mm vertical part
                      (cabinetDepth / 2 - 0.02) - 0.025
                    ]}
                    map={carcassTexture}
                    color={appearance.carcassColor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Refuerzo Gola Medio (Horizontal L)', dimensions: `${Math.round(interiorWidth*1000)} x 50 x 18 mm` });
                    }}
                  />
                </group>
              )}

              <group 
                position={[xPos, yPos + finalFrontYOffset, zPos]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPiece({ name: 'Frente de Cajón', dimensions: `${Math.round(drawerFrontWidth * 1000)} x ${Math.round(finalFrontHeight * 1000)} x 18 mm` });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  toggleComponentOpen(comp.id);
                }}
              >
              {/* Front Panel - same height for both drawers */}
              <CADBox
                args={[drawerFrontWidth, finalFrontHeight, 0.018]}
                position={[0, 0, 0]}
                map={frontTexture}
                color={appearance.frontColor}
              />
              
              {/* Metal Handle centered horizontally and vertically */}
              {!isGolaVanity && !isGolaBaseDrawer && (
                <CADHandle 
                  length={Math.min(0.2, drawerFrontWidth * 0.4)} 
                  vertical={false} 
                  position={[0, 0, 0.009]} 
                />
              )}

              {isUshape ? (() => {
                const boxWidth = interiorWidth - 0.024;
                const plumbingGap = 0.14;           // 140mm canal del sifón
                const sideBoxInnerWidth = (boxWidth - plumbingGap) / 2;
                const sideBoxWidth = sideBoxInnerWidth - 2 * melamineThickness;
                const frontCenterDepth = 0.130;     // 130mm = 13cm desde el frente
                // Cruce Z position: frente (Z=0) → cruce at Z = -(0.130 + 0.009 + melamineThickness/2)
                const cruceZ = -frontCenterDepth - melamineThickness / 2 - 0.009;

                return (
                  <>
                    {/* Lateral Izquierdo Exterior - 350mm */}
                    <CADBox
                      args={[melamineThickness, boxHeight, boxDepth]}
                      position={[-boxWidth / 2 + melamineThickness / 2, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Lateral de Cajón Vanitory', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 18 mm` }); }}
                    />

                    {/* Lateral Derecho Exterior - 350mm */}
                    <CADBox
                      args={[melamineThickness, boxHeight, boxDepth]}
                      position={[boxWidth / 2 - melamineThickness / 2, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Lateral de Cajón Vanitory', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 18 mm` }); }}
                    />

                    {/* Lateral Interno Izquierdo (H) - 350mm, igual que los externos */}
                    <CADBox
                      args={[melamineThickness, boxHeight, boxDepth]}
                      position={[-plumbingGap / 2 - melamineThickness / 2, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Lateral de Cajón Vanitory', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 18 mm` }); }}
                    />

                    {/* Lateral Interno Derecho (H) - 350mm, igual que los externos */}
                    <CADBox
                      args={[melamineThickness, boxHeight, boxDepth]}
                      position={[plumbingGap / 2 + melamineThickness / 2, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Lateral de Cajón Vanitory', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 18 mm` }); }}
                    />

                    {/* Frente Interno Cajón (placa frontal completa ancho) */}
                    <CADBox
                      args={[boxWidth - 2 * melamineThickness, boxHeight, melamineThickness]}
                      position={[0, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -melamineThickness / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Frente/Cruce Central U', dimensions: `${Math.round((boxWidth - 2 * melamineThickness) * 1000)} x ${Math.round(boxHeight * 1000)} x 18 mm` }); }}
                    />

                    {/* Trasero Izquierdo Lateral */}
                    <CADBox
                      args={[sideBoxWidth, boxHeight, melamineThickness]}
                      position={[-boxWidth / 2 + melamineThickness + sideBoxWidth / 2, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth + melamineThickness / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Frente/Trasero Lateral U', dimensions: `${Math.round(sideBoxWidth * 1000)} x ${Math.round(boxHeight * 1000)} x 18 mm` }); }}
                    />

                    {/* Trasero Derecho Lateral */}
                    <CADBox
                      args={[sideBoxWidth, boxHeight, melamineThickness]}
                      position={[boxWidth / 2 - melamineThickness - sideBoxWidth / 2, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth + melamineThickness / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Frente/Trasero Lateral U', dimensions: `${Math.round(sideBoxWidth * 1000)} x ${Math.round(boxHeight * 1000)} x 18 mm` }); }}
                    />

                    {/* Cruce Interno H - a 130mm del frente */}
                    <CADBox
                      args={[plumbingGap, boxHeight, melamineThickness]}
                      position={[0, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, cruceZ]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Frente/Cruce Central U', dimensions: `${Math.round(plumbingGap * 1000)} x ${Math.round(boxHeight * 1000)} x 18 mm` }); }}
                    />

                    {/* Fondo Izquierdo (toda la profundidad del canal lateral) */}
                    <CADBox
                      args={[sideBoxWidth, 0.003, boxDepth - 2 * melamineThickness]}
                      position={[-boxWidth / 2 + melamineThickness + sideBoxWidth / 2, -compHeight / 2 + 0.008 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={undefined}
                      color="#f8f9fa"
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Fondo de Cajón U (Lados)', dimensions: `${Math.round(sideBoxWidth * 1000)} x ${Math.round((boxDepth - 2 * melamineThickness) * 1000)} x 3 mm` }); }}
                    />

                    {/* Fondo Derecho (toda la profundidad del canal lateral) */}
                    <CADBox
                      args={[sideBoxWidth, 0.003, boxDepth - 2 * melamineThickness]}
                      position={[boxWidth / 2 - melamineThickness - sideBoxWidth / 2, -compHeight / 2 + 0.008 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={undefined}
                      color="#f8f9fa"
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Fondo de Cajón U (Lados)', dimensions: `${Math.round(sideBoxWidth * 1000)} x ${Math.round((boxDepth - 2 * melamineThickness) * 1000)} x 3 mm` }); }}
                    />

                    {/* Piso frontal central - 130mm de fondo desde el frente */}
                    <CADBox
                      args={[plumbingGap, 0.003, frontCenterDepth]}
                      position={[0, -compHeight / 2 + 0.008 + boxLiftOffset, -frontCenterDepth / 2 - melamineThickness - 0.009]}
                      map={undefined}
                      color="#f8f9fa"
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Fondo de Cajón U (Frente Centro)', dimensions: `${Math.round(plumbingGap * 1000)} x ${Math.round(frontCenterDepth * 1000)} x 3 mm` }); }}
                    />
                  </>
                );
              })() : (
                <>
                  {/* Drawer Box Left Side (metallic runner) */}
                  <CADBox
                    args={[0.012, boxHeight, boxDepth]}
                    position={[-interiorWidth / 2 + 0.006, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                    color="#c0c0c0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Lateral Izquierdo Cajón (Guía)', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 12 mm` });
                    }}
                  />

                  {/* Drawer Box Right Side (metallic runner) */}
                  <CADBox
                    args={[0.012, boxHeight, boxDepth]}
                    position={[interiorWidth / 2 - 0.006, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                    color="#c0c0c0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Lateral Derecho Cajón (Guía)', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 12 mm` });
                    }}
                  />

                  {/* Drawer Box Back Panel */}
                  <CADBox
                    args={[interiorWidth - 0.03, boxHeight, 0.012]}
                    position={[0, -compHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth - 0.009]}
                    map={carcassTexture}
                    color={appearance.carcassColor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Contrafrente (Trasera) Cajón', dimensions: `${Math.round((interiorWidth - 0.03) * 1000)} x ${Math.round(boxHeight * 1000)} x 12 mm` });
                    }}
                  />

                  {/* Drawer Box Bottom Panel */}
                  <CADBox
                    args={[interiorWidth - 0.03, 0.003, boxDepth]}
                    position={[0, -compHeight / 2 + 0.008 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                    map={undefined}
                    color="#f8f9fa"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Fondo de Cajón', dimensions: `${Math.round((interiorWidth - 0.03) * 1000)} x ${Math.round(boxDepth * 1000)} x 3 mm` });
                    }}
                  />
                </>
              )}
              {/* Drawer Slides (Guias Correderas Telescopicas) */}
              <mesh
                position={[-interiorWidth / 2 + 0.005, -compHeight / 2 + boxHeight / 2 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPiece({ name: 'Corredera Telescópica (Izquierda)', dimensions: `${Math.round(boxDepth * 1000)} mm` });
                }}
              >
                <boxGeometry args={[0.010, 0.020, boxDepth]} />
                <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh
                position={[interiorWidth / 2 - 0.005, -compHeight / 2 + boxHeight / 2 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPiece({ name: 'Corredera Telescópica (Derecha)', dimensions: `${Math.round(boxDepth * 1000)} mm` });
                }}
              >
                <boxGeometry args={[0.010, 0.020, boxDepth]} />
                <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
            </React.Fragment>
          );
        }

        // Shelf handling
        if (comp.type === 'shelf') {
          return (
            <CADBox
              key={comp.id}
              args={[interiorWidth, melamineThickness, interiorDepth - 0.007]}
              position={[0, yPos, isInset ? -0.01 : 0]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Estante', dimensions: `${Math.round(interiorWidth * 1000)} x ${Math.round((interiorDepth - 0.007) * 1000)} x 18 mm` });
              }}
            />
          );
        }

        // Hanging rail handling
        if (comp.type === 'hanging-rail') {
          return (
            <mesh
              key={comp.id}
              position={[0, yPos, 0]}
              rotation={[0, 0, Math.PI / 2]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Barral de Colgar', dimensions: `${Math.round((interiorWidth - 0.01)*1000)} mm (Largo)` });
              }}
            >
              <cylinderGeometry args={[0.012, 0.012, interiorWidth - 0.01, 16]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>
          );
        }

        // Door/Opening/Others handling with support for numDoors
        if (comp.type === 'opening') {
          return null;
        }

        return (
          <group key={comp.id}>
            {/* Blind Front Panel for Corner */}
            {isBlindCorner && index === 0 && (
                <CADBox
                  args={[blindWidth, cabinetHeight - legHeight, 0.018]}
                  position={[
                    cabinet.invertSide 
                      ? cabinetWidth / 2 - blindWidth / 2 
                      : -cabinetWidth / 2 + blindWidth / 2, 
                    legHeight / 2, 
                    cabinetDepth / 2 - 0.009
                  ]}
                  map={carcassTexture}
                  color={appearance.carcassColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPiece({ name: 'Frente Ciego de Esquinero', dimensions: `${Math.round(blindWidth * 1000)} x ${Math.round((cabinetHeight - legHeight) * 1000)} x 18 mm` });
                  }}
                />
            )}
            
            {Array.from({ length: numCompDoors }).map((_, i) => {
              // ==============================================================
              // LOCKED BY USER REQUEST: Anchos, simetría y rotación de puertas
              // Protegido especialmente para Vanitorys Colgantes (inset)
              // DO NOT MODIFY THIS BLOCK WHILE WORKING ON OTHER CABINETS
              // ==============================================================
              
              const baseWidth = isInset ? interiorWidth : availableWidth;
              const baseStart = isInset ? -interiorWidth / 2 : -cabinetWidth / 2;
              
              const xStart = isBlindCorner 
                ? (cabinet.invertSide ? baseStart : baseStart + blindWidth) 
                : baseStart;
              const slotWidth = baseWidth / numCompDoors;
              const doorWidth = slotWidth - 0.004; // 2mm gap on each side of the slot
              
              // Center the door within its slot for perfect symmetry
              const xPos = xStart + (i * slotWidth) + (slotWidth / 2);
              
              const isVanity = cabinet.cabinetId.startsWith('vanity');
              const zBase = (isInset || (isVanity && comp.type === 'opening')) && !isGolaVanity
                ? cabinetDepth / 2 - 0.02 - 0.009 
                : cabinetDepth / 2 - 0.009;

              const isOpening = comp.type === 'opening';
              const isCompOpen = openedComponents[comp.id] || false;
              const doorExplode = isOpening ? 0 : (isCompOpen ? 1 : explode);

              if (comp.hinge === 'top') {
                // Top flip-up door swing
                const hingeY = yPos + compHeight / 2;
                return (
                  <group 
                    key={`${comp.id}_${i}`} 
                    position={[xPos, hingeY, zBase]}
                    rotation={[-Math.PI * 0.55 * doorExplode, 0, 0]}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ 
                        name: isOpening ? 'Hueco Abierto' : 'Puerta Alacena Rebatible', 
                        dimensions: `${Math.round(doorWidth * 1000)} x ${Math.round((compHeight - 0.004) * 1000)} x 18 mm` 
                      });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!isOpening) toggleComponentOpen(comp.id);
                    }}
                  >
                    <CADBox
                      args={[doorWidth, compHeight - 0.004, 0.018]}
                      position={[0, -compHeight / 2, 0]}
                      map={isOpening ? carcassTexture : frontTexture}
                      color={isOpening ? appearance.carcassColor : appearance.frontColor}
                    />
                    {!isOpening && !isGolaVanity && !isGolaBaseDoor && (
                      <CADHandle 
                        length={Math.min(0.2, doorWidth * 0.4)} 
                        vertical={false} 
                        position={[0, -compHeight + 0.04, 0.009]} 
                      />
                    )}
                  </group>
                );
              } else {
                // Standard side hinge door swing
                const isLeftHinge = numCompDoors === 1 ? !cabinet.invertSide : i === 0;
                const hingeX = isLeftHinge ? xPos - doorWidth / 2 : xPos + doorWidth / 2;
                const rotationY = isLeftHinge 
                  ? -Math.PI * 0.65 * doorExplode // Negative rotates outwards for left hinge
                  : Math.PI * 0.65 * doorExplode; // Positive rotates outwards for right hinge
                const meshOffset = isLeftHinge ? doorWidth / 2 : -doorWidth / 2;

                return (
                  <group 
                    key={`${comp.id}_${i}`} 
                    position={[hingeX, yPos, zBase]}
                    rotation={[0, rotationY, 0]}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ 
                        name: isOpening ? 'Hueco Abierto' : 'Puerta', 
                        dimensions: `${Math.round(doorWidth * 1000)} x ${Math.round((compHeight - 0.004) * 1000)} x 18 mm` 
                      });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!isOpening) toggleComponentOpen(comp.id);
                    }}
                  >
                    <CADBox
                      args={[doorWidth, finalFrontHeight, 0.018]}
                      position={[meshOffset, finalFrontYOffset, 0]}
                      map={isOpening ? carcassTexture : frontTexture}
                      color={isOpening ? appearance.carcassColor : appearance.frontColor}
                    />
                    {!isOpening && !isGolaVanity && !isGolaBaseDoor && (
                      <CADHandle 
                        length={0.15} 
                        vertical={true} 
                        position={[
                          isLeftHinge ? doorWidth - 0.03 : -doorWidth + 0.03, // near opening side relative to hinge
                          0, // centered vertically
                          0.009
                        ]} 
                      />
                    )}
                  </group>
                );
              }
            })}
          </group>
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
  explode,
  openedComponents,
  toggleComponentOpen,
  onSelectPiece,
}: Omit<KitchenLayoutProps, 'onClearLayout' | 'onRemoveCabinet' | 'onGenerateRender' | 'isRendering'> & { 
  transformMode: 'translate' | 'rotate';
  explode: number;
  openedComponents: Record<string, boolean>;
  toggleComponentOpen: (id: string) => void;
  onSelectPiece: (piece: { name: string, dimensions: string } | null) => void;
}) {
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
              onSelectPiece(null);
          }
      },
      [onSelectInstance, onSelectPiece]
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
      const handleCollisionDetection = () => {
        if (!control.object) return;
        
        const object = control.object;
        const cabinetInfo = placedCabinets.find(c => c.instanceId === object.name);

        if (!cabinetInfo) return;

        const cabinetHeight = (cabinetInfo.height / 1000) * SCALE;
        const isHangingVanity = cabinetInfo.cabinetId.startsWith('vanity-hanging');
        const isWall = cabinetInfo.type === 'wall';

        // --- Collision with the Floor ---
        // Wall cabinets and hanging vanities have a minimum bottom elevation
        const minElevation = isWall ? 1.5 : isHangingVanity ? 0.57 : 0;
        const floorLimitY = minElevation + cabinetHeight / 2;
        if (object.position.y < floorLimitY) {
          object.position.y = floorLimitY;
        }
      };

      control.addEventListener('objectChange', handleCollisionDetection);
      return () => control.removeEventListener('objectChange', handleCollisionDetection);
    }
  }, [placedCabinets, selectedObject]);


  return (
    <>
      {/* Background & lights outside Bounds so they do not zoom out the camera framing */}
      <color attach="background" args={['#ffffff']} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <hemisphereLight groundColor="white" intensity={0.5} />
      <gridHelper args={[30, 30, '#cbd5e1', '#cbd5e1']} position={[0, 0, 0]} />
      {/* Background Wall Panel */}
      <mesh position={[0, 2, -0.015]}>
        <boxGeometry args={[30, 4, 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      <Bounds fit margin={1.15}>
        <group ref={sceneRef} onPointerMissed={handlePointerMissed}>
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
                            explode={explode}
                            openedComponents={openedComponents}
                            toggleComponentOpen={toggleComponentOpen}
                            onSelectPiece={onSelectPiece}
                        />
                    </group>
                )
            })}
          </Suspense>
        </group>
      </Bounds>

      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        minDistance={0.2}
        maxDistance={25}
        target={[0, 0.6, 0]} // Center camera target height at the cabinet's mid-height
      />
    </>
  );
});

export function KitchenLayout(props: KitchenLayoutProps & { viewMode: 'plan' | '2d' | '3d' | 'technical', setViewMode: (mode: 'plan' | '2d' | '3d' | 'technical') => void, hoveredPieceName?: string | null, onHoverPiece?: (name: string | null) => void }) {
  const { onClearLayout, onSelectInstance, selectedInstanceId, onRemoveCabinet, onGenerateRender, isRendering, viewMode, setViewMode, hoveredPieceName, onHoverPiece, placedCabinets, appearance } = props;
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [explode, setExplode] = useState(0);
  const [openedComponents, setOpenedComponents] = useState<Record<string, boolean>>({});
  const [selectedPiece, setSelectedPiece] = useState<{ name: string, dimensions: string } | null>(null);

  const toggleComponentOpen = useCallback((id: string) => {
    setOpenedComponents(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm relative">
      <div className="p-2 border-b flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-headline pl-2">Diseñador</h2>
            <div className="flex items-center rounded-md bg-muted p-1">
                <Button
                    variant={viewMode === 'plan' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('plan')}
                    title="Vista en Planta"
                >
                    <Square className="w-4 h-4" />
                </Button>
                <Button
                    variant={viewMode === '2d' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('2d')}
                    title="Vista Frontal 2D"
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
                <Button
                    variant={viewMode === 'technical' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                        if (!selectedInstanceId && placedCabinets.length > 0) {
                            onSelectInstance(placedCabinets[0].instanceId);
                        }
                        setViewMode('technical');
                    }}
                    title="Vista Técnica (Despiece)"
                >
                    <Ruler className="w-4 h-4" />
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
            variant="outline"
            size="sm"
            onClick={onGenerateRender}
            disabled={isRendering || props.placedCabinets.length === 0}
            title="Generar una imagen fotorrealista con IA"
          >
            {isRendering ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Render con IA
          </Button>

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
        <div className="flex-1 w-full h-full relative">
          <Canvas
              shadows
              camera={{ position: [6, 4, 8], fov: 50 }}
              className="w-full h-full"
          >
              <Scene 
                {...props} 
                transformMode={transformMode} 
                explode={explode} 
                openedComponents={openedComponents}
                toggleComponentOpen={toggleComponentOpen}
                onSelectPiece={setSelectedPiece}
              />
          </Canvas>
          
          {selectedPiece && (
            <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-md border rounded-lg p-4 shadow-xl z-20 flex flex-col gap-2 w-64 animate-in fade-in-50 slide-in-from-bottom-2">
              <div className="flex justify-between items-center border-b pb-1">
                <span className="font-bold text-sm text-foreground">{selectedPiece.name}</span>
                <button 
                  className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 leading-none"
                  onClick={() => setSelectedPiece(null)}
                >
                  ✕
                </button>
              </div>
              <div className="text-xs text-muted-foreground flex flex-col gap-1">
                <div className="flex justify-between mt-1">
                  <span>Medidas:</span>
                  <span className="font-semibold text-foreground">{selectedPiece.dimensions}</span>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 bg-background/85 backdrop-blur-sm border rounded-lg p-3 shadow-md z-10 flex flex-col gap-1.5 w-60">
            <div className="flex justify-between text-xs font-bold text-foreground">
              <span>Apertura (Explode)</span>
              <span>{Math.round(explode * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explode}
              onChange={(e) => setExplode(parseFloat(e.target.value))}
              className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      ) : viewMode === 'plan' ? (
        <KitchenLayoutPlan 
            placedCabinets={props.placedCabinets}
            selectedInstanceId={props.selectedInstanceId}
            onSelectInstance={props.onSelectInstance}
            onUpdateTransform={props.onUpdateTransform}
        />
      ) : (
        <div className="flex-1 overflow-auto p-4 bg-muted/10">
            {selectedInstanceId ? (
                (() => {
                    const cab = placedCabinets.find(c => c.instanceId === selectedInstanceId);
                    if (!cab) return <div className="flex items-center justify-center h-full">Mueble no encontrado</div>;
                    return (
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xl font-bold text-center">Detalle Técnico: {cab.cabinetId}</h3>
                            <TechnicalView2D 
                                cabinet={cab}
                                hoveredPieceName={hoveredPieceName || null}
                                onHoverPiece={onHoverPiece || (() => {})}
                                frontStyle={appearance.frontStyle}
                            />
                            <p className="text-sm text-muted-foreground text-center italic">
                                Pasa el mouse sobre una pieza para ver su detalle en la tabla del panel lateral.
                            </p>
                        </div>
                    );
                })()
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Selecciona un mueble para ver su vista técnica
                </div>
            )}
        </div>
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
  onGenerateRender: () => void;
  isRendering: boolean;
}
