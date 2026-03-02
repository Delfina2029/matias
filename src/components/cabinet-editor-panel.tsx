'use client';

import { useState, useEffect, useMemo } from 'react';
import type { PlacedCabinet, CabinetComponent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Plus, ArrowLeft, GripVertical } from 'lucide-react';
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

const MELAMINE_THICKNESS = 18;

export function CabinetEditorPanel({ cabinet, onUpdate, onClose }: CabinetEditorPanelProps) {
  const [dimensions, setDimensions] = useState({
    width: cabinet.width,
    height: cabinet.height,
    depth: cabinet.depth,
    depth2: cabinet.depth2 || cabinet.depth,
  });
  const [components, setComponents] = useState<CabinetComponent[]>(cabinet.components || []);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

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
    if (cabinet.components && cabinet.components.length > 0) {
        setSelectedComponentId(cabinet.components[0].id);
    } else {
        setSelectedComponentId(null);
    }
  }, [cabinet]);

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

  const handleAddAnotherDrawer = () => {
      const newDrawer: CabinetComponent = {
          id: `comp_${Date.now()}_${Math.random()}`,
          type: 'drawer',
          height: 180,
      }
      setComponents(prev => [...prev, newDrawer]);
  }
  
  const handleAddShelf = () => {
    setComponents(prev => {
        let openingToModifyIndex = prev.findIndex(c => c.type === 'opening');
        
        if (openingToModifyIndex === -1 && prev.length > 0) {
            // If no opening, but there are other components, find largest one to split
            let largestComponentIndex = -1;
            let maxHeight = -1;
            prev.forEach((c, i) => {
                if (c.height > maxHeight) {
                    maxHeight = c.height;
                    largestComponentIndex = i;
                }
            });
            openingToModifyIndex = largestComponentIndex;
        } else if (openingToModifyIndex === -1 && prev.length === 0) {
             // If completely empty, add a base opening
             const newOpening: CabinetComponent = { id: `comp_${Date.now()}_open`, type: 'opening', height: dimensions.height };
             setComponents([newOpening]);
             openingToModifyIndex = 0; // The one we just added
             // We return here because we will add the shelf on the next click
             return [newOpening];
        }


        const componentToSplit = prev[openingToModifyIndex];
        const newShelf: CabinetComponent = {
            id: `comp_${Date.now()}_shelf`,
            type: 'shelf',
            height: MELAMINE_THICKNESS,
        };
        const remainingHeight = componentToSplit.height - newShelf.height;
        
        if (remainingHeight <= 0) {
            toast({ variant: 'destructive', title: 'No hay suficiente espacio.' });
            return prev;
        }

        const newOpeningHeight = Math.floor(remainingHeight / 2);
        
        const newComponent1: CabinetComponent = { ...componentToSplit, id: `comp_${Date.now()}_1`, height: newOpeningHeight };
        const newComponent2: CabinetComponent = { ...componentToSplit, id: `comp_${Date.now()}_2`, height: remainingHeight - newOpeningHeight };

        const newComponents = [...prev];
        newComponents.splice(openingToModifyIndex, 1, newComponent1, newShelf, newComponent2);

        return newComponents.filter(c => c.height > 0);
    });
  };

  const handleDoorConfig = (doorCount: number) => {
    setSelectedComponentId(null);

    // Special logic for the vanitory to preserve the drawer(s)
    if (cabinet.cabinetId.startsWith('vanity')) {
        const drawers = components.filter(c => c.type === 'drawer');
        const existingDoors = components.filter(c => c.type === 'door');
        
        let drawersToKeep = [...drawers];
        
        if (drawersToKeep.length === 0) {
          drawersToKeep.push({ id: `comp_${Date.now()}_drawer`, type: 'drawer' as const, height: 200 });
        }

        const totalDrawersHeight = drawersToKeep.reduce((sum, d) => sum + d.height, 0);
        const doorSectionHeight = dimensions.height - totalDrawersHeight;
        
        const doorComponent = { 
            id: existingDoors[0]?.id || `comp_${Date.now()}_door`, 
            type: 'door' as const, 
            height: doorSectionHeight > 0 ? doorSectionHeight : 0,
        };
        
        setComponents([doorComponent, ...drawersToKeep]);
        return;
    }

    // Generic logic for other cabinets
    if (doorCount === 1) {
        setComponents([{ id: `comp_${Date.now()}`, type: 'door', height: dimensions.height }]);
    } else if (doorCount === 2) {
        if (cabinet.type === 'tall' || isCornerCabinet) return;
        setComponents([
            { id: `comp_${Date.now()}_1`, type: 'door', height: dimensions.height },
            { id: `comp_${Date.now()}_2`, type: 'door', height: dimensions.height }
        ]);
    }
  };

  const handleStartWithDrawers = () => {
      setSelectedComponentId(null);
      if (cabinet.cabinetId.startsWith('vanity')) {
          const drawerComponent = { id: `comp_${Date.now()}_drawer`, type: 'drawer' as const, height: 200 };
          const doorComponent = { id: `comp_${Date.now()}_door`, type: 'door' as const, height: dimensions.height - 200 };
          setComponents([doorComponent, drawerComponent]);
      } else {
          setComponents([{ id: `comp_${Date.now()}`, type: 'drawer', height: 180 }]);
      }
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
    setComponents(prev => prev.filter(c => c.id !== id));
    if (selectedComponentId === id) {
        setSelectedComponentId(null);
    }
  };
  
  const totalComponentsHeight = components.reduce((sum, c) => sum + c.height, 0);
  const remainingHeight = dimensions.height - totalComponentsHeight;

  const selectedComponent = components.find(c => c.id === selectedComponentId);

  // --- Drag and Drop Logic ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        if (id !== dropTargetId) {
            setDropTargetId(id);
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTargetId(null);
    };

    const handleDrop = () => {
        if (!draggedId || !dropTargetId || draggedId === dropTargetId) return;

        setComponents(prev => {
            const newComponents = [...prev];
            const draggedIndex = newComponents.findIndex(c => c.id === draggedId);
            const targetIndex = newComponents.findIndex(c => c.id === dropTargetId);

            if (draggedIndex === -1 || targetIndex === -1) return prev;
            
            const [draggedItem] = newComponents.splice(draggedIndex, 1);
            newComponents.splice(targetIndex, 0, draggedItem);
            
            return newComponents;
        });
    };
  // --- End Drag and Drop ---

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
                    <div className="grid grid-cols-2 gap-6">
                        {/* Component List */}
                        <div className="space-y-4">
                            <h5 className="font-semibold text-center text-sm">Componentes (de abajo hacia arriba)</h5>
                            <div 
                                className="space-y-2 border rounded-md p-2 bg-secondary/20 min-h-[300px]"
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onDragLeave={() => setDropTargetId(null)}
                            >
                                {components.map((comp) => (
                                    <div
                                        key={comp.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, comp.id)}
                                        onDragOver={(e) => handleDragOver(e, comp.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => setSelectedComponentId(comp.id)}
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded-md cursor-grab transition-all bg-background border",
                                            selectedComponentId === comp.id && 'ring-2 ring-accent',
                                            draggedId === comp.id && 'opacity-50',
                                            dropTargetId === comp.id && comp.id !== draggedId && 'outline-2 outline-dashed outline-accent'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                            <span>{comp.type === 'drawer' ? 'Cajón' : comp.type === 'door' ? 'Puerta' : comp.type === 'shelf' ? 'Estante' : 'Espacio Abierto'}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{comp.height}mm</span>
                                    </div>
                                ))}
                                 {components.length === 0 && (
                                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                        El gabinete está vacío.
                                    </div>
                                )}
                            </div>
                            {components.length > 0 && !isCornerCabinet && (
                                <div className="text-xs text-muted-foreground space-y-1 pt-2">
                                    <div className="flex justify-between"><span>Suma de alturas:</span> <span>{totalComponentsHeight}mm</span></div>
                                    <div className={`flex justify-between font-medium ${remainingHeight < 0 ? 'text-destructive' : ''}`}><span>Espacio restante:</span> <span>{remainingHeight}mm</span></div>
                                </div>
                            )}
                        </div>

                        {/* Controls & Editor */}
                        <div className="space-y-4">
                            {isPlacar ? (
                                <div>
                                    <h5 className="font-semibold mb-2">Configuración Interior</h5>
                                    <Button variant="outline" className="w-full" onClick={handleAddShelf}>
                                        <Plus className="mr-2 h-4 w-4" /> Añadir Estante
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <h5 className="font-semibold mb-2">Configuración Rápida</h5>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" onClick={() => handleDoorConfig(1)}>
                                                1 Puerta
                                            </Button>
                                            <Button variant="outline" disabled={cabinet.type === 'tall' || isCornerCabinet} onClick={() => handleDoorConfig(2)}>
                                                2 Puertas
                                            </Button>
                                        </div>
                                        <Button variant="outline" className="w-full" onClick={handleStartWithDrawers}>
                                            <Plus className="mr-2 h-4 w-4" /> Empezar con Cajones
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {components.length > 0 && components.every(c => c.type === 'drawer') && !isPlacar && (
                                <Button variant="outline" size="sm" className="w-full" onClick={handleAddAnotherDrawer}>Añadir otro cajón</Button>
                            )}
                            
                            <Separator />
                            
                            {selectedComponent ? (
                                <div className="space-y-3 p-3 border rounded-md bg-background animate-in fade-in-50">
                                    <div className="flex justify-between items-center">
                                        <h5 className="font-medium">Editar Componente</h5>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveComponent(selectedComponent.id)}>
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Quitar</span>
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="comp-height">Alto del Frente (mm)</Label>
                                        <Input 
                                            id="comp-height"
                                            type="number"
                                            value={selectedComponent.height}
                                            onChange={(e) => handleUpdateComponentHeight(selectedComponent.id, Number(e.target.value))}
                                            disabled={selectedComponent.type === 'shelf'}
                                        />
                                    </div>

                                    {selectedComponent.type === 'door' && (
                                        <div className="flex items-center justify-between space-x-2 pt-2 border-t mt-2">
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
                                    
                                    {selectedComponent.type !== 'opening' && selectedComponent.type !== 'shelf' && (
                                        <div className="flex items-center justify-between space-x-2 pt-2 border-t mt-2">
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
                                        <div className="space-y-2 pt-2 border-t mt-3">
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
                                        const isVanityTwoDoor = cabinet.cabinetId.startsWith('vanity');
                                        const treatAsHorizontalDoors = cabinet.type !== 'tall' && components.length > 1 && components.every(c => c.type === 'door');
                                        
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
                                            <div className="space-y-2 pt-2 border-t mt-3">
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
                                    <p>Selecciona un componente de la lista para editar sus propiedades.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
    </div>
  );
}
