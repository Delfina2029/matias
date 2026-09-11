'use client';
import type { PlacedCabinet } from '@/lib/types';
import { cn } from '@/lib/utils';
import { cabinetData } from '@/lib/cabinets';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

interface KitchenLayoutPlanProps {
    placedCabinets: PlacedCabinet[];
    selectedInstanceId: string | null;
    onSelectInstance: (id: string | null) => void;
    onUpdateTransform: (
        id: string,
        transform: {
            position: [number, number, number];
            rotation: [number, number, number];
        }
    ) => void;
}

const INITIAL_PIXELS_PER_METER = 50; 
const CABINET_PIXELS_PER_METER = INITIAL_PIXELS_PER_METER * 1.5; 
const INITIAL_SCALE = 1.5;
const WALL_THICKNESS = 150;
const CANVAS_WIDTH = 4000;
const CANVAS_HEIGHT = 4000;
const ORIGIN_X = CANVAS_WIDTH / 2;
const ORIGIN_Z = 200; // 200px padding from top
const SNAP_THRESHOLD = 0.05; // 50mm

// Helper to get bounds of a cabinet considering 90deg rotations
const getCabinetBounds = (cabinet: PlacedCabinet, scale: number) => {
    const isCorner = cabinet.cabinetId === 'base-corner';
    const w = (cabinet.width / 1000) * scale;
    const d = (isCorner ? (cabinet.width2 || cabinet.width) : cabinet.depth) / 1000 * scale;
    const rot = Math.abs(cabinet.rotation[1]) % Math.PI;
    const isSwapped = (rot > Math.PI / 4 && rot < 3 * Math.PI / 4);
    const finalW = isSwapped ? d : w;
    const finalD = isSwapped ? w : d;
    return {
        left: cabinet.position[0] - finalW / 2,
        right: cabinet.position[0] + finalW / 2,
        top: cabinet.position[2] - finalD / 2,
        bottom: cabinet.position[2] + finalD / 2,
        cx: cabinet.position[0],
        cz: cabinet.position[2],
        w: finalW,
        d: finalD
    };
};

