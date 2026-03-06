'use client';
import type { PlacedCabinet } from '@/lib/types';
import { cn } from '@/lib/utils';
import { cabinetData } from '@/lib/cabinets';
import React from 'react';

// Define props for the 2D layout
interface KitchenLayout2DProps {
    placedCabinets: PlacedCabinet[];
    selectedInstanceId: string | null;
    onSelectInstance: (id: string | null) => void;
}

const PIXELS_PER_METER = 40;

export function KitchenLayout2D({
    placedCabinets,
    selectedInstanceId,
    onSelectInstance,
}: KitchenLayout2DProps) {
    return (
        <div 
            className="flex-1 bg-muted/20 overflow-auto relative p-4 flex items-center justify-center"
            onClick={() => onSelectInstance(null)}
        >
            <div 
                className="relative bg-background border-2 rounded-md"
                style={{
                    // A 10m x 10m virtual space
                    width: 15 * PIXELS_PER_METER,
                    height: 15 * PIXELS_PER_METER,
                }}
            >
                {/* Walls */}
                <div className="absolute -inset-2 border-2 border-foreground/30 rounded-lg" />
                
                {placedCabinets.map(cabinet => {
                    const cabinetWidth = (cabinet.width / 1000) * PIXELS_PER_METER;
                    const cabinetDepth = (cabinet.depth / 1000) * PIXELS_PER_METER;
                    
                    const cabinetInfo = cabinetData.find(c => c.id === cabinet.cabinetId);
                    
                    const isSelected = cabinet.instanceId === selectedInstanceId;

                    return (
                        <div
                            key={cabinet.instanceId}
                            className={cn(
                                'absolute bg-card border-2 text-card-foreground shadow-lg flex items-center justify-center text-[10px] text-center p-1 cursor-pointer hover:bg-secondary transition-all rounded-sm',
                                isSelected && 'ring-4 ring-accent z-10 bg-accent/20'
                            )}
                            style={{
                                width: cabinetWidth,
                                height: cabinetDepth,
                                // Position relative to center of parent, adjusted for object center
                                left: `calc(50% + ${cabinet.position[0] * PIXELS_PER_METER}px)`,
                                top: `calc(50% + ${cabinet.position[2] * PIXELS_PER_METER}px)`, // use Z for top
                                transform: `translate(-50%, -50%) rotate(${cabinet.rotation[1]}rad)`
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectInstance(cabinet.instanceId)
                            }}
                        >
                            <span className="truncate select-none">{cabinetInfo?.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
