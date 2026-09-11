'use client';

import React, { Suspense, useRef, useCallback, memo, useEffect, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
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
        <lineBasicMaterial color="#334155" linewidth={1} />
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
  const isInset = appearance.frontStyle === 'inset' || isGolaVanity;
  const carcassDepth = isInset ? cabinetDepth : cabinetDepth - 0.02; // full depth if inset
  const interiorDepth = cabinetDepth - 0.02;
  const melamineThickness = 0.018;
  const interiorWidth = cabinetWidth - 2 * melamineThickness;

  const isCorner = cabinet.cabinetId === 'base-corner';
  const cabinetWidth2 = (cabinet.width2 || cabinet.width) / 1000;
  const cabinetDepth2 = (cabinet.depth2 || cabinet.depth) / 1000;
  let carcassDepth1 = isInset ? cabinetDepth : cabinetDepth - 0.02; // full depth if inset
  let carcassDepth2 = isInset ? cabinetDepth2 : cabinetDepth2 - 0.02; // same for the second body

  if (isCorner) {
    // User requested 580mm wide laterals for bajo005
    carcassDepth1 = 0.580;
    carcassDepth2 = 0.580;
  }
  const legHeight = cabinet.useLegs ? 0.1 : 0;

  const frontTexture = useMemo(() => getTexture('#ffffff', appearance.frontColorName), [appearance.frontColorName]);
  const carcassTexture = useMemo(() => getTexture('#ffffff', appearance.carcassColorName), [appearance.carcassColorName]);
  const countertopTexture = useMemo(() => getTexture('#ffffff', appearance.countertopColorName), [appearance.countertopColorName]);

  return (
    <group scale={SCALE}>
      {/* Carcass */}
      {isCorner ? (
        <group>
            {/* ===== Laterales (Sides) ===== */}
            {/* Right Side Panel */}
            <CADBox 
              args={[melamineThickness, cabinetHeight - legHeight - melamineThickness, carcassDepth1]}
              position={[cabinetWidth / 2 - melamineThickness / 2, legHeight / 2 + melamineThickness / 2, -cabinetWidth2 / 2 + carcassDepth1 / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Lateral Derecho', dimensions: `${Math.round(carcassDepth1 * 1000)} x ${Math.round((cabinetHeight - legHeight - melamineThickness) * 1000)} x 18 mm` });
              }}
            />
            {/* Left Side Panel */}
            <CADBox 
              args={[carcassDepth2, cabinetHeight - legHeight - melamineThickness, melamineThickness]}
              position={[-cabinetWidth / 2 + carcassDepth2 / 2, legHeight / 2 + melamineThickness / 2, cabinetWidth2 / 2 - melamineThickness / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Lateral Izquierdo', dimensions: `${Math.round(carcassDepth2 * 1000)} x ${Math.round((cabinetHeight - legHeight - melamineThickness) * 1000)} x 18 mm` });
              }}
            />

            {/* ===== Piezas Atrás (Back Panels) ===== */}
            {/* Right Back Panel */}
            <CADBox 
              args={[cabinetWidth - carcassDepth2, cabinetHeight - legHeight - melamineThickness, melamineThickness]}
              position={[carcassDepth2 / 2, legHeight / 2 + melamineThickness / 2, -cabinetWidth2 / 2 + melamineThickness / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Fondo Trasero Derecho', dimensions: `${Math.round((cabinetWidth - carcassDepth2) * 1000)} x ${Math.round((cabinetHeight - legHeight - melamineThickness) * 1000)} x 18 mm` });
              }}
            />
            {/* Left Back Panel */}
            <CADBox 
              args={[melamineThickness, cabinetHeight - legHeight - melamineThickness, cabinetWidth2 - carcassDepth1]}
              position={[-cabinetWidth / 2 + melamineThickness / 2, legHeight / 2 + melamineThickness / 2, carcassDepth1 / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Fondo Trasero Izquierdo', dimensions: `${Math.round((cabinetWidth2 - carcassDepth1) * 1000)} x ${Math.round((cabinetHeight - legHeight - melamineThickness) * 1000)} x 18 mm` });
              }}
            />
            
            {/* ===== Fibroplus (Back Panels 3mm) ===== */}
            {/* Right Fibroplus */}
            <CADBox 
              args={[cabinetWidth, cabinetHeight - legHeight, 0.003]}
              position={[0, legHeight / 2, -cabinetWidth2 / 2 - 0.0015]}
              map={carcassTexture}
              color="#ffffff"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Fondo Fibroplus Trasero Derecho', dimensions: `${Math.round(cabinetWidth * 1000)} x ${Math.round((cabinetHeight - legHeight) * 1000)} x 3 mm` });
              }}
            />
            {/* Left Fibroplus */}
            <CADBox 
              args={[0.003, cabinetHeight - legHeight, cabinetWidth2]}
              position={[-cabinetWidth / 2 - 0.0015, legHeight / 2, 0]}
              map={carcassTexture}
              color="#ffffff"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Fondo Fibroplus Trasero Izquierdo', dimensions: `${Math.round(cabinetWidth2 * 1000)} x ${Math.round((cabinetHeight - legHeight) * 1000)} x 3 mm` });
              }}
            />

            {/* ===== Piso (L-Shape Bottom Floor) ===== */}
            {(() => {
              const floorShape = new THREE.Shape();
              floorShape.moveTo(-cabinetWidth/2, -cabinetWidth2/2);
              floorShape.lineTo(cabinetWidth/2, -cabinetWidth2/2);
              floorShape.lineTo(cabinetWidth/2, -cabinetWidth2/2 + carcassDepth1);
              floorShape.lineTo(-cabinetWidth/2 + carcassDepth2, -cabinetWidth2/2 + carcassDepth1);
              floorShape.lineTo(-cabinetWidth/2 + carcassDepth2, cabinetWidth2/2);
              floorShape.lineTo(-cabinetWidth/2, cabinetWidth2/2);
              floorShape.lineTo(-cabinetWidth/2, -cabinetWidth2/2);

              const extrudeSettings = { depth: melamineThickness, bevelEnabled: false };
              return (
                <group
                  position={[0, -cabinetHeight / 2 + legHeight + melamineThickness, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPiece({ name: 'Piso Esquinero L', dimensions: `${Math.round(cabinetWidth * 1000)} x ${Math.round(cabinetWidth2 * 1000)} mm (L-Shape)` });
                  }}
                >
                  <mesh>
                    <extrudeGeometry args={[floorShape, extrudeSettings]} />
                    <meshStandardMaterial map={carcassTexture} color={appearance.carcassColor} />
                  </mesh>
                  <lineSegments>
                    <edgesGeometry args={[new THREE.ExtrudeGeometry(floorShape, extrudeSettings)]} />
                    <lineBasicMaterial color="#333333" linewidth={2} />
                  </lineSegments>
                </group>
              );
            })()}
            
            {/* ===== Refuerzos Superiores (100mm Verticales) ===== */}
            {/* Listón B (Front Right) - Spans full width */}
            <CADBox 
              args={[cabinetWidth, 0.100, melamineThickness]}
              position={[0, cabinetHeight / 2 - 0.050, -cabinetWidth2 / 2 + carcassDepth1 - melamineThickness / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Refuerzo Delantero Derecho (Listón B)', dimensions: `${Math.round(cabinetWidth * 1000)} x 100 x 18 mm` });
              }}
            />
            {/* Listón A (Front Left) */}
            <CADBox 
              args={[melamineThickness, 0.100, cabinetWidth2 - carcassDepth1]}
              position={[-cabinetWidth / 2 + carcassDepth2 - melamineThickness / 2, cabinetHeight / 2 - 0.050, carcassDepth1 / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Refuerzo Delantero Izquierdo (Listón A)', dimensions: `${Math.round((cabinetWidth2 - carcassDepth1) * 1000)} x 100 x 18 mm` });
              }}
            />
            {/* Refuerzo B (Back Right) */}
            <CADBox 
              args={[cabinetWidth - carcassDepth2, 0.100, melamineThickness]}
              position={[carcassDepth2 / 2, cabinetHeight / 2 - 0.050, -cabinetWidth2 / 2 + melamineThickness * 1.5]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Refuerzo Trasero Derecho (Refuerzo B)', dimensions: `${Math.round((cabinetWidth - carcassDepth2) * 1000)} x 100 x 18 mm` });
              }}
            />
            {/* Refuerzo A (Back Left) */}
            <CADBox 
              args={[melamineThickness, 0.100, cabinetWidth2 - carcassDepth1]}
              position={[-cabinetWidth / 2 + melamineThickness * 1.5, cabinetHeight / 2 - 0.050, carcassDepth1 / 2]}
              map={carcassTexture}
              color={appearance.carcassColor}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece({ name: 'Refuerzo Trasero Izquierdo (Refuerzo A)', dimensions: `${Math.round((cabinetWidth2 - carcassDepth1) * 1000)} x 100 x 18 mm` });
              }}
            />

            {/* ===== Patas (Legs) ===== */}
            {cabinet.useLegs && (
              <>
                {[
                  [-cabinetWidth / 2 + 0.05, -cabinetWidth2 / 2 + 0.05], // Back corner
                  [-cabinetWidth / 2 + 0.05, cabinetWidth2 / 2 - 0.05], // Front left
                  [cabinetWidth / 2 - 0.05, -cabinetWidth2 / 2 + 0.05], // Back right
                  [cabinetWidth / 2 - 0.05, -cabinetWidth2 / 2 + carcassDepth1 - 0.05], // Front right
                  [-cabinetWidth / 2 + carcassDepth2 - 0.05, -cabinetWidth2 / 2 + carcassDepth1 - 0.05] // Inner corner
                ].map(([lx, lz], i) => (
                  <group key={`leg-corner-${i}`} position={[lx, -cabinetHeight / 2 + 0.05, lz]}>
                    <mesh>
                      <cylinderGeometry args={[0.012, 0.012, 0.1, 16]} />
                      <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, -0.045, 0]}>
                      <cylinderGeometry args={[0.022, 0.022, 0.01, 16]} />
                      <meshStandardMaterial color="#222222" roughness={0.9} />
                    </mesh>
                  </group>
                ))}
              </>
            )}

            {/* Corner Components (Doors) */}
            {cabinet.components.map((comp, index) => {
                const totalHeightSoFar = cabinet.components
                  .slice(0, index)
                  .reduce((acc, c) => acc + c.height / 1000, 0);

                const effectiveHeight = (cabinet.type === 'base' && cabinet.useLegs) ? cabinetHeight - legHeight : cabinetHeight;
                const finalFrontHeight = effectiveHeight - 0.053;
                const interiorBottomY = -cabinetHeight / 2 + legHeight + melamineThickness; 
                // Doors should leave a 3mm gap below finalFrontHeight to not scratch the floor panel
                const yPos = interiorBottomY + 0.003 + finalFrontHeight / 2;

                const innerCornerX = -cabinetWidth / 2 + carcassDepth2;
                const rightX = cabinetWidth / 2;
                const door1Width = rightX - innerCornerX - 0.003;
                const door1Z = -cabinetWidth2 / 2 + carcassDepth1;

                const bottomZ = cabinetWidth2 / 2;
                const door2Width = (bottomZ - (-cabinetWidth2 / 2 + carcassDepth1)) - 0.018 - 0.004;

                const isCompOpen = openedComponents[comp.id] || false;
                const compExplode = isCompOpen ? 1 : explode;

                return (
                    <group key={comp.id}>
                        {/* Door 1 (Right Arm) - Hinge on the absolute right edge */}
                        <group 
                          position={[rightX, yPos, door1Z + 0.009]} 
                          rotation={[0, Math.PI * 0.45 * compExplode, 0]}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Puerta Esquinera Bi-Fold Derecha', dimensions: `${Math.round(door1Width * 1000)} x ${Math.round(finalFrontHeight * 1000)} x 18 mm` });
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
                            
                            {/* Door 2 Hinge - Attached to left edge of Door 1 to form a Bi-fold door */}
                            <group 
                              position={[-door1Width, 0, 0]} 
                              rotation={[0, -Math.PI * 0.9 * compExplode, 0]}
                            >
                                {/* Base rotation to form L-shape when closed (+90 deg) */}
                                <group rotation={[0, Math.PI / 2, 0]}>
                                    <CADBox
                                        args={[door2Width, finalFrontHeight, 0.018]}
                                        position={[-door2Width / 2, 0, 0]}
                                        map={frontTexture}
                                        color={appearance.frontColor}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectPiece({ name: 'Puerta Esquinera Bi-Fold Izquierda', dimensions: `${Math.round(door2Width * 1000)} x ${Math.round(finalFrontHeight * 1000)} x 18 mm` });
                                        }}
                                    />
                                    {/* Handle goes on Door 2, near the hinge with Door 1 */}
                                    <CADHandle 
                                      length={0.15} 
                                      vertical={true} 
                                      position={[-0.05, 0, 0.009]} 
                                    />
                                </group>
                            </group>
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
                    ) : (
                      <>
                        {/* Front Reinforcement */}
                        {cabinet.useJProfileDiscounts ? (
                          <CADBox
                            args={[interiorWidth, 0.100, melamineThickness]}
                            position={[0, cabinetHeight / 2 - 0.050, isInset ? (cabinetDepth / 2 - 0.038 - 0.009) : (cabinetDepth / 2 - 0.02 - 0.009)]}
                            map={carcassTexture}
                            color={appearance.carcassColor}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPiece({ name: 'Refuerzo Superior Delantero (Perfil J Vertical)', dimensions: `${Math.round(interiorWidth*1000)} x 100 x 18 mm` });
                            }}
                          />
                        ) : (cabinet.cabinetId === 'base-1p' || cabinet.cabinetId === 'base-2p' || cabinet.cabinetId === 'base-2c' || cabinet.cabinetId === 'base-3c') ? (
                          <>
                            {/* bajo001 / bajo002 / bajo003 - Vertical Front Reinforcement (Pushed Back) */}
                            <CADBox
                              args={[interiorWidth, 0.100, melamineThickness]}
                              position={[
                                0, 
                                cabinetHeight / 2 - 0.050, 
                                isInset ? (cabinetDepth / 2 - 0.038 - 0.030 - 0.009) : (cabinetDepth / 2 - 0.02 - 0.030 - 0.009)
                              ]}
                              map={carcassTexture}
                              color={appearance.carcassColor}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPiece({ name: 'Refuerzo Superior Delantero (Vertical)', dimensions: `${Math.round(interiorWidth*1000)} x 100 x 18 mm` });
                              }}
                            />
                            {/* bajo001 - Horizontal L-piece (Pointing Forward at Bottom) */}
                            <CADBox
                              args={[interiorWidth, melamineThickness, 0.030]} // 30mm depth
                              position={[
                                0,
                                cabinetHeight / 2 - 0.100 + 0.009, // Flush with the BOTTOM of the 100mm vertical piece
                                isInset ? (cabinetDepth / 2 - 0.038 - 0.030/2) : (cabinetDepth / 2 - 0.02 - 0.030/2)
                              ]}
                              map={carcassTexture}
                              color={appearance.carcassColor}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPiece({ name: 'Refuerzo L (Horizontal)', dimensions: `${Math.round(interiorWidth*1000)} x 30 x 18 mm` });
                              }}
                            />
                          </>
                        ) : (
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
                        )}
                        {/* Back Reinforcement */}
                        {(cabinet.cabinetId === 'base-1p' || cabinet.cabinetId === 'base-2p' || cabinet.cabinetId === 'base-2c' || cabinet.cabinetId === 'base-3c') ? (
                          <CADBox
                            args={[interiorWidth, 0.100, melamineThickness]}
                            position={[0, cabinetHeight / 2 - 0.050, -cabinetDepth / 2 + melamineThickness / 2 + 0.003]}
                            map={carcassTexture}
                            color={appearance.carcassColor}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPiece({ name: 'Refuerzo Superior Trasero (Vertical)', dimensions: `${Math.round(interiorWidth*1000)} x 100 x 18 mm` });
                            }}
                          />
                        ) : (
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
                        )}
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
                  map={carcassTexture}
                  color={appearance.carcassColor}
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

            {/* Middle Reinforcement for base-2c */}
            {cabinet.cabinetId === 'base-2c' && (
              <group position={[0, -cabinetHeight / 2 + legHeight + melamineThickness + ((cabinetHeight - legHeight) / 2), isInset ? (cabinetDepth / 2 - 0.038 - 0.030 - 0.009) : (cabinetDepth / 2 - 0.02 - 0.030 - 0.009)]}>
                {/* Vertical part (100mm) - Always present */}
                <CADBox
                  args={[interiorWidth, 0.100, melamineThickness]}
                  position={[0, -0.050, 0]}
                  map={carcassTexture}
                  color={appearance.carcassColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPiece({ name: 'Refuerzo Intermedio (Vertical)', dimensions: `${Math.round(interiorWidth * 1000)} x 100 x 18 mm` });
                  }}
                />
                {/* Horizontal part (30mm) - Only when J Profile is ON */}
                {cabinet.useJProfileDiscounts && (
                  <CADBox
                    args={[interiorWidth, melamineThickness, 0.030]}
                    position={[0, -0.100 + 0.009, 0.030 / 2]}
                    map={carcassTexture}
                    color={appearance.carcassColor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Refuerzo L Intermedio (Horizontal)', dimensions: `${Math.round(interiorWidth * 1000)} x 30 x 18 mm` });
                    }}
                  />
                )}
              </group>
            )}

            {/* Middle Reinforcements for base-3c (bajo004) */}
            {cabinet.cabinetId === 'base-3c' && (
              <group position={[0, 0, isInset ? (cabinetDepth / 2 - 0.038 - 0.030 - 0.009) : (cabinetDepth / 2 - 0.02 - 0.030 - 0.009)]}>
                {cabinet.components.map((comp, idx) => {
                  if (idx === 0) return null; // Skip bottom drawer, reinforcements go ABOVE drawers

                  const heightRatio = cabinet.type === 'base' && cabinet.useLegs ? ((cabinetHeight - 0.100) / ((cabinet.height || 810) / 1000)) : 1;
                  
                  // Calculate exact height from bottom to the top of the previous drawer
                  let totalHeightSoFar = 0;
                  for (let i = 0; i < idx; i++) {
                    totalHeightSoFar += cabinet.components[i].height;
                  }
                  
                  const trueTotalHeightSoFar = (totalHeightSoFar / 1000) * heightRatio;
                  const refY = -cabinetHeight / 2 + legHeight + melamineThickness + trueTotalHeightSoFar;
                  
                  return (
                    <group key={`refuerzo-base-3c-${idx}`} position={[0, refY, 0]}>
                      {/* Vertical part (100mm) - Always present */}
                      <CADBox
                        args={[interiorWidth, 0.100, melamineThickness]}
                        position={[0, -0.050, 0]}
                        map={carcassTexture}
                        color={appearance.carcassColor}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPiece({ name: 'Refuerzo Intermedio (Vertical)', dimensions: `${Math.round(interiorWidth * 1000)} x 100 x 18 mm` });
                        }}
                      />
                      {/* Horizontal part (30mm) - Placed directly behind the 53mm finger gap */}
                      <CADBox
                        args={[interiorWidth, melamineThickness, 0.030]}
                        position={[0, -0.100 + 0.009, 0.030 / 2]}
                        map={carcassTexture}
                        color={appearance.carcassColor}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPiece({ name: 'Refuerzo L Intermedio (Horizontal)', dimensions: `${Math.round(interiorWidth * 1000)} x 30 x 18 mm` });
                        }}
                      />
                    </group>
                  );
                })}
              </group>
            )}

            {/* vany007 - Middle Shelf for 2-door standing vanity */}
            {cabinet.cabinetId === 'vanity-patas-2p' && (
              <CADBox
                args={[interiorWidth, melamineThickness, interiorDepth - 0.007]}
                position={[0, -cabinetHeight / 2 + legHeight + (cabinetHeight - legHeight) / 2, isInset ? -0.01 : 0]}
                map={carcassTexture}
                color={appearance.carcassColor}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPiece({ name: 'Estante Medio', dimensions: `${Math.round(interiorWidth * 1000)} x ${Math.round((interiorDepth - 0.007) * 1000)} x 18 mm` });
                }}
              />
            )}

            {/* Optional Inner Shelf for base-1p and base-2p */}
            {cabinet.hasInnerShelf && (cabinet.cabinetId === 'base-1p' || cabinet.cabinetId === 'base-2p') && (
              <CADBox
                args={[interiorWidth, melamineThickness, interiorDepth - 0.007]}
                position={[0, -cabinetHeight / 2 + legHeight + (cabinetHeight - legHeight) / 2, isInset ? -0.01 : 0]}
                map={carcassTexture}
                color={appearance.carcassColor}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPiece({ name: 'Estante Interno', dimensions: `${Math.round(interiorWidth * 1000)} x ${Math.round((interiorDepth - 0.007) * 1000)} x 18 mm` });
                }}
              />
            )}

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

      {/* Front Components (Doors/Drawers) or Placar Interior */}
      {cabinet.type === 'placar' ? (
        cabinet.components.map((comp, index) => {
            const totalHeightSoFar = cabinet.components
              .slice(0, index)
              .reduce((acc, c) => acc + c.height / 1000, 0);

            const compHeight = comp.height / 1000;
            const interiorBottomY = -cabinetHeight / 2 + legHeight + melamineThickness; 
            const yPos = comp.positionY !== undefined 
                ? interiorBottomY + (comp.positionY / 1000) + compHeight / 2
                : interiorBottomY + totalHeightSoFar + compHeight / 2;
            
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

            if (comp.type === 'vertical-divider') {
                const posX = -(cabinetWidth / 2) + melamineThickness + (comp.positionX !== undefined ? (comp.positionX / 1000) : 0);
                return (
                    <CADBox
                        key={comp.id}
                        args={[0.018, compHeight, carcassDepth - 0.02]}
                        position={[posX, yPos, -0.01]}
                        map={frontTexture}
                        color={appearance.carcassColor}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectPiece({ name: 'Divisor Vertical', dimensions: `${Math.round(compHeight*1000)} x ${Math.round((carcassDepth - 0.02)*1000)} x 18 mm` });
                        }}
                    />
                );
            }

            if (comp.type === 'drawer') {
                return (
                   <group key={comp.id} position={[0, yPos, 0]}>
                       <CADBox
                           args={[interiorWidth - 0.002, compHeight - 0.002, carcassDepth - 0.02]}
                           position={[0, 0, 0]}
                           map={frontTexture}
                           color={appearance.frontColor}
                           onClick={(e) => {
                               e.stopPropagation();
                               onSelectPiece({ name: 'Cajón de Placar', dimensions: `${Math.round((interiorWidth - 0.004)*1000)} x ${Math.round((compHeight - 0.004)*1000)} x 18 mm` });
                           }}
                       />
                   </group>
                );
            }

            return null;
        })
      ) : (
       !isCorner && cabinet.components.map((comp, index) => {
        const isBlindCorner = cabinet.cabinetId === 'base-blind-corner';
        const blindWidth = 0.5; // 500mm in meters
        
        const effectiveHeight = (cabinet.type === 'base' && cabinet.useLegs) ? cabinet.height - 100 : cabinet.height;
        const numVanityFronts = cabinet.components.filter(c => c.type === 'drawer' || c.type === 'door').length;
        const rawTotalHeight = cabinet.components.reduce((acc: number, c: any) => acc + c.height, 0);
        const golaGap = isGolaVanity ? 0 : (isInset ? 4 : 0);
        const targetHeight = effectiveHeight - golaGap;
        const scaleFactor = rawTotalHeight > 0 ? targetHeight / rawTotalHeight : 1;
        let compHeight = isInset ? (comp.height * scaleFactor) / 1000 : comp.height / 1000;

        let totalHeightSoFar = cabinet.components
          .slice(0, index)
          .reduce((acc, c) => acc + (isInset ? c.height * scaleFactor : c.height) / 1000, 0);

        // ==============================================================
        // LOCKED BY USER REQUEST: vany002 and vany005
        // Force all drawer fronts in these specific cabinets to be perfectly identical in height
        // ==============================================================
        if (cabinet.cabinetId === 'vanity-patas-3d' || cabinet.cabinetId === 'vanity-hanging-2d') {
          const equalHeight = (targetHeight / cabinet.components.length) / 1000;
          compHeight = equalHeight;
          totalHeightSoFar = index * equalHeight;
        }

        const interiorBottomY = -cabinetHeight / 2 + legHeight + ((isInset && !isGolaVanity) ? melamineThickness : 0);
        const yPos = interiorBottomY + totalHeightSoFar + compHeight / 2 + ((isInset && !isGolaVanity) ? 0.002 : 0);
        
        const numCompDoors = comp.numDoors || 1;
        const availableWidth = isBlindCorner ? (cabinetWidth - blindWidth) : cabinetWidth;
        const doorWidth = isInset ? (interiorWidth / numCompDoors) - 0.004 : (availableWidth / numCompDoors) - 0.004;

        // Dynamic Gola front sizing for hanging/patas vanities (Applies to both doors and drawers)
        const golaFrontComps = cabinet.components.filter(c => c.type === 'drawer' || c.type === 'door');
        let finalFrontHeight = compHeight - 0.004;
        let finalFrontYOffset = 0;
        
        if (isGolaVanity) {
          // ==============================================================
          // LOCKED BY USER REQUEST: vany001 - Vanitory colgante y de patas (1d1o, 3d, 1d2p)
          // DO NOT MODIFY THIS BLOCK WHILE WORKING ON OTHER CABINETS
          // ==============================================================
          // Dynamic logic: 50mm top gap, 3mm bottom gap, 30mm middle gaps.
          const numComps = cabinet.components.length;
          const totalGaps = (numComps - 1) * 30 + 53;
          const deductionPerFront = totalGaps / numComps / 1000;
          finalFrontHeight = compHeight - deductionPerFront;
          
          finalFrontYOffset = (3 + index * 30) / 1000 - (index + 0.5) * deductionPerFront;
        } else if (cabinet.cabinetId === 'base-1p' || cabinet.cabinetId === 'base-2p') {
          // ==============================================================
          // LOCKED BY USER REQUEST: bajo001 & bajo002
          // ==============================================================
          // Door must be 50mm lower than the top of the carcass (effectiveHeight).
          // And 3mm gap at the bottom.
          finalFrontHeight = (effectiveHeight / 1000) - 0.053;
          finalFrontYOffset = (0.003 + finalFrontHeight / 2) - (compHeight / 2);
        } else if (cabinet.cabinetId === 'base-2c') {
          // ==============================================================
          // LOCKED BY USER REQUEST: bajo003
          // ==============================================================
          const trueCompHeight = cabinet.type === 'base' && cabinet.useLegs 
            ? compHeight * (effectiveHeight / (cabinet.height || 810)) 
            : compHeight;
            
          if (index === cabinet.components.length - 1) { // Top drawer
             finalFrontHeight = trueCompHeight - 0.053;
             const targetCenter = (effectiveHeight / 1000) - 0.050 - (finalFrontHeight / 2);
             const currentCenter = totalHeightSoFar + (compHeight / 2);
             finalFrontYOffset = targetCenter - currentCenter;
          } else { // Bottom drawer
             if (cabinet.useJProfileDiscounts) {
                 finalFrontHeight = trueCompHeight - 0.040;
                 const targetCenter = 0.003 + (finalFrontHeight / 2);
                 const currentCenter = totalHeightSoFar + (compHeight / 2);
                 finalFrontYOffset = targetCenter - currentCenter;
             } else {
                 finalFrontHeight = trueCompHeight - 0.053; // 50mm gap on top to match the top drawer
                 const targetCenter = 0.003 + (finalFrontHeight / 2); // align to bottom with 3mm gap
                 const currentCenter = totalHeightSoFar + (compHeight / 2);
                 finalFrontYOffset = targetCenter - currentCenter;
             }
          }
        } else if (cabinet.cabinetId === 'base-3c') {
          // ==============================================================
          // LOCKED BY USER REQUEST: bajo004
          // ==============================================================
          const heightRatio = cabinet.type === 'base' && cabinet.useLegs ? (effectiveHeight / (cabinet.height || 810)) : 1;
          const trueCompHeight = compHeight * heightRatio;
          const trueTotalHeightSoFar = totalHeightSoFar * heightRatio;
            
          if (cabinet.useJProfileDiscounts) {
              finalFrontHeight = trueCompHeight - 0.040;
              const targetCenter = 0.020 + (finalFrontHeight / 2) + trueTotalHeightSoFar;
              const currentCenter = totalHeightSoFar + (compHeight / 2);
              finalFrontYOffset = targetCenter - currentCenter;
          } else {
              finalFrontHeight = trueCompHeight - 0.053;
              const targetCenter = 0.003 + (finalFrontHeight / 2) + trueTotalHeightSoFar;
              const currentCenter = totalHeightSoFar + (compHeight / 2);
              finalFrontYOffset = targetCenter - currentCenter;
          }
        } else if (cabinet.useJProfileDiscounts) {
          // Fix for other base cabinets (like 2 drawers) so they don't stick out.
          // Base components use full cabinet height (810) instead of carcass height (710).
          // We scale the compHeight down proportionally to the effectiveHeight.
          const trueCompHeight = cabinet.type === 'base' && cabinet.useLegs 
            ? compHeight * (effectiveHeight / (cabinet.height || 810)) 
            : compHeight;
            
          // -40mm total deduction (30mm profile + 10mm gap)
          finalFrontHeight = trueCompHeight - 0.040;
          
          // The center of the mesh needs to be shifted down by 20mm + half the difference between compHeight and trueCompHeight
          const diff = compHeight - trueCompHeight;
          finalFrontYOffset = -0.020 - (diff / 2);
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
          
          let boxHeight = comp.drawerBoxHeight ? comp.drawerBoxHeight / 1000 : (compHeight - 0.04) * 0.7; // use custom height if available
          let boxLiftOffset = 0; 
          
          if (isGolaVanity) {
            // ==============================================================
            // LOCKED BY USER REQUEST: vany001 - Vanitory colgante y de patas (1d1o, 3d, 1d2p)
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
          }
          
          const boxDepth = carcassDepth - 0.04;
          const openDistance = boxDepth * 0.90 * compExplode;
          
          const drawerFrontWidth = isInset ? interiorWidth - 0.004 : availableWidth - 0.006;
          const xPos = isBlindCorner ? (-cabinetWidth/2 + blindWidth + availableWidth/2) : 0;
          
          const zBase = isInset && !isGolaVanity ? cabinetDepth / 2 - 0.02 - 0.009 : cabinetDepth / 2 - 0.009;
          const zPos = zBase + openDistance;

          return (
            <group 
              key={comp.id} 
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
              
              {/* J Profile (Aluminum) */}
              {cabinet.useJProfileDiscounts && (
                <CADBox
                  args={[drawerFrontWidth, 0.030, 0.020]}
                  position={[0, finalFrontHeight / 2 + 0.015, -0.001]}
                  color="#d4d4d8" // silver aluminum
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPiece({ name: 'Perfil J (Aluminio)', dimensions: `${Math.round(drawerFrontWidth * 1000)} mm (Largo)` });
                  }}
                />
              )}
              
              {/* Metal Handle centered horizontally and vertically */}
              {!isGolaVanity && !cabinet.useJProfileDiscounts && cabinet.cabinetId !== 'base-2c' && cabinet.cabinetId !== 'base-3c' && (
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
                      position={[-boxWidth / 2 + melamineThickness / 2, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Lateral de Cajón Vanitory', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 18 mm` }); }}
                    />

                    {/* Lateral Derecho Exterior - 350mm */}
                    <CADBox
                      args={[melamineThickness, boxHeight, boxDepth]}
                      position={[boxWidth / 2 - melamineThickness / 2, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Lateral de Cajón Vanitory', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 18 mm` }); }}
                    />

                    {/* Lateral Interno Izquierdo (H) - 350mm, igual que los externos */}
                    <CADBox
                      args={[melamineThickness, boxHeight, boxDepth]}
                      position={[-plumbingGap / 2 - melamineThickness / 2, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Lateral de Cajón Vanitory', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 18 mm` }); }}
                    />

                    {/* Lateral Interno Derecho (H) - 350mm, igual que los externos */}
                    <CADBox
                      args={[melamineThickness, boxHeight, boxDepth]}
                      position={[plumbingGap / 2 + melamineThickness / 2, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Lateral de Cajón Vanitory', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 18 mm` }); }}
                    />

                    {/* Frente Interno Cajón (placa frontal completa ancho) */}
                    <CADBox
                      args={[boxWidth - 2 * melamineThickness, boxHeight, melamineThickness]}
                      position={[0, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -melamineThickness / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Frente/Cruce Central U', dimensions: `${Math.round((boxWidth - 2 * melamineThickness) * 1000)} x ${Math.round(boxHeight * 1000)} x 18 mm` }); }}
                    />

                    {/* Trasero Izquierdo Lateral */}
                    <CADBox
                      args={[sideBoxWidth, boxHeight, melamineThickness]}
                      position={[-boxWidth / 2 + melamineThickness + sideBoxWidth / 2, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth + melamineThickness / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Frente/Trasero Lateral U', dimensions: `${Math.round(sideBoxWidth * 1000)} x ${Math.round(boxHeight * 1000)} x 18 mm` }); }}
                    />

                    {/* Trasero Derecho Lateral */}
                    <CADBox
                      args={[sideBoxWidth, boxHeight, melamineThickness]}
                      position={[boxWidth / 2 - melamineThickness - sideBoxWidth / 2, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth + melamineThickness / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Frente/Trasero Lateral U', dimensions: `${Math.round(sideBoxWidth * 1000)} x ${Math.round(boxHeight * 1000)} x 18 mm` }); }}
                    />

                    {/* Cruce Interno H - a 130mm del frente */}
                    <CADBox
                      args={[plumbingGap, boxHeight, melamineThickness]}
                      position={[0, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, cruceZ]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Frente/Cruce Central U', dimensions: `${Math.round(plumbingGap * 1000)} x ${Math.round(boxHeight * 1000)} x 18 mm` }); }}
                    />

                    {/* Fondo Izquierdo (toda la profundidad del canal lateral) */}
                    <CADBox
                      args={[sideBoxWidth, 0.003, boxDepth - 2 * melamineThickness]}
                      position={[-boxWidth / 2 + melamineThickness + sideBoxWidth / 2, -finalFrontHeight / 2 + 0.008 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Fondo de Cajón U (Lados)', dimensions: `${Math.round(sideBoxWidth * 1000)} x ${Math.round((boxDepth - 2 * melamineThickness) * 1000)} x 3 mm` }); }}
                    />

                    {/* Fondo Derecho (toda la profundidad del canal lateral) */}
                    <CADBox
                      args={[sideBoxWidth, 0.003, boxDepth - 2 * melamineThickness]}
                      position={[boxWidth / 2 - melamineThickness - sideBoxWidth / 2, -finalFrontHeight / 2 + 0.008 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Fondo de Cajón U (Lados)', dimensions: `${Math.round(sideBoxWidth * 1000)} x ${Math.round((boxDepth - 2 * melamineThickness) * 1000)} x 3 mm` }); }}
                    />

                    {/* Piso frontal central - 130mm de fondo desde el frente */}
                    <CADBox
                      args={[plumbingGap, 0.003, frontCenterDepth]}
                      position={[0, -finalFrontHeight / 2 + 0.008 + boxLiftOffset, -frontCenterDepth / 2 - melamineThickness - 0.009]}
                      map={carcassTexture}
                      color={appearance.carcassColor}
                      onClick={(e) => { e.stopPropagation(); onSelectPiece({ name: 'Fondo de Cajón U (Frente Centro)', dimensions: `${Math.round(plumbingGap * 1000)} x ${Math.round(frontCenterDepth * 1000)} x 3 mm` }); }}
                    />
                  </>
                );
              })() : (
                <>
                  {/* Drawer Box Left Side (metallic runner) */}
                  <CADBox
                    args={[0.012, boxHeight, boxDepth]}
                    position={[-interiorWidth / 2 + 0.006, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                    color="#c0c0c0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Lateral Izquierdo Cajón (Guía)', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 12 mm` });
                    }}
                  />

                  {/* Drawer Box Right Side (metallic runner) */}
                  <CADBox
                    args={[0.012, boxHeight, boxDepth]}
                    position={[interiorWidth / 2 - 0.006, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                    color="#c0c0c0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Lateral Derecho Cajón (Guía)', dimensions: `${Math.round(boxHeight * 1000)} x ${Math.round(boxDepth * 1000)} x 12 mm` });
                    }}
                  />

                  {/* Drawer Box Back Panel */}
                  <CADBox
                    args={[interiorWidth - 0.03, boxHeight, 0.012]}
                    position={[0, -finalFrontHeight / 2 + boxHeight / 2 + 0.015 + boxLiftOffset, -boxDepth - 0.009]}
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
                    position={[0, -finalFrontHeight / 2 + 0.008 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                    map={carcassTexture}
                    color={appearance.carcassColor}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPiece({ name: 'Fondo de Cajón', dimensions: `${Math.round((interiorWidth - 0.03) * 1000)} x ${Math.round(boxDepth * 1000)} x 3 mm` });
                    }}
                  />
                </>
              )}
              {/* Drawer Slides (Guias Correderas Telescopicas) */}
              <mesh
                position={[-interiorWidth / 2 + 0.005, -finalFrontHeight / 2 + boxHeight / 2 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPiece({ name: 'Corredera Telescópica (Izquierda)', dimensions: `${Math.round(boxDepth * 1000)} mm` });
                }}
              >
                <boxGeometry args={[0.010, 0.020, boxDepth]} />
                <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh
                position={[interiorWidth / 2 - 0.005, -finalFrontHeight / 2 + boxHeight / 2 + boxLiftOffset, -boxDepth / 2 - 0.009]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPiece({ name: 'Corredera Telescópica (Derecha)', dimensions: `${Math.round(boxDepth * 1000)} mm` });
                }}
              >
                <boxGeometry args={[0.010, 0.020, boxDepth]} />
                <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
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
                        dimensions: `${Math.round(doorWidth * 1000)} x ${Math.round(finalFrontHeight * 1000)} x 18 mm` 
                      });
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!isOpening) toggleComponentOpen(comp.id);
                    }}
                  >
                    <CADBox
                      args={[doorWidth, finalFrontHeight, 0.018]}
                      position={[0, finalFrontYOffset, 0]}
                      map={isOpening ? carcassTexture : frontTexture}
                      color={isOpening ? appearance.carcassColor : appearance.frontColor}
                    />
                    {cabinet.useJProfileDiscounts && !isOpening && (
                      <CADBox
                        args={[doorWidth, 0.030, 0.020]}
                        position={[0, finalFrontYOffset + finalFrontHeight / 2 + 0.015, -0.001]}
                        color="#d4d4d8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPiece({ name: 'Perfil J (Aluminio)', dimensions: `${Math.round(doorWidth * 1000)} mm (Largo)` });
                        }}
                      />
                    )}
                    {!isOpening && !isGolaVanity && !cabinet.useJProfileDiscounts && (
                      <CADHandle 
                        length={Math.min(0.2, doorWidth * 0.4)} 
                        vertical={false} 
                        position={[0, finalFrontYOffset - finalFrontHeight / 2 + 0.04, 0.009]} 
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
                        dimensions: `${Math.round(doorWidth * 1000)} x ${Math.round(finalFrontHeight * 1000)} x 18 mm` 
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
                    {cabinet.useJProfileDiscounts && !isOpening && (
                      <CADBox
                        args={[doorWidth, 0.030, 0.020]}
                        position={[meshOffset, finalFrontYOffset + finalFrontHeight / 2 + 0.015, -0.001]}
                        color="#d4d4d8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPiece({ name: 'Perfil J (Aluminio)', dimensions: `${Math.round(doorWidth * 1000)} mm (Largo)` });
                        }}
                      />
                    )}
                    {!isOpening && !isGolaVanity && !cabinet.useJProfileDiscounts && cabinet.cabinetId !== 'base-1p' && cabinet.cabinetId !== 'base-2p' && (
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


function DropHandler({ onAddComponent, selectedInstanceId, placedCabinets }: { onAddComponent?: (instanceId: string, comp: any) => void, selectedInstanceId: string | null, placedCabinets: PlacedCabinet[] }) {
  const { gl, camera, scene } = useThree();

  useEffect(() => {
    if (!onAddComponent || !selectedInstanceId) return;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const compType = e.dataTransfer?.getData('application/vnd.cabinet-component');
      if (!compType) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      if (intersects.length > 0) {
        const worldPoint = intersects[0].point;
        const cab = placedCabinets.find(c => c.instanceId === selectedInstanceId);
        
        if (cab && cab.type === 'placar') {
            // Find the actual Three.js group for this cabinet so we can do a
            // proper world → local coordinate conversion (handles Bounds rescaling etc.)
            const cabObject = scene.getObjectByName(selectedInstanceId!);

            let localY: number;
            let localX: number;

            if (cabObject) {
                // Convert world point to the cabinet group's local space
                const localPoint = cabObject.worldToLocal(worldPoint.clone());
                localY = localPoint.y;
                localX = localPoint.x;
            } else {
                // Fallback: manual subtraction if object not found in scene
                localY = worldPoint.y - cab.position[1];
                localX = worldPoint.x - cab.position[0];
            }

            const cabinetHeight = cab.height / 1000;
            const legHeight = cab.useLegs ? 0.1 : 0;
            const melamineThickness = 0.018;
            // In the cabinet's local frame, its center is Y=0.
            // Bottom face is at -cabinetHeight/2, interior floor is above legs + melamine.
            const interiorBottomY = -cabinetHeight / 2 + legHeight + melamineThickness;
            
            let positionY_mm = Math.round((localY - interiorBottomY) * 1000);
            
            // Calculate positionX from the left interior wall
            const interiorLeftX = -(cab.width / 1000) / 2 + melamineThickness;
            let positionX_mm = Math.round((localX - interiorLeftX) * 1000);

            // Snap to nearest 10mm for easier placement
            positionY_mm = Math.round(positionY_mm / 10) * 10;
            positionX_mm = Math.round(positionX_mm / 10) * 10;
            
            if (positionY_mm > 0 && positionY_mm < cab.height) {
                let height = 18;
                if (compType === 'drawer') height = 200;
                if (compType === 'hanging-rail') height = 30;
                if (compType === 'vertical-divider') height = 400;

                const newComp: any = {
                    id: Math.random().toString(36).substring(7),
                    type: compType,
                    height,
                    positionY: positionY_mm
                };

                if (compType === 'vertical-divider') {
                    newComp.positionX = positionX_mm;
                }

                onAddComponent(selectedInstanceId, newComp);
            }
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault(); // Required to allow drop
      e.dataTransfer!.dropEffect = 'copy';
    };

    gl.domElement.addEventListener('drop', handleDrop);
    gl.domElement.addEventListener('dragover', handleDragOver);

    return () => {
      gl.domElement.removeEventListener('drop', handleDrop);
      gl.domElement.removeEventListener('dragover', handleDragOver);
    };
  }, [gl, camera, scene, onAddComponent, selectedInstanceId, placedCabinets]);

  return null;
}

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
              <DropHandler 
                  onAddComponent={props.onAddComponent} 
                  selectedInstanceId={props.selectedInstanceId} 
                  placedCabinets={props.placedCabinets} 
              />
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
  onAddComponent?: (instanceId: string, component: any) => void;
}