const CabinetPlanSVG = ({ 
    cabinet, 
    cabinetWidthPx, 
    cabinetWidth2Px, 
    cabinetDepthPx, 
    cabinetDepth2Px, 
    isCorner,
    pixelsPerMeter,
    scale
}: any) => {
    if (isCorner) {
        const w = cabinetWidthPx;
        const h = cabinetWidth2Px;
        const d1 = cabinetDepthPx; 
        const d2 = cabinetDepth2Px; 
        
        const dPath = `M 0 0 L ${w} 0 L ${w} ${d1} L ${d2} ${d1} L ${d2} ${h} L 0 ${h} Z`;
        
        // Two separate door segments
        // Door 1: Right Arm (Horizontal)
        const door1Start = w;
        const doorEnd = d2 + 2; // Small gap or overlap logic
        
        // Door 2: Left Arm (Vertical)
        const door2Start = d1;
        const door2End = h;

        return (
            <svg width={w} height={h} className="shadow-lg drop-shadow-sm overflow-visible">
                <path d={dPath} className="fill-background/80 hover:fill-accent/20 transition-colors stroke-foreground/50 stroke-[2px] cursor-grab active:cursor-grabbing" />
                
                {/* Horizontal Door segment (closes first) */}
                <line x1={w} y1={d1} x2={d2} y2={d1} className="stroke-primary stroke-[4px] pointer-events-none" strokeLinecap="round" />
                {/* Vertical Door segment (rests against horizontal door) */}
                <line x1={d2} y1={d1 + 6} x2={d2} y2={h} className="stroke-primary stroke-[4px] pointer-events-none" strokeLinecap="round" />
                
                <text x={w/2} y={d1/2} dominantBaseline="middle" textAnchor="middle" className="text-[10px] fill-muted-foreground/80 select-none font-medium pointer-events-none uppercase">Planta</text>
                <text x={d2/2} y={(h+d1)/2} dominantBaseline="middle" textAnchor="middle" className="text-[10px] fill-muted-foreground/80 select-none font-medium -rotate-90 uppercase">Planta</text>

                {/* Dimension axis labels matching user's diagram */}
                <text x={w/2} y={-8} textAnchor="middle" className="text-[11px] fill-red-500 select-none font-bold">Ancho B</text>
                <text x={-8} y={h/2} textAnchor="middle" dominantBaseline="middle" transform={`rotate(-90 0 ${h/2})`} className="text-[11px] fill-red-500 select-none font-bold">Ancho A</text>
                <text x={w + 8} y={d1/2} textAnchor="start" dominantBaseline="middle" className="text-[11px] fill-red-500 select-none font-bold">Profundidad A</text>
                <text x={d2/2} y={h + 12} textAnchor="middle" dominantBaseline="hanging" className="text-[11px] fill-red-500 select-none font-bold">Profundidad B</text>
            </svg>
        )
    }

    if (cabinet.cabinetId === 'base-blind-corner') {
        const w = cabinetWidthPx;
        const d = cabinetDepthPx;
        const blindW = (500 / 1000) * scale * pixelsPerMeter;
        const invert = cabinet.invertSide || false;
        
        return (
            <svg width={w} height={d} className="shadow-lg drop-shadow-sm overflow-visible">
                {/* Full cabinet body */}
                <rect 
                    className="fill-muted/30 pointer-events-none" 
                />
                <text 
                    x={invert ? w - blindW/2 : blindW/2} 
                    y={d/2} 
                    dominantBaseline="middle" 
                    textAnchor="middle" 
                    className="text-[9px] fill-muted-foreground/60 select-none pointer-events-none"
                >
                    CIEGO
                </text>
                
                {/* Door on the remaining width */}
                <line 
                    x1={invert ? 2 : blindW + 2} 
                    y1={d-2} 
                    x2={invert ? w - blindW - 2 : w-2} 
                    y2={d-2} 
                    className="stroke-primary stroke-[4px] pointer-events-none" 
                    strokeLinecap="round" 
                />
                <text 
                    x={invert ? (w - blindW) / 2 : blindW + (w - blindW) / 2} 
                    y={d/2} 
                    dominantBaseline="middle" 
                    textAnchor="middle" 
                    className="text-[10px] fill-muted-foreground/80 select-none font-medium pointer-events-none"
                >
                    PLANTA
                </text>
            </svg>
        )
    }

    return (
        <svg width={cabinetWidthPx} height={cabinetDepthPx} className="shadow-lg drop-shadow-sm overflow-visible">
            <rect x={1} y={1} width={cabinetWidthPx-2} height={cabinetDepthPx-2} className="fill-background/80 hover:fill-accent/20 transition-colors stroke-foreground/50 stroke-[2px] cursor-grab active:cursor-grabbing" rx={2} />
            <line x1={2} y1={cabinetDepthPx-2} x2={cabinetWidthPx-2} y2={cabinetDepthPx-2} className="stroke-primary stroke-[4px] pointer-events-none" strokeLinecap="round" />
            <text x={cabinetWidthPx/2} y={cabinetDepthPx/2} dominantBaseline="middle" textAnchor="middle" className="text-[10px] fill-muted-foreground/80 select-none font-medium pointer-events-none">PLANTA</text>
        </svg>
    )
}

// Dimension lines (fixed styling to avoid taking space in layout)
const DimLine = ({ vertical, value }: { vertical?: boolean, value: number }) => (
    <div className={cn("absolute flex items-center justify-center text-[10px] text-muted-foreground pointer-events-none", 
        vertical ? "flex-col top-0 bottom-0 -left-6 w-4" : "left-0 right-0 -top-6 h-4"
    )}>
        {vertical ? (
            <>
                <div className="w-full border-t border-muted-foreground/50 h-px" />
                <div className="flex-1 w-px bg-muted-foreground/50 mx-auto" />
                <span className="-rotate-90 whitespace-nowrap bg-background text-[10px] py-1 px-1 rounded-sm border">{value}</span>
                <div className="flex-1 w-px bg-muted-foreground/50 mx-auto" />
                <div className="w-full border-b border-muted-foreground/50 h-px" />
            </>
        ) : (
            <>
                <div className="h-full border-l border-muted-foreground/50 w-px" />
                <div className="flex-1 h-px bg-muted-foreground/50 my-auto" />
                <span className="whitespace-nowrap bg-background text-[10px] px-1 py-0.5 rounded-sm border">{value}</span>
                <div className="flex-1 h-px bg-muted-foreground/50 my-auto" />
                <div className="h-full border-r border-muted-foreground/50 w-px" />
            </>
        )}
    </div>
);

