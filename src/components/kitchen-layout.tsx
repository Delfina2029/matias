'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { PlacedCabinet } from '@/lib/types';
import { cabinetData } from '@/lib/cabinets';
import { Button } from './ui/button';
import { Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type KitchenLayoutProps = {
  placedCabinets: PlacedCabinet[];
  onUpdateLayout: React.Dispatch<React.SetStateAction<PlacedCabinet[]>>;
  onClearLayout: () => void;
  onRemoveCabinet: (instanceId: string) => void;
};

const GRID_SIZE = 20;

export function KitchenLayout({
  placedCabinets,
  onUpdateLayout,
  onClearLayout,
  onRemoveCabinet
}: KitchenLayoutProps) {
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
    
    x = Math.max(0, Math.min(x, layoutRect.width - GRID_SIZE));
    y = Math.max(0, Math.min(y, layoutRect.height - GRID_SIZE));

    onUpdateLayout((prev) =>
      prev.map((c) => (c.instanceId === dragging.id ? { ...c, x, y } : c))
    );
  }, [dragging, onUpdateLayout]);

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
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-headline">Kitchen Layout</h2>
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
    </div>
  );
}
