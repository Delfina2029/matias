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
                    const cabinetInfo = cabinetData.find(c => c.id === cabinet.cabinetId);
                    const isSelected = cabinet.instanceId === selectedInstanceId;
                    const isCorner = cabinet.cabinetId === 'base-corner-900';
                    
                    const style: React.CSSProperties = {
                        left: `calc(50% + ${cabinet.position[0] * PIXELS_PER_METER}px)`,
                        top: `calc(50% + ${cabinet.position[2] * PIXELS_PER_METER}px)`, // use Z for top
                        transform: `translate(-50%, -50%) rotate(${cabinet.rotation[1]}rad)`
                    };

                    if (isCorner && cabinet.depth2) {
                        const wallSpace = (cabinet.width / 1000) * PIXELS_PER_METER;
                        // Use cabinet.width for wall space as per data structure
                        const depth1p = (cabinet.depth / cabinet.width) * 100;
                        const depth2p = (cabinet.depth2 / cabinet.width) * 100;

                        style.width = wallSpace;
                        style.height = wallSpace;
                        // This polygon assumes the cabinet is in a top-left corner, opening towards bottom-right
                        style.clipPath = `polygon(0% 0%, 100% 0%, 100% ${depth2p}%, ${depth1p}% ${depth2p}%, ${depth1p}% 100%, 0% 100%)`;
                    } else {
                        const cabinetWidth = (cabinet.width / 1000) * PIXELS_PER_METER;
                        const cabinetDepth = (cabinet.depth / 1000) * PIXELS_PER_METER;
                        style.width = cabinetWidth;
                        style.height = cabinetDepth;
                    }

                    return (
                        <div
                            key={cabinet.instanceId}
                            className={cn(
                                'absolute bg-card border-2 text-card-foreground shadow-lg flex items-center justify-center text-[10px] text-center p-1 cursor-pointer hover:bg-secondary transition-all',
                                isCorner ? 'rounded-none' : 'rounded-sm',
                                isSelected && 'ring-4 ring-accent z-10 bg-accent/20'
                            )}
                            style={style}
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
