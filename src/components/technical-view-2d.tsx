'use client';

import React from 'react';
import type { PlacedCabinet, CabinetComponent } from '@/lib/types';
import { MELAMINE_THICKNESS, FRONT_OVERLAY_OFFSET } from '@/lib/cabinet-utils';
import { cn } from '@/lib/utils';

interface TechnicalView2DProps {
  cabinet: PlacedCabinet;
  hoveredPieceName: string | null;
  onHoverPiece: (name: string | null) => void;
  frontStyle?: 'overlay' | 'inset';
}

const SCALE = 0.6; // Increased scale for main area

export function TechnicalView2D({ cabinet, hoveredPieceName, onHoverPiece, frontStyle = 'overlay' }: TechnicalView2DProps) {
  const { width, height, depth, useLegs, components } = cabinet;
  const effectiveHeight = useLegs ? height - 100 : height;
  const isInset = frontStyle === 'inset';
  const carcassDepth = isInset ? depth : depth - FRONT_OVERLAY_OFFSET;
  const interiorWidth = width - (2 * MELAMINE_THICKNESS);

  const renderPiece = (
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    label?: string,
    key?: string
  ) => {
    const isHovered = hoveredPieceName === name || hoveredPieceName?.includes(name) || name.includes(hoveredPieceName || '___');
    
    return (
      <g 
        key={key || `${name}-${x}-${y}`}
        onMouseEnter={() => onHoverPiece(name)}
        onMouseLeave={() => onHoverPiece(null)}
        className="cursor-pointer transition-all"
      >
        <rect
          x={x * SCALE}
          y={y * SCALE}
          width={w * SCALE}
          height={h * SCALE}
          fill={isHovered ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.8)'}
          stroke={isHovered ? '#2563eb' : '#64748b'}
          strokeWidth={isHovered ? 2 : 1}
          rx={2}
        />
        {isHovered && label && (
          <text
            x={(x + w / 2) * SCALE}
            y={(y + h / 2) * SCALE}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] font-bold fill-blue-700 pointer-events-none select-none"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  // 1. VISTA FRONTAL (Estructura interna)
  const renderFrontView = () => {
    const viewW = width;
    const viewH = effectiveHeight;
    
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold uppercase text-muted-foreground">Frente</span>
        <svg width={viewW * SCALE} height={viewH * SCALE} className="overflow-visible bg-secondary/5 rounded border">
          {/* Laterales */}
          {renderPiece('Lateral', 0, 0, MELAMINE_THICKNESS, viewH, 'Lat', 'lat-left')}
          {renderPiece('Lateral', viewW - MELAMINE_THICKNESS, 0, MELAMINE_THICKNESS, viewH, 'Lat', 'lat-right')}
          
          {/* Piso */}
          {renderPiece('Piso', MELAMINE_THICKNESS, viewH - MELAMINE_THICKNESS, interiorWidth, MELAMINE_THICKNESS, 'Piso', 'piso')}
          
          {/* Refuerzos Superiores (o Tapa si es alacena) */}
          {cabinet.type === 'base' ? (
             <React.Fragment key="refuerzos">
               {renderPiece('Refuerzo Superior', MELAMINE_THICKNESS, 0, interiorWidth, 20, 'Fleje', 'ref-1')}
               {renderPiece('Refuerzo Superior', MELAMINE_THICKNESS, 30, interiorWidth, 20, 'Fleje', 'ref-2')}
             </React.Fragment>
          ) : (
             renderPiece('Tapa', MELAMINE_THICKNESS, 0, interiorWidth, MELAMINE_THICKNESS, 'Tapa', 'tapa')
          )}

          {/* Componentes (Estantes, Cajones, Puertas) */}
          {(() => {
            let currentYFront = viewH - MELAMINE_THICKNESS;
            return components.map((comp, idx) => {
              const compH = comp.height;
              const y = currentYFront - compH;
              currentYFront -= compH;
              
              if (comp.type === 'shelf') {
                return renderPiece('Estante', MELAMINE_THICKNESS + 2, y, interiorWidth - 4, MELAMINE_THICKNESS, 'Estante', `shelf-${idx}`);
              }
              if (comp.type === 'drawer') {
                return renderPiece('Frente de Cajón', 2, y + 2, width - 4, compH - 4, 'Cajón', `drawer-${idx}`);
              }
              if (comp.type === 'door') {
                return renderPiece('Puerta', 2, y + 2, width - 4, compH - 4, 'Puerta', `door-${idx}`);
              }
              return null;
            });
          })()}
        </svg>
      </div>
    );
  };

  // 2. VISTA LATERAL (Perfil)
  const renderSideView = () => {
    const viewW = depth;
    const viewH = effectiveHeight;
    
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold uppercase text-muted-foreground">Perfil</span>
        <svg width={viewW * SCALE} height={viewH * SCALE} className="overflow-visible bg-secondary/5 rounded border">
          {/* Lateral (Visto de frente en esta proyección) */}
          {renderPiece('Lateral', 0, 0, carcassDepth, viewH, 'Lateral', 'lat-side')}
          
          {/* Panel Trasero */}
          {renderPiece('Panel Trasero', 0, 0, 3, viewH, 'Fondo', 'fondo-side')}
          
          {/* Componentes (Profundidad) */}
          {(() => {
            let currentYSide = viewH - MELAMINE_THICKNESS;
            return components.map((comp, idx) => {
              const compH = comp.height;
              const y = currentYSide - compH;
              currentYSide -= compH;
              
              if (comp.type === 'shelf') {
                return renderPiece('Estante', 10, y, carcassDepth - 30, MELAMINE_THICKNESS, 'Proyecc. Estante', `shelf-side-${idx}`);
              }
              if (comp.type === 'drawer') {
                return (
                  <React.Fragment key={`drawer-group-${idx}`}>
                    {/* Frente */}
                    {renderPiece('Frente de Cajón', isInset ? depth - 18 : carcassDepth, y + 2, 18, compH - 4, 'Frente', `drawer-front-${idx}`)}
                    {/* Caja */}
                    {renderPiece('Caja de Cajón', 10, y + 10, carcassDepth - 20, compH - 20, 'Caja', `drawer-box-${idx}`)}
                  </React.Fragment>
                );
              }
              if (comp.type === 'door') {
                return renderPiece('Puerta', isInset ? depth - 18 : carcassDepth, y + 2, 18, compH - 4, 'Puerta', `door-side-${idx}`);
              }
              return null;
            });
          })()}
        </svg>
      </div>
    );
  };

  // 3. VISTA PLANTA (Desde arriba)
  const renderTopView = () => {
    const viewW = width;
    const viewH = depth;

    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold uppercase text-muted-foreground">Planta</span>
        <svg width={viewW * SCALE} height={viewH * SCALE} className="overflow-visible bg-secondary/5 rounded border">
          {/* Laterales */}
          {renderPiece('Lateral', 0, 0, MELAMINE_THICKNESS, carcassDepth, 'Lat', 'lat-top-left')}
          {renderPiece('Lateral', viewW - MELAMINE_THICKNESS, 0, MELAMINE_THICKNESS, carcassDepth, 'Lat', 'lat-top-right')}
          
          {/* Fondo */}
          {renderPiece('Panel Trasero', MELAMINE_THICKNESS, 0, interiorWidth, 3, 'Fondo', 'fondo-top')}
          
          {/* Refuerzos Superiores (o Tapa) */}
          {cabinet.type === 'base' ? (
             <React.Fragment key="refuerzos-top">
               {renderPiece('Refuerzo Superior', MELAMINE_THICKNESS, 10, interiorWidth, 100, 'Fleje', 'ref-top-1')}
               {renderPiece('Refuerzo Superior', MELAMINE_THICKNESS, carcassDepth - 100, interiorWidth, 100, 'Fleje', 'ref-top-2')}
             </React.Fragment>
          ) : (
             renderPiece('Tapa', MELAMINE_THICKNESS, 10, interiorWidth, carcassDepth - 15, 'Tapa', 'tapa-top')
          )}

          {/* Frontales (Proyección) */}
          {renderPiece('Puerta', isInset ? MELAMINE_THICKNESS : 0, depth - 18, isInset ? interiorWidth : width, 18, 'Frente', 'door-top')}
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-wrap justify-center gap-8 p-6 bg-background border rounded-lg shadow-inner overflow-auto max-h-[600px]">
      {renderFrontView()}
      {renderSideView()}
      {renderTopView()}
    </div>
  );
}
