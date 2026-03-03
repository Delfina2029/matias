'use client';

import { useState, useEffect, useMemo } from 'react';
import type { PlacedCabinet, CabinetComponent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Plus, ArrowLeft, ArrowUp, ArrowDown, RailSymbol, DoorOpen, HardHat, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from './ui/scroll-area';
import { cabinetData } from '@/lib/cabinets';
import { cn } from '@/lib/utils';


type CabinetEditorPanelProps = {
  cabinet: PlacedCabinet;
  onUpdate: (cabinet: PlacedCabinet) => void;
  onClose: () => void;
};

type ActiveTool = 'drawer' | 'shelf' | 'door' | 'hanging-rail';


const MELAMINE_THICKNESS = 18;
const VISUAL_EDITOR_HEIGHT_PX = 400;

export function CabinetEditorPanel({ cabinet, onUpdate, onClose }: CabinetEditorPanelProps) {
  const [dimensions, setDimensions] = useState({
    width: cabinet.width,
    height: cabinet.height,
    depth: cabinet.depth,
    depth2: cabinet.depth2 || cabinet.depth,
  });
  const [components, setComponents] = useState<CabinetComponent[]>(cabinet.components || []);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [selectedComponentPosition, setSelectedComponentPosition] = useState(0);


  const { toast } = useToast();
  const isCornerCabinet = cabinet.cabinetId === 'base-corner-900';
  const isPlacar = cabinet.type === 'placar';

  const cabinetInfo = useMemo(() => cabinetData.find(c => c.id === cabinet.cabinetId), [cabinet.cabinetId]);

  useEffect(() => {
    setDimensions({
        width: cabinet.width,
        height: cabinet.height,
        depth: cabinet.depth,
        depth2: cabinet.depth2 || cabinet.depth,
    });
    setComponents(cabinet.components || []);
    setSelectedComponentId(null);
  }, [cabinet]);

  useEffect(() => {
    if (selectedComponentId) {
      const index = components.findIndex(c => c.id === selectedComponentId);
      const isPlacarModule = cabinet.type === 'placar';
      // The base offset is the thickness of the cabinet's bottom panel.
      const baseOffset = isPlacarModule ? MELAMINE_THICKNESS : 0;
      
      if (index >= 0) {
        // Calculate position relative to the start of the component list.
        const positionInComponentList = components.slice(0, index).reduce((sum, c) => sum + c.height, 0);
        // Add the base offset to get the absolute position from the cabinet floor.
        setSelectedComponentPosition(positionInComponentList + baseOffset);
      }
    }
  }, [selectedComponentId, components, cabinet.type]);

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    setDimensions((prev) => ({ ...prev, [name]: numValue }));
  };
  
  const handleUpdateComponent = (id: string, newProps: Partial<CabinetComponent>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...newProps } : c));
  };

  const handleSave = () => {
    onUpdate({ ...cabinet, ...dimensions, components });
    toast({
      title: 'Gabinete Actualizado',
      description: 'Los componentes del gabinete han sido guardados.',
    });
  };

  const addComponentInOpening = (openingId: string, type: ActiveTool) => {
    const opening = components.find(c => c.id === openingId);
    if (!opening) return;

    let newCompHeight: number;
    let newCompType: CabinetComponent['type'] = type;

    if (type === 'shelf') {
        newCompHeight = MELAMINE_THICKNESS;
    } else if (type === 'hanging-rail') {
        newCompHeight = 80;
    } else { // drawer or door
        newCompHeight = Math.max(150, opening.height / 2);
    }
    
    if (opening.height < newCompHeight + 10) { // need at least 10mm of openings left
        toast({ variant: 'destructive', title: 'No hay suficiente espacio' });
        return;
    }

    setComponents(prev => {
        const openingIndex = prev.findIndex(c => c.id === openingId);
        if (openingIndex === -1) return prev;

        const currentOpening = prev[openingIndex];
        
        let newComp: CabinetComponent;
        if (type === 'shelf') {
            newComp = { id: `comp_${Date.now()}`, type: 'shelf', height: MELAMINE_THICKNESS };
        } else if (type === 'hanging-rail') {
            newComp = { id: `comp_${Date.now()}`, type: 'hanging-rail', height: 80 };
        } else { // drawer or door
            const defaultHeight = Math.max(150, currentOpening.height / 2);
            newComp = { id: `comp_${Date.now()}`, type: type, height: defaultHeight };
        }

        // Re-check just in case state changed
        if (currentOpening.height < newComp.height + 10) return prev;
        
        // Split the opening, placing the new component in the middle.
        const remainingHeight = currentOpening.height - newComp.height;
        const opening1Height = remainingHeight / 2;
        const opening2Height = remainingHeight / 2;

        const newOpening1: CabinetComponent = { ...currentOpening, id: `comp_open_${Date.now()}_1`, height: opening1Height };
        const newOpening2: CabinetComponent = { ...currentOpening, id: `comp_open_${Date.now()}_2`, height: opening2Height };

        const newComponents = [...prev];
        
        newComponents.splice(openingIndex, 1, newOpening1, newComp, newOpening2);
        
        return newComponents.filter(c => c.height > 1); // Filter out tiny openings
    });
  };
  
  const handleDoorConfig = (doorCount: number) => {
    setSelectedComponentId(null);
    setActiveTool(null);
    if (doorCount === 1) {
        setComponents([{ id: `comp_${Date.now()}`, type: 'door', height: dimensions.height }]);
    } else if (doorCount === 2) {
        if (cabinet.type === 'tall' || isCornerCabinet || cabinet.cabinetId.startsWith('vanity')) return;
        setComponents([
            { id: `comp_${Date.now()}_1`, type: 'door', height: dimensions.height },
            { id: `comp_${Date.now()}_2`, type: 'door', height: dimensions.height }
        ]);
    }
  };

  const handleStartWithDrawers = () => {
      setSelectedComponentId(null);
      setActiveTool(null);
      setComponents([{ id: `comp_${Date.now()}`, type: 'opening', height: dimensions.height }]);
      toast({ title: "Espacio Creado", description: "Ahora usa la barra de herramientas para añadir cajones."});
  };

  const handleUpdateComponentHeight = (id: string, newHeight: number) => {
    handleUpdateComponent(id, { height: newHeight });
  };

  const handleToggleJProfile = (id: string, enabled: boolean) => {
    setComponents(prev => prev.map(c => {
        if (c.id === id) {
            const { handle, ...rest } = c;
            if (enabled) {
                return { ...rest, handle: 'j-profile' as const };
            }
            return rest;
        }
        return c;
    }));
  };

  const handleRemoveComponent = (id: string) => {
    setComponents(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return prev;

        const componentToRemove = prev[index];
        const newComponents = [...prev];
        
        const prevComp = prev[index - 1];
        const nextComp = prev[index + 1];
        
        newComponents.splice(index, 1);

        if (prevComp?.type === 'opening' && nextComp?.type === 'opening') {
            const mergedOpeningHeight = prevComp.height + componentToRemove.height + nextComp.height;
            const mergedOpening: CabinetComponent = { ...prevComp, height: mergedOpeningHeight, id: `comp_open_${Date.now()}` };
            newComponents.splice(index - 1, 2, mergedOpening);
        } else if (prevComp?.type === 'opening') {
             const mergedOpeningHeight = prevComp.height + componentToRemove.height;
             const mergedOpening: CabinetComponent = { ...prevComp, height: mergedOpeningHeight, id: `comp_open_${Date.now()}` };
             newComponents.splice(index - 1, 1, mergedOpening);
        } else if (nextComp?.type === 'opening') {
             const mergedOpeningHeight = nextComp.height + componentToRemove.height;
             const mergedOpening: CabinetComponent = { ...nextComp, height: mergedOpeningHeight, id: `comp_open_${Date.now()}` };
             newComponents.splice(index, 1, mergedOpening);
        }

        if (newComponents.length === 0) {
            return [{ id: `comp_open_${Date.now()}`, type: 'opening', height: dimensions.height }];
        }

        return newComponents;
    });

    if (selectedComponentId === id) {
        setSelectedComponentId(null);
    }
  };

  const handleMoveComponent = (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= components.length) return;

      setComponents(prev => {
          const newComps = [...prev];
          const [moved] = newComps.splice(index, 1);
          newComps.splice(targetIndex, 0, moved);
          return newComps;
      });
  };
  
  const handleUpdateComponentPosition = (id: string, newPosition: number) => {
    const index = components.findIndex(c => c.id === id);
    if (index === -1) return;
  
    const isPlacarModule = cabinet.type === 'placar';
    const baseOffset = isPlacarModule ? MELAMINE_THICKNESS : 0;
    const targetPositionInComponentList = newPosition - baseOffset;
  
    if (targetPositionInComponentList < -0.1) { // Allow for small rounding errors
      toast({
        variant: 'destructive',
        title: 'Posición no válida',
        description: 'La posición no puede ser menor que la base del mueble.',
      });
      return;
    }
  
    const prevIndex = components.findIndex(c => c.id === id);
    // This check is important because we need openings before AND after.
    if (prevIndex <= 0 || prevIndex >= components.length - 1) {
      return;
    }
  
    const openingBefore = components[prevIndex - 1];
    const openingAfter = components[prevIndex + 1];
  
    if (openingBefore?.type !== 'opening' || openingAfter?.type !== 'opening') {
      toast({
        variant: 'destructive',
        title: 'Movimiento no válido',
        description: 'Se necesita espacio flexible (huecos) alrededor del componente para moverlo con precisión.',
      });
      return;
    }
  
    const prevPositionInComponentList = components.slice(0, prevIndex).reduce((sum, c) => sum + c.height, 0);
    const targetPos = newPosition - baseOffset;
    const delta = targetPos - prevPositionInComponentList;
  
    const newBeforeHeight = openingBefore.height + delta;
    const newAfterHeight = openingAfter.height - delta;
  
    if (newBeforeHeight < 0 || newAfterHeight < 0) {
      toast({
        variant: 'destructive',
        title: 'Límite alcanzado',
        description: 'El movimiento excede el espacio disponible.',
      });
      return;
    }
    
    // Now that all validations are done, update the state.
    setComponents(prev => {
        const newComponents = [...prev]; // Create a copy of the current state array
        
        const currentIndex = newComponents.findIndex(c => c.id === id);
        if (currentIndex <= 0 || currentIndex >= newComponents.length - 1) return prev;

        const currentOpeningBefore = newComponents[currentIndex - 1];
        const currentOpeningAfter = newComponents[currentIndex + 1];
        if (currentOpeningBefore?.type !== 'opening' || currentOpeningAfter?.type !== 'opening') return prev;

        const currentPrevPositionInComponentList = newComponents.slice(0, currentIndex).reduce((sum, c) => sum + c.height, 0);
        const currentTargetPos = newPosition - baseOffset;
        const currentDelta = currentTargetPos - currentPrevPositionInComponentList;
        
        const currentNewBeforeHeight = currentOpeningBefore.height + currentDelta;
        const currentNewAfterHeight = currentOpeningAfter.height - currentDelta;

        if (currentNewBeforeHeight < 0 || currentNewAfterHeight < 0) return prev;

        newComponents[currentIndex - 1] = { ...currentOpeningBefore, height: currentNewBeforeHeight };
        newComponents[currentIndex + 1] = { ...currentOpeningAfter, height: currentNewAfterHeight };

        return newComponents.filter(c => c.height > 0.1);
    });
  };
  
  const internalHeight = isPlacar ? dimensions.height - (2 * MELAMINE_THICKNESS) : dimensions.height;
  const totalComponentsHeight = components.reduce((sum, c) => sum + c.height, 0);
  const remainingHeight = internalHeight - totalComponentsHeight;

  const selectedComponent = components.find(c => c.id === selectedComponentId);


  const selectedDrawerPieces = useMemo(() => {
    if (!selectedComponent || selectedComponent.type !== 'drawer') {
      return [];
    }

    if (cabinet.cabinetId.startsWith('vanity')) {
        const component = selectedComponent;
        const { width } = dimensions;
        const pieces: {name: string, dimensions: string, quantity: number}[] = [];

        const interiorWidth = width - (2 * MELAMINE_THICKNESS);
        const drawerBoxHeight = 100;
        const drawerBoxDepth = 350;
        const drawerBoxWidth = interiorWidth - 24;
        const plumbingGap = 160;
        const sideBoxInnerWidth = (drawerBoxWidth - plumbingGap) / 2;
        
        let frontHeight = component.height - 4;
        let frontName;
        if (component.handle === 'j-profile') {
            frontHeight -= 26.8;
            frontName = 'Frente de Cajón (Perfil J)';
        } else {
            frontHeight -= 30;
            frontName = 'Frente de Cajón (Tirar)';
        }

        pieces.push({
          name: frontName,
          dimensions: `${(width - 4).toFixed(1)} x ${frontHeight.toFixed(1)} mm`,
          quantity: 1,
        });

        pieces.push({
            name: 'Lateral de Cajón Vanitory',
            dimensions: `${drawerBoxDepth.toFixed(1)} x ${drawerBoxHeight.toFixed(1)} mm`,
            quantity: 4,
        });

        pieces.push({
            name: 'Frente Interno Cajón Vanitory',
            dimensions: `${drawerBoxWidth.toFixed(1)} x ${drawerBoxHeight.toFixed(1)} mm`,
            quantity: 1,
        });

        pieces.push({
            name: 'Trasero de Cajón Vanitory (Lado)',
            dimensions: `${sideBoxInnerWidth.toFixed(1)} x ${drawerBoxHeight.toFixed(1)} mm`,
            quantity: 2,
        });

        pieces.push({
            name: 'Trasero de Cajón Vanitory (Centro)',
            dimensions: `${plumbingGap.toFixed(1)} x ${drawerBoxHeight.toFixed(1)} mm`,
            quantity: 1,
        });

        pieces.push({
            name: 'Fondo de Cajón Vanitory',
            dimensions: `${sideBoxInnerWidth.toFixed(1)} x ${(drawerBoxDepth - MELAMINE_THICKNESS).toFixed(1)} mm`,
            quantity: 2,
        });
        return pieces;
    }

    // Original logic for standard drawers
    const component = selectedComponent;
    const { width, depth } = dimensions;
    const pieces: {name: string, dimensions: string, quantity: number}[] = [];

    const interiorWidth = width - (2 * MELAMINE_THICKNESS);
    const drawerBoxHeight = 100;
    const drawerBoxWidth = interiorWidth - 26;
    const drawerBoxDepth = depth - 30;
    
    let frontHeight = component.height - 4;
    let frontName;
    if (component.handle === 'j-profile') {
        frontHeight -= 26.8;
        frontName = 'Frente de Cajón (Perfil J)';
    } else {
        frontHeight -= 30;
        frontName = 'Frente de Cajón (Tirar)';
    }

    pieces.push({
      name: frontName,
      dimensions: `${(width - 4).toFixed(1)} x ${frontHeight.toFixed(1)} mm`,
      quantity: 1,
    });
    pieces.push({
      name: 'Lateral de Cajón',
      dimensions: `${drawerBoxDepth.toFixed(1)} x ${drawerBoxHeight.toFixed(1)} mm`,
      quantity: 2,
    });
    pieces.push({
      name: 'Frente/Trasero de Cajón',
      dimensions: `${(drawerBoxWidth - (2*MELAMINE_THICKNESS)).toFixed(1)} x ${drawerBoxHeight.toFixed(1)} mm`,
      quantity: 2,
    });
    pieces.push({
      name: 'Fondo de Cajón',
      dimensions: `${(drawerBoxWidth - (2*MELAMINE_THICKNESS)).toFixed(1)} x ${drawerBoxDepth.toFixed(1)} mm`,
      quantity: 1,
    });

    return pieces;
  }, [selectedComponent, dimensions, cabinet.cabinetId]);

  const ToolButton = ({ tool, children }: {tool: ActiveTool, children: React.ReactNode}) => (
    <Button
        variant={activeTool === tool ? 'secondary' : 'outline'}
        className="w-full justify-start"
        onClick={() => setActiveTool(current => current === tool ? null : tool)}
    >
        {children}
    </Button>
  );

  return (
     <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div>
                    <h4 className="font-semibold leading-tight">Editar {cabinetInfo?.name}</h4>
                    <p className="text-xs text-muted-foreground">{cabinet.width}x{cabinet.height}x{cabinet.depth}mm</p>
                </div>
            </div>
            <Button size="sm" onClick={handleSave}>Guardar Cambios</Button>
        </div>
        <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
                <div>
                    <h4 className="font-medium mb-2 text-sm">Dimensiones Generales</h4>
                    <div className="grid gap-4 py-4">
                        {isCornerCabinet ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="width">Espacio en Pared (mm)</Label>
                                <Input id="width" name="width" type="number" value={dimensions.width} onChange={handleDimensionChange} />
                            </div>
                            <div>
                                <Label htmlFor="height">Alto (mm)</Label>
                                <Input id="height" name="height" type="number" value={dimensions.height} onChange={handleDimensionChange} />
                            </div>
                            <div>
                                <Label htmlFor="depth">Profundidad Cuerpo 1 (mm)</Label>
                                <Input id="depth" name="depth" type="number" value={dimensions.depth} onChange={handleDimensionChange} />
                            </div>
                            <div>
                                <Label htmlFor="depth2">Profundidad Cuerpo 2 (mm)</Label>
                                <Input id="depth2" name="depth2" type="number" value={dimensions.depth2} onChange={handleDimensionChange} />
                            </div>
                        </div>
                        ) : (
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="width">Ancho (mm)</Label>
                                <Input id="width" name="width" type="number" value={dimensions.width} onChange={handleDimensionChange} />
                            </div>
                            <div>
                                <Label htmlFor="height">Alto (mm)</Label>
                                <Input id="height" name="height" type="number" value={dimensions.height} onChange={handleDimensionChange} />
                            </div>
                            <div>
                                <Label htmlFor="depth">Profundidad (mm)</Label>
                                <Input id="depth" name="depth" type="number" value={dimensions.depth} onChange={handleDimensionChange} />
                            </div>
                        </div>
                        )}
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-center">Personalizar Componentes</h4>
                    <div className="grid grid-cols-[180px_1fr] gap-6 items-start">
                        {/* Toolbar */}
                        <div className="space-y-3 sticky top-4">
                            <h5 className="font-semibold text-sm px-2">Añadir Componente</h5>
                            <div className="flex flex-col space-y-2">
                                {isPlacar ? (
                                    <>
                                        <ToolButton tool="shelf"><HardHat className="mr-2 h-4 w-4" />Estante</ToolButton>
                                        <ToolButton tool="hanging-rail"><RailSymbol className="mr-2 h-4 w-4" />Barral</ToolButton>
                                        <Button variant="outline" className="w-full justify-start text-muted-foreground" disabled><Box className="mr-2 h-4 w-4" />Parante</Button>
                                    </>
                                ) : (
                                    <>
                                        <ToolButton tool="shelf"><HardHat className="mr-2 h-4 w-4" />Estante</ToolButton>
                                        <ToolButton tool="drawer"><Box className="mr-2 h-4 w-4" />Cajón</ToolButton>
                                        <ToolButton tool="door"><DoorOpen className="mr-2 h-4 w-4" />Puerta</ToolButton>
                                    </>
                                )}
                            </div>
                             <Separator className="my-4"/>
                             <h5 className="font-semibold text-sm px-2">Config. Rápida</h5>
                             <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start" onClick={() => handleDoorConfig(1)}>1 Puerta</Button>
                                <Button variant="outline" className="w-full justify-start" disabled={cabinet.type === 'tall' || isCornerCabinet || cabinet.cabinetId.startsWith('vanity')} onClick={() => handleDoorConfig(2)}>2 Puertas</Button>
                                <Button variant="outline" className="w-full justify-start" onClick={handleStartWithDrawers}><Plus className="mr-2 h-4 w-4" />Empezar con Huecos</Button>
                             </div>
                        </div>

                         <div className="grid grid-cols-1 gap-6">
                            {/* Interactive 2D Layout */}
                            <div className="space-y-2">
                                <h5 className="font-semibold text-center text-sm">Maqueta 2D (Interior)</h5>
                                <div className="relative w-full bg-secondary/30 rounded-md border-2 border-dashed" style={{ height: `${VISUAL_EDITOR_HEIGHT_PX}px` }}>
                                    <div className="absolute inset-0 flex flex-col-reverse">
                                        {components.map((comp, index) => {
                                            const visualHeight = (comp.height / internalHeight) * 100;
                                            const isSelected = selectedComponentId === comp.id;

                                            return (
                                                <div
                                                    key={comp.id}
                                                    style={{ height: `${visualHeight}%` }}
                                                    className={cn(
                                                        "w-full flex items-center justify-center text-xs relative transition-all",
                                                        comp.type === 'shelf' ? 'bg-amber-200 dark:bg-amber-800' :
                                                        comp.type === 'hanging-rail' ? 'bg-slate-400 dark:bg-slate-600' :
                                                        'bg-secondary/80',
                                                        isSelected && "ring-2 ring-accent z-10",
                                                        comp.type === 'opening' && 'hover:bg-green-500/10',
                                                        (activeTool && comp.type === 'opening') ? 'cursor-copy ring-2 ring-green-500 ring-offset-2' : 'cursor-pointer'
                                                    )}
                                                    onClick={() => {
                                                        if (activeTool && comp.type === 'opening') {
                                                            addComponentInOpening(comp.id, activeTool);
                                                            setActiveTool(null);
                                                        } else {
                                                            setSelectedComponentId(comp.id)
                                                        }
                                                    }}
                                                >
                                                    <span className={cn(
                                                        'text-muted-foreground mix-blend-multiply dark:mix-blend-normal',
                                                        isSelected && 'font-bold text-accent-foreground'
                                                    )}>
                                                        {comp.type === 'shelf' ? '' :
                                                         comp.type === 'hanging-rail' ? 'Barral' :
                                                         comp.type === 'opening' ? `Hueco (${comp.height.toFixed(0)}mm)` : `${comp.type} (${comp.height.toFixed(0)}mm)`}
                                                    </span>

                                                    {isSelected && comp.type !== 'opening' && (
                                                        <div className="absolute top-1 right-1 z-20 flex items-center gap-1 bg-background/80 p-1 rounded-md">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === components.length -1} onClick={(e) => {e.stopPropagation(); handleMoveComponent(index, 'down')}}><ArrowUp className="h-4 w-4"/></Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={(e) => {e.stopPropagation(); handleMoveComponent(index, 'up')}}><ArrowDown className="h-4 w-4"/></Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                {components.length > 0 && !isCornerCabinet && (
                                    <div className="text-xs text-muted-foreground space-y-1 pt-2">
                                        <div className="flex justify-between"><span>Suma de alturas:</span> <span>{totalComponentsHeight.toFixed(1)}mm</span></div>
                                        <div className={`flex justify-between font-medium ${Math.abs(remainingHeight) > 0.1 ? 'text-destructive' : ''}`}><span>Espacio restante:</span> <span>{remainingHeight.toFixed(1)}mm</span></div>
                                    </div>
                                )}
                            </div>

                            {/* Controls & Editor */}
                            <div className="space-y-4 sticky top-4">
                                {selectedComponent ? (
                                    <div className="space-y-4 p-3 border rounded-md bg-background animate-in fade-in-50">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-medium">Editar Componente</h5>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveComponent(selectedComponent.id)}>
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Quitar</span>
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <Label htmlFor="comp-height">Alto del Componente (mm)</Label>
                                                <Input 
                                                    id="comp-height"
                                                    type="number"
                                                    value={selectedComponent.height}
                                                    onChange={(e) => handleUpdateComponentHeight(selectedComponent.id, Number(e.target.value))}
                                                    disabled={['shelf', 'opening', 'hanging-rail'].includes(selectedComponent.type)}
                                                />
                                            </div>

                                            {selectedComponent.type !== 'opening' && (
                                                <div className="space-y-1">
                                                    <Label htmlFor="comp-position">Posición desde Abajo (mm)</Label>
                                                    <Input 
                                                        id="comp-position"
                                                        type="number"
                                                        value={Math.round(selectedComponentPosition)}
                                                        onChange={(e) => handleUpdateComponentPosition(selectedComponent.id, Number(e.target.value))}
                                                    />
                                                    <p className="text-xs text-muted-foreground">Distancia hasta la base del componente.</p>
                                                </div>
                                            )}
                                        </div>

                                        {selectedComponent.type === 'door' && (
                                            <div className="flex items-center justify-between space-x-2 pt-3 border-t mt-3">
                                            <Label htmlFor="hinge-type" className="flex flex-col space-y-1">
                                                <span>Tipo de Apertura</span>
                                                <span className="font-normal leading-snug text-muted-foreground text-xs">
                                                    Define cómo se abre la puerta.
                                                </span>
                                            </Label>
                                            <Select onValueChange={(value: 'side' | 'top') => handleUpdateComponent(selectedComponent.id, { hinge: value as 'side' | 'top' })} value={selectedComponent.hinge || 'side'}>
                                                <SelectTrigger id="hinge-type" className="w-[140px]">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="side">Apertura Lateral</SelectItem>
                                                    <SelectItem value="top">Hacia Arriba</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            </div>
                                        )}
                                        
                                        {selectedComponent.type !== 'opening' && selectedComponent.type !== 'shelf' && selectedComponent.type !== 'hanging-rail' && (
                                            <div className="flex items-center justify-between space-x-2 pt-3 border-t mt-3">
                                                <Label htmlFor="j-profile-switch" className="flex flex-col space-y-1">
                                                    <span>Perfil J</span>
                                                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                                                        Añade un tirador integrado.
                                                    </span>
                                                </Label>
                                                <Switch
                                                    id="j-profile-switch"
                                                    checked={selectedComponent.handle === 'j-profile'}
                                                    onCheckedChange={(checked) => handleToggleJProfile(selectedComponent.id, checked)}
                                                />
                                            </div>
                                        )}
                                        
                                        {selectedComponent.type === 'drawer' && selectedDrawerPieces.length > 0 && (
                                            <div className="space-y-2 pt-3 border-t mt-3">
                                            <h6 className="text-sm font-medium">Despiece del Cajón</h6>
                                            <Table className="text-xs">
                                                <TableHeader>
                                                <TableRow>
                                                    <TableHead className="h-8 px-2">Cant.</TableHead>
                                                    <TableHead className="h-8 px-2">Pieza</TableHead>
                                                    <TableHead className="h-8 px-2 text-right">Dimensiones (AnxAl)</TableHead>
                                                </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                {selectedDrawerPieces.map((piece, index) => (
                                                    <TableRow key={index}>
                                                    <TableCell className="font-medium py-1 px-2">{piece.quantity}</TableCell>
                                                    <TableCell className="py-1 px-2">{piece.name}</TableCell>
                                                    <TableCell className="text-right py-1 px-2">{piece.dimensions}</TableCell>
                                                    </TableRow>
                                                ))}
                                                </TableBody>
                                            </Table>
                                            </div>
                                        )}
                                        
                                        {selectedComponent.type === 'door' && (() => {
                                            const treatAsHorizontalDoors = cabinet.type !== 'tall' && !cabinet.cabinetId.startsWith('vanity') && components.length > 1 && components.every(c => c.type === 'door');
                                            const isVanityTwoDoor = cabinet.cabinetId.startsWith('vanity') && components.filter(c => c.type === 'door').length > 0;

                                            let doorQuantity = 1;
                                            let doorWidth = dimensions.width - 4;

                                            let doorHeight = selectedComponent.height - 4;
                                            let doorName;

                                            if (selectedComponent.handle === 'j-profile') {
                                                doorHeight -= 26.8;
                                                doorName = 'Puerta (Perfil J)';
                                            } else {
                                                doorHeight -= 30;
                                                doorName = 'Puerta (Tirar)';
                                            }

                                            if (isVanityTwoDoor) {
                                                doorQuantity = 2;
                                                doorWidth = (dimensions.width - 6) / 2;
                                            } else if (treatAsHorizontalDoors) {
                                                const numHorizontalDoors = components.length;
                                                doorWidth = (dimensions.width - (2 * (numHorizontalDoors + 1))) / numHorizontalDoors;
                                            }

                                            return (
                                                <div className="space-y-2 pt-3 border-t mt-3">
                                                    <h6 className="text-sm font-medium">Despiece de la Puerta</h6>
                                                    <Table className="text-xs">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="h-8 px-2">Cant.</TableHead>
                                                                <TableHead className="h-8 px-2">Pieza</TableHead>
                                                                <TableHead className="h-8 px-2 text-right">Dimensiones (AnxAl)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            <TableRow>
                                                                <TableCell className="font-medium py-1 px-2">{doorQuantity}</TableCell>
                                                                <TableCell className="py-1 px-2">{doorName}</TableCell>
                                                                <TableCell className="text-right py-1 px-2">{`${doorWidth.toFixed(1)} x ${doorHeight.toFixed(1)} mm`}</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            );
                                        })()}

                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground p-4 flex items-center justify-center h-full">
                                        <p>{activeTool ? `Haz clic en un hueco para añadir un ${activeTool}` : 'Selecciona un componente de la maqueta para editar sus propiedades.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
    </div>
  );
}

    