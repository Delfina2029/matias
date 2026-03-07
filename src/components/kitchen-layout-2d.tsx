'use client';
import type { PlacedCabinet, CabinetComponent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { cabinetData } from '@/lib/cabinets';
import React from 'react';

// Define props for the 2D layout
interface KitchenLayout2DProps {
    placedCabinets: PlacedCabinet[];
    selectedInstanceId: string | null;
    onSelectInstance: (id: string | null) => void;
}

const PIXELS_PER_MM = 0.2;

const CabinetFrontElevation = ({
    cabinet,
    isSelected,
    onSelect,
}: {
    cabinet: PlacedCabinet;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) => {
    const cabinetWidthPx = cabinet.width * PIXELS_PER_MM;
    const cabinetHeightPx = cabinet.height * PIXELS_PER_MM;

    const cabinetInfo = cabinetData.find(c => c.id === cabinet.cabinetId);

    const renderComponents = (components: CabinetComponent[], parentHeight: number) => {
        // Special case for side-by-side doors
        const treatAsHorizontalDoors = cabinet.type !== 'tall' && !cabinet.cabinetId.startsWith('vanity') && components.length > 1 && components.every(c => c.type === 'door');
        const isVanityTwoDoor = cabinet.cabinetId.startsWith('vanity') && components.length > 0 && components.every(c => c.type === 'door');

        if (treatAsHorizontalDoors || isVanityTwoDoor) {
            const doorCount = isVanityTwoDoor ? 2 : components.length;
            return (
                <div className="flex h-full w-full p-1.5 gap-1.5">
                    {Array.from({ length: doorCount }).map((_, i) => (
                        <div key={i} className="relative h-full flex-1 bg-background border border-foreground/20 rounded-sm shadow-sm">
                            <div className={cn(
                                "absolute top-1/2 -translate-y-1/2 h-8 w-1 bg-foreground/40 rounded-full",
                                doorCount === 2 ? (i === 0 ? "right-1.5" : "left-1.5") : "right-1.5"
                            )} />
                        </div>
                    ))}
                </div>
            )
        }
        
        // Default: vertical stack of components
        return (
            <div className="flex flex-col-reverse h-full w-full p-1.5 gap-1.5">
                {components.map(comp => {
                    const compHeightPercent = (comp.height / parentHeight) * 100;
                    
                    if (comp.type === 'opening') {
                        return (
                            <div 
                                key={comp.id} 
                                style={{ height: `${compHeightPercent}%`}}
                                className="w-full bg-muted/40 border-foreground/20 rounded-sm shadow-inner"
                            />
                        )
                    }

                    if (comp.type === 'shelf' || comp.type === 'hanging-rail') return null;

                    return (
                        <div 
                            key={comp.id} 
                            style={{ height: `${compHeightPercent}%`}}
                            className="relative w-full bg-background border border-foreground/20 rounded-sm shadow-sm"
                        >
                            {/* Handle */}
                            {comp.type === 'drawer' && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-foreground/40 rounded-full" />
                            )}
                            {comp.type === 'door' && (
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-1 bg-foreground/40 rounded-full" />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    };

    return (
        <div 
            className={cn(
                "flex flex-col items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors",
                isSelected ? "bg-accent/10 ring-2 ring-accent" : "hover:bg-accent/5"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(cabinet.instanceId);
            }}
        >
            <div
                style={{
                    width: cabinetWidthPx,
                    height: cabinetHeightPx,
                }}
                className="bg-muted/30 border-2 border-foreground/40 flex items-center justify-center shadow-lg rounded-md"
            >
                {renderComponents(cabinet.components, cabinet.height)}
            </div>

            <div className="text-center w-full" style={{ maxWidth: cabinetWidthPx }}>
                <p className="text-sm font-medium truncate">{cabinetInfo?.name || cabinet.cabinetId}</p>
                <p className="text-xs text-muted-foreground">{`${cabinet.width}x${cabinet.height}mm`}</p>
            </div>
        </div>
    )
}


export function KitchenLayout2D({
    placedCabinets,
    selectedInstanceId,
    onSelectInstance,
}: KitchenLayout2DProps) {
    return (
        <div 
            className="flex-1 bg-muted/20 overflow-auto p-4"
            onClick={() => onSelectInstance(null)}
        >
            {placedCabinets.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Añade gabinetes para ver sus alzados aquí.</p>
                </div>
            ) : (
                <div className="flex flex-row flex-wrap items-start justify-center gap-x-6 gap-y-8">
                    {placedCabinets.map(cabinet => (
                        <CabinetFrontElevation
                            key={cabinet.instanceId}
                            cabinet={cabinet}
                            isSelected={cabinet.instanceId === selectedInstanceId}
                            onSelect={onSelectInstance}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
