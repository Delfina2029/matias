'use client';

import { useState, useEffect, useMemo } from 'react';
import type { PlacedCabinet, CabinetComponent } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Plus, ArrowUp, ArrowDown } from 'lucide-react';
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


type CabinetEditorProps = {
  cabinet: PlacedCabinet;
  onUpdate: (cabinet: PlacedCabinet) => void;
  onClose: () => void;
};

const MELAMINE_THICKNESS = 18;

export function CabinetEditor({ cabinet, onUpdate, onClose }: CabinetEditorProps) {
  const [dimensions, setDimensions] = useState({
    width: cabinet.width,
    height: cabinet.height,
    depth: cabinet.depth,
    depth2: cabinet.depth2 || cabinet.depth,
  });
  const [components, setComponents] = useState<CabinetComponent[]>(cabinet.components || []);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const { toast } = useToast();
  const isCornerCabinet = cabinet.cabinetId === 'base-corner-900';

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

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    setDimensions((prev) => ({ ...prev, [name]: numValue }));
  };
  
  const handleUpdateComponent = (id: string, newProps: Partial<CabinetComponent>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...newProps } : c));
  };
  
  const moveComponent = (id: string, direction: 'up' | 'down') => {
    setComponents(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return prev;

        const newComponents = [...prev];
        // In flex-col-reverse, UP means a higher index. DOWN means a lower index.
        const toIndex = direction === 'up' ? index + 1 : index - 1;

        if (toIndex < 0 || toIndex >= newComponents.length) return prev;
        
        const element = newComponents.splice(index, 1)[0];
        newComponents.splice(toIndex, 0, element);

        return newComponents;
    });
  };

  const handleSave = () => {
    onUpdate({ ...cabinet, ...dimensions, components });
    toast({
      title: 'Gabinete Actualizado',
      description: 'Las dimensiones y componentes del gabinete han sido guardados.',
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

  const handleDoorConfig = (doorCount: number) => {
    setSelectedComponentId(null);

    // Special logic for the vanitory to preserve the drawer(s)
    if (cabinet.cabinetId.startsWith('vanity')) {
        const drawers = components.filter(c => c.type === 'drawer');
        const existingDoors = components.filter(c => c.type === 'door');
        
        let drawersToKeep = [...drawers];
        
        // If there are no drawers for some reason, add a default one.
        if (drawersToKeep.length === 0) {
          drawersToKeep.push({ id: `comp_${Date.now()}_drawer`, type: 'drawer' as const, height: 200 });
        }

        const totalDrawersHeight = drawersToKeep.reduce((sum, d) => sum + d.height, 0);
        const doorSectionHeight = dimensions.height - totalDrawersHeight;
        
        // Create a single door component to represent the door section below the drawer(s).
        // The rendering logic will interpret this single 'door' component as two doors.
        const doorComponent = { 
            id: existingDoors[0]?.id || `comp_${Date.now()}_door`, 
            type: 'door' as const, 
            height: doorSectionHeight > 0 ? doorSectionHeight : 0,
        };
        
        // Re-assemble the components, placing the door section first (renders at bottom due to flex-col-reverse)
        // and then all the drawers.
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
          // This action is destructive and doesn't make sense for a vanitory.
          // Let's reset to the default configuration.
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

  const treatAsHorizontalDoors = cabinet.type !== 'tall' && components.length > 1 && components.every(c => c.type === 'door');
  const numDoors = treatAsHorizontalDoors ? components.length : 1;

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
    <Dialog open={!!cabinet} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Gabinete</DialogTitle>
          <DialogDescription>
            Modifica las dimensiones y componentes del gabinete. Los cambios se reflejarán en la lista de corte.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto -mr-6 pr-6 max-h-[calc(80vh-150px)]">
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
          
          <Separator />

          <div className="space-y-4 py-4">
              <h4 className="font-medium text-center">Personalizar Componentes</h4>
              <div className="grid grid-cols-2 gap-6">
                  {/* Visual Preview */}
                  <div className="relative bg-secondary/30 rounded-md p-1 border-2 border-dashed flex items-end" style={{ height: 400 }}>
                      <div className={`w-full h-full flex gap-1 ${treatAsHorizontalDoors ? 'flex-row' : 'flex-col-reverse'}`}>
                          {components.map(comp => {
                              const compStyle = treatAsHorizontalDoors
                                  ? { width: `${100 / numDoors}%` }
                                  : { height: `${(comp.height / dimensions.height) * 100}%` };
                              const isVanityTwoDoor = comp.type === 'door' && cabinet.cabinetId.startsWith('vanity');
                              
                              return (
                                  <div 
                                      key={comp.id}
                                      onClick={() => setSelectedComponentId(comp.id)}
                                      className={`relative w-full border rounded-sm flex items-center justify-center cursor-pointer transition-all ${selectedComponentId === comp.id ? 'ring-2 ring-accent z-10' : ''} ${treatAsHorizontalDoors ? 'h-full' : ''}
                                        ${comp.type === 'opening' ? 'bg-secondary/20 border-dashed border-muted-foreground/50' : 'bg-primary/20 border-primary hover:bg-primary/30'}`
                                      }
                                      style={compStyle}
                                  >
                                      {isVanityTwoDoor ? (
                                        <div className="flex h-full w-full items-center justify-center gap-px">
                                            <div className="h-full w-1/2 bg-primary/20 border-r border-primary/50" />
                                            <div className="h-full w-1/2 bg-primary/20" />
                                            <span className="pointer-events-none absolute text-xs font-medium select-none text-primary-foreground/80">
                                                Puertas
                                            </span>
                                        </div>
                                      ) : (
                                        <span className={`text-xs font-medium select-none ${comp.type === 'opening' ? 'text-muted-foreground' : 'text-primary-foreground/80'}`}>
                                            {comp.type === 'drawer' ? 'Cajón' : comp.type === 'door' ? 'Puerta' : 'Espacio Abierto'}
                                        </span>
                                      )}
                                      {comp.type !== 'opening' && comp.handle === 'j-profile' && (
                                          <div className="absolute top-0.5 left-0 right-0 h-1 bg-primary/50 rounded-t-sm" title="Perfil J"></div>
                                      )}
                                      {comp.type === 'door' && comp.hinge === 'top' && (
                                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-primary-foreground/50 rounded-full" title="Apertura hacia arriba"></div>
                                      )}
                                  </div>
                              )
                          })}
                      </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
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

                      {components.length > 0 && components.every(c => c.type === 'drawer') && (
                          <Button variant="outline" size="sm" className="w-full" onClick={handleAddAnotherDrawer}>Añadir otro cajón</Button>
                      )}
                    
                      <Separator />
                      
                      {selectedComponent ? (
                          <div className="space-y-3 p-3 border rounded-md bg-background animate-in fade-in-50">
                              <div className="flex justify-between items-center">
                                  <h5 className="font-medium">Editar Componente</h5>
                                   <div className="flex items-center -mr-2">
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveComponent(selectedComponent.id, 'up')} disabled={components.findIndex(c => c.id === selectedComponent.id) === components.length - 1}>
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveComponent(selectedComponent.id, 'down')} disabled={components.findIndex(c => c.id === selectedComponent.id) === 0}>
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveComponent(selectedComponent.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                              </div>
                              <div className="space-y-1">
                                  <Label htmlFor="comp-height">Alto del Frente (mm)</Label>
                                  <Input 
                                      id="comp-height"
                                      type="number"
                                      value={selectedComponent.height}
                                      onChange={(e) => handleUpdateComponentHeight(selectedComponent.id, Number(e.target.value))}
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
                              
                              {selectedComponent.type !== 'opening' && (
                                <div className="flex items-center justify-between space-x-2 pt-2 border-t mt-2">
                                    <Label htmlFor="j-profile-switch" className="flex flex-col space-y-1">
                                        <span>Perfil J</span>
                                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                                            Añade un tirador integrado en el borde superior.
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
                                <div className="space-y-2 pt-2">
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
                                    <div className="space-y-2 pt-2">
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
                              <p>Selecciona un componente de la izquierda para editar sus medidas.</p>
                          </div>
                      )}

                      {components.length > 0 && !isCornerCabinet && (
                          <div className="text-xs text-muted-foreground space-y-1 pt-2">
                              <div className="flex justify-between"><span>Suma de alturas:</span> <span>{totalComponentsHeight}mm</span></div>
                              <div className={`flex justify-between font-medium ${remainingHeight < 0 ? 'text-destructive' : ''}`}><span>Espacio restante:</span> <span>{remainingHeight}mm</span></div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