const InteractiveCabinetPlan = ({
    cabinet,
    placedCabinets,
    isSelected,
    onSelect,
    onUpdateTransform,
    pixelsPerMeter,
    scale
}: {
    cabinet: PlacedCabinet;
    placedCabinets: PlacedCabinet[];
    isSelected: boolean;
    onSelect: (id: string | null) => void;
    onUpdateTransform: KitchenLayoutPlanProps['onUpdateTransform'];
    pixelsPerMeter: number;
    scale: number;
}) => {
    const isCorner = cabinet.cabinetId === 'base-corner';

    const cabinetWidthM = (cabinet.width / 1000) * scale;
    const cabinetWidth2M = ((cabinet.width2 || cabinet.width) / 1000) * scale;
    const cabinetDepthM = (cabinet.depth / 1000) * scale;
    const cabinetDepth2M = ((cabinet.depth2 || cabinet.depth) / 1000) * scale;

    const cabinetWidthPx = cabinetWidthM * pixelsPerMeter;
    const cabinetWidth2Px = cabinetWidth2M * pixelsPerMeter;
    const cabinetDepthPx = cabinetDepthM * pixelsPerMeter;
    const cabinetDepth2Px = cabinetDepth2M * pixelsPerMeter;

    const cabinetInfo = cabinetData.find(c => c.id === cabinet.cabinetId);

    const baseW = cabinetWidthM;
    const baseD = isCorner ? cabinetWidth2M : cabinetDepthM;

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [pos, setPos] = useState({ x: cabinet.position[0], z: cabinet.position[2] });
    const startMouseRef = useRef({ x: 0, y: 0 });
    const startCabRef = useRef({ x: 0, z: 0 });

    useEffect(() => {
        if (!isDragging) {
            setPos({ x: cabinet.position[0], z: cabinet.position[2] });
        }
    }, [cabinet.position, isDragging]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        startMouseRef.current = { x: e.clientX, y: e.clientY };
        startCabRef.current = { x: pos.x, z: pos.z };
        onSelect(cabinet.instanceId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        
        const dx = (e.clientX - startMouseRef.current.x) / pixelsPerMeter;
        const dz = (e.clientY - startMouseRef.current.y) / pixelsPerMeter;

        let newX = startCabRef.current.x + dx;
        let newZ = startCabRef.current.z + dz;

        // Snapping logic (Iman)
        let snapX = newX;
        let snapZ = newZ;
        let minDiffX = SNAP_THRESHOLD;
        let minDiffZ = SNAP_THRESHOLD;

        const myRot = Math.abs(cabinet.rotation[1]) % Math.PI;
        const myIsSwapped = (myRot > Math.PI / 4 && myRot < 3 * Math.PI / 4);
        const myW = myIsSwapped ? baseD : baseW;
        const myD = myIsSwapped ? baseW : baseD;

        const myBounds = {
            left: newX - myW / 2,
            right: newX + myW / 2,
            top: newZ - myD / 2,
            bottom: newZ + myD / 2,
        };

        placedCabinets.forEach(other => {
            if (other.instanceId === cabinet.instanceId) return;
            const ob = getCabinetBounds(other, scale);

            // Snap X edges
            if (Math.abs(myBounds.left - ob.right) < minDiffX) {
                minDiffX = Math.abs(myBounds.left - ob.right);
                snapX = ob.right + myW / 2;
            }
            if (Math.abs(myBounds.right - ob.left) < minDiffX) {
                minDiffX = Math.abs(myBounds.right - ob.left);
                snapX = ob.left - myW / 2;
            }
            if (Math.abs(myBounds.left - ob.left) < minDiffX) {
                minDiffX = Math.abs(myBounds.left - ob.left);
                snapX = ob.left + myW / 2;
            }
            if (Math.abs(myBounds.right - ob.right) < minDiffX) {
                minDiffX = Math.abs(myBounds.right - ob.right);
                snapX = ob.right - myW / 2;
            }
            if (Math.abs(newX - ob.cx) < minDiffX) {
                minDiffX = Math.abs(newX - ob.cx);
                snapX = ob.cx;
            }

            // Snap Z edges
            if (Math.abs(myBounds.top - ob.bottom) < minDiffZ) {
                minDiffZ = Math.abs(myBounds.top - ob.bottom);
                snapZ = ob.bottom + myD / 2;
            }
            if (Math.abs(myBounds.bottom - ob.top) < minDiffZ) {
                minDiffZ = Math.abs(myBounds.bottom - ob.top);
                snapZ = ob.top - myD / 2;
            }
            if (Math.abs(myBounds.top - ob.top) < minDiffZ) {
                minDiffZ = Math.abs(myBounds.top - ob.top);
                snapZ = ob.top + myD / 2;
            }
            if (Math.abs(myBounds.bottom - ob.bottom) < minDiffZ) {
                minDiffZ = Math.abs(myBounds.bottom - ob.bottom);
                snapZ = ob.bottom - myD / 2;
            }
            if (Math.abs(newZ - ob.cz) < minDiffZ) {
                minDiffZ = Math.abs(newZ - ob.cz);
                snapZ = ob.cz;
            }
        });

        // Snap to Walls (x=0 and z=0)
        // Back Wall (Z=0)
        if (Math.abs(myBounds.top - 0) < minDiffZ) {
            minDiffZ = Math.abs(myBounds.top - 0);
            snapZ = myD / 2;
        }
        // Left Wall (X=0)
        if (Math.abs(myBounds.left - 0) < minDiffX) {
            minDiffX = Math.abs(myBounds.left - 0);
            snapX = myW / 2;
        }

        newX = snapX;
        newZ = snapZ;

        // Visual collision limits based on 3D physics using effective bounds
        const backWallLimitZ = myD / 2;
        if (newZ < backWallLimitZ) newZ = backWallLimitZ;

        const leftWallLimitX = myW / 2;
        if (newX < leftWallLimitX) newX = leftWallLimitX;

        const rightWallLimitX = 10 - (myW / 2);
        if (newX > rightWallLimitX) newX = rightWallLimitX;

        setPos({ x: newX, z: newZ });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsDragging(false);
        onUpdateTransform(cabinet.instanceId, {
            position: [pos.x, cabinet.position[1], pos.z],
            rotation: cabinet.rotation
        });
    };

    // Calculate top-left absolute coordinates in the canvas space
    // pos.x and pos.z refer to the CENTER of the bounding box footprint
    const leftPx = ORIGIN_X + (pos.x * pixelsPerMeter) - (baseW * pixelsPerMeter / 2);
    const topPx = ORIGIN_Z + (pos.z * pixelsPerMeter) - (baseD * pixelsPerMeter / 2);

    // Get rotation in degrees around Y axis (which corresponds to 2D rotation)
    const rotationDeg = (cabinet.rotation[1] * 180) / Math.PI;

    return (
        <div 
            className={cn(
                "absolute transition-shadow touch-none flex flex-col items-center",
                isSelected ? "z-20 ring-4 ring-accent rounded-sm shadow-xl" : "z-10 hover:z-20"
            )}
            style={{
                left: leftPx,
                top: topPx,
                width: baseW * pixelsPerMeter,
                height: baseD * pixelsPerMeter,
                transform: `rotate(${rotationDeg}deg)`,
                transformOrigin: "center center",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="relative w-full h-full">
                {isSelected && (
                    <>
                        <DimLine value={cabinet.width} />
                        <DimLine vertical value={isCorner ? (cabinet.width2 || cabinet.width) : cabinet.depth} />
                    </>
                )}
                
                <CabinetPlanSVG 
                    cabinet={cabinet}
                    cabinetWidthPx={cabinetWidthPx}
                    cabinetWidth2Px={cabinetWidth2Px}
                    cabinetDepthPx={cabinetDepthPx}
                    cabinetDepth2Px={cabinetDepth2Px}
                    isCorner={isCorner}
                    pixelsPerMeter={pixelsPerMeter}
                    scale={scale}
                />
            </div>

            <div className="absolute top-[100%] mt-2 flex flex-col items-center gap-1 pointer-events-none w-max max-w-[150px]">
                <p className="text-xs font-semibold truncate bg-background/80 px-1 rounded-sm shadow-sm">{cabinetInfo?.name || cabinet.cabinetId}</p>
                {isSelected && (
                    <>
                        <p className="text-[10px] text-muted-foreground bg-background/80 px-1 rounded-sm mt-0.5">
                            {`${cabinet.width}x${isCorner ? (cabinet.width2 || cabinet.width) + 'x' : ''}${cabinet.depth}mm`}
                        </p>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-6 text-[10px] mt-1 pointer-events-auto rounded-full px-3 shadow-md border-primary/20"
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdateTransform(cabinet.instanceId, {
                                    position: cabinet.position,
                                    rotation: [
                                        cabinet.rotation[0],
                                        cabinet.rotation[1] + (Math.PI / 2),
                                        cabinet.rotation[2]
                                    ]
                                });
                            }}
                        >
                            <RotateCw className="w-3 h-3 mr-1" />
                            Girar 90°
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

export function KitchenLayoutPlan({
    placedCabinets,
    selectedInstanceId,
    onSelectInstance,
    onUpdateTransform
}: KitchenLayoutPlanProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const initialRender = useRef(true);
    const [zoom, setZoom] = useState(1.0);

    const PIXELS_PER_METER = INITIAL_PIXELS_PER_METER * zoom;
    const SCALE = INITIAL_SCALE;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    setZoom(prev => Math.min(prev + 0.1, 3.0));
                } else if (e.key === '-') {
                    e.preventDefault();
                    setZoom(prev => Math.max(prev - 0.1, 0.5));
                } else if (e.key === '0') {
                    e.preventDefault();
                    setZoom(1.0);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto-scroll to origin on mount
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollLeft = (CANVAS_WIDTH / 2) - (containerRef.current.clientWidth / 2);
            containerRef.current.scrollTop = 0;
            initialRender.current = false;
        }
    }, []);

    // Scroll to center selected cabinet
    useEffect(() => {
        if (!initialRender.current && selectedInstanceId && containerRef.current) {
            const selectedCabinet = placedCabinets.find(c => c.instanceId === selectedInstanceId);
            if (selectedCabinet) {
                const cx = ORIGIN_X + (selectedCabinet.position[0] * PIXELS_PER_METER);
                const cz = ORIGIN_Z + (selectedCabinet.position[2] * PIXELS_PER_METER);

                containerRef.current.scrollTo({
                    left: cx - (containerRef.current.clientWidth / 2),
                    top: cz - (containerRef.current.clientHeight / 2),
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedInstanceId]); // Only trigger on selection change, not on dragging (which modifies positioned cabinets array in builder but selection identity remains same)

    return (
        <div 
            className="flex-1 bg-muted/10 overflow-auto relative select-none"
            ref={containerRef}
            onClick={() => onSelectInstance(null)}
        >
            <div className="absolute" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
                {/* Grid Background */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-20" 
                    style={{
                        backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
                        backgroundSize: '20px 20px', // Minor grid every 10cm
                    }}
                />
                
                {/* Meter Grid */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-20" 
                    style={{
                        backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
                        backgroundSize: '200px 200px', // Major grid every 1m
                    }}
                />

                {/* Back Wall Visualizer (X axis) */}
                <div 
                    className="absolute h-8 bg-[#858585]/40 top-[200px] border-b-4 border-[#666] shadow-sm pointer-events-none" 
                    style={{ 
                        left: ORIGIN_X, 
                        width: 10 * PIXELS_PER_METER,
                        transform: 'translateY(-100%)' 
                    }} 
                />
                
                {/* Left Wall Visualizer (Z axis) */}
                <div 
                    className="absolute w-8 bg-[#858585]/40 left-[0] top-[200px] border-r-4 border-[#666] shadow-sm pointer-events-none" 
                    style={{ 
                        left: ORIGIN_X - 32, // Offset of 32px (width of the wall)
                        height: 10 * PIXELS_PER_METER,
                    }} 
                />
                
                {placedCabinets.length === 0 && (
                    <div className="absolute top-[300px] left-[55%] -translate-x-1/2 flex items-center justify-center text-muted-foreground bg-background/50 px-4 py-2 rounded-md border font-medium">
                        Añade gabinetes al rincón para comenzar.
                    </div>
                )}

                {placedCabinets.map(cabinet => (
                    <InteractiveCabinetPlan
                        key={cabinet.instanceId}
                        cabinet={cabinet}
                        placedCabinets={placedCabinets}
                        isSelected={cabinet.instanceId === selectedInstanceId}
                        onSelect={onSelectInstance}
                        onUpdateTransform={onUpdateTransform}
                        pixelsPerMeter={PIXELS_PER_METER}
                        scale={SCALE}
                    />
                ))}
            </div>
        </div>
    );
}
