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

const PIXELS_PER_METER = 120;

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
                className="relative bg-background rounded-md"
                style={{
                    width: 6 * PIXELS_PER_METER,
                    height: 6 * PIXELS_PER_METER,
                    backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                }}
            >
                {/* Walls */}
                <div className="absolute -inset-2 border border-foreground/30 rounded-lg" />
                
                {placedCabinets.map(cabinet => {
                    const isSelected = cabinet.instanceId === selectedInstanceId;
                    const isCorner = cabinet.cabinetId === 'base-corner-900';
                    
                    const cabinetWidthPx = (cabinet.width / 1000) * PIXELS_PER_METER;
                    const cabinetDepthPx = (cabinet.depth / 1000) * PIXELS_PER_METER;
                    
                    const style: React.CSSProperties = {
                        left: `calc(50% + ${cabinet.position[0] * PIXELS_PER_METER}px)`,
                        top: `calc(50% + ${cabinet.position[2] * PIXELS_PER_METER}px)`, // use Z for top
                        transform: `translate(-50%, -50%) rotate(${cabinet.rotation[1]}rad)`,
                        width: cabinetWidthPx,
                        height: cabinetDepthPx,
                    };
                    
                    const treatAsHorizontalDoors = cabinet.type !== 'tall' && !cabinet.cabinetId.startsWith('vanity') && cabinet.components.length > 1 && cabinet.components.every(c => c.type === 'door');
                    const isVanityTwoDoor = cabinet.cabinetId.startsWith('vanity') && cabinet.components.some(c => c.type === 'door');

                    let content;

                    if (treatAsHorizontalDoors) {
                         content = (
                            <div className="w-full h-full flex items-stretch">
                                {cabinet.components.map((comp, index) => (
                                    <div key={comp.id} className={cn(
                                        "h-full flex-1",
                                        index < cabinet.components.length - 1 && "border-r-2 border-foreground/50"
                                    )}>
                                    </div>
                                ))}
                            </div>
                        );
                    } else if (isVanityTwoDoor) {
                        content = (
                            <div className="w-full h-full flex items-stretch">
                                <div className="h-full flex-1 border-r-2 border-foreground/50" />
                                <div className="h-full flex-1" />
                            </div>
                        );
                    } else {
                        content = (
                            <div className="w-full h-full relative">
                                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-foreground/50" />
                            </div>
                        );
                    }

                    return (
                        <div
                            key={cabinet.instanceId}
                            className={cn(
                                'absolute bg-background/80 border-2 text-card-foreground shadow-sm cursor-pointer transition-all',
                                isSelected ? 'border-primary z-10' : 'border-foreground/70'
                            )}
                            style={style}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectInstance(cabinet.instanceId)
                            }}
                        >
                            {content}

                           {isSelected && (
                                <>
                                    {/* Width dimension */}
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground bg-background px-1 rounded whitespace-nowrap select-none">{cabinet.width}mm</div>
                                    <div className="absolute bottom-0 left-0 w-full h-0 border-t border-dashed border-foreground/50 translate-y-6">
                                        <div className="absolute left-0 -top-1 w-0 h-2 border-l border-foreground/50"></div>
                                        <div className="absolute right-0 -top-1 w-0 h-2 border-l border-foreground/50"></div>
                                    </div>
                                    
                                    {/* Depth dimension */}
                                    <div className="absolute -right-7 top-1/2 -translate-y-1/2 rotate-90 text-xs font-semibold text-foreground bg-background px-1 rounded whitespace-nowrap select-none">{cabinet.depth}mm</div>
                                     <div className="absolute top-0 right-0 h-full w-0 border-l border-dashed border-foreground/50 translate-x-6">
                                        <div className="absolute top-0 -left-1 h-0 w-2 border-t border-foreground/50"></div>
                                        <div className="absolute bottom-0 -left-1 h-0 w-2 border-t border-foreground/50"></div>
                                    </div>
                                </>
                           )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}