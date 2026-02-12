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
import { X, Plus } from 'lucide-react';
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
    });
    setComponents(cabinet.components || []);
    setSelectedComponentId(null);
  }, [cabinet]);

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number(value);
    if (isCornerCabinet && (name === 'width' || name === 'depth')) {
      setDimensions((prev) => ({ ...prev, width: numValue, depth: numValue }));
    } else {
      setDimensions((prev) => ({ ...prev, [name]: numValue }));
    }
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

  const handleUpdateComponentHeight = (id: string, newHeight: number) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, height: newHeight } : c));
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

    const component = selectedComponent;
    const { width, depth } = dimensions;
    const pieces: {name: string, dimensions: string, quantity: number}[] = [];

    const interiorWidth = width - (2 * MELAMINE_THICKNESS);
    const drawerBoxHeight = Math.min(component.height - 40, 200);
    const drawerBoxWidth = interiorWidth - 26;
    const drawerBoxDepth = depth - 30;
    const drawerSizeLabel = drawerBoxHeight <= 150 ? 'Chico' : 'Grande';
    
    let frontHeight = component.height - 4;
    const frontName = component.handle === 'j-profile' ? 'Frente de Cajón (Perfil J)' : 'Frente de Cajón';
    if (component.handle === 'j-profile') {
        frontHeight -= 26.8;
    }

    pieces.push({
      name: frontName,
      dimensions: `${(width - 4).toFixed(1)} x ${frontHeight.toFixed(1)} mm`,
      quantity: 1,
    });
    pieces.push({
      name: `Lateral de Cajón ${drawerSizeLabel}`,
      dimensions: `${drawerBoxDepth.toFixed(1)} x ${drawerBoxHeight.toFixed(1)} mm`,
      quantity: 2,
    });
    pieces.push({
      name: `Frente/Trasero de Cajón ${drawerSizeLabel}`,
      dimensions: `${(drawerBoxWidth - (2*MELAMINE_THICKNESS)).toFixed(1)} x ${drawerBoxHeight.toFixed(1)} mm`,
      quantity: 2,
    });
    pieces.push({
      name: `Fondo de Cajón ${drawerSizeLabel}`,
      dimensions: `${(drawerBoxWidth - (2*MELAMINE_THICKNESS)).toFixed(1)} x ${drawerBoxDepth.toFixed(1)} mm`,
      quantity: 1,
    });

    return pieces;
  }, [selectedComponent, dimensions.width, dimensions.depth]);


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
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="width">Espacio en Pared (mm)</Label>
                            <Input id="width" name="width" type="number" value={dimensions.width} onChange={handleDimensionChange} />
                        </div>
                        <div>
                            <Label htmlFor="height">Alto (mm)</Label>
                            <Input id="height" name="height" type="number" value={dimensions.height} onChange={handleDimensionChange} />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Las dimensiones en la pared son simétricas (ej. 900x900mm). La profundidad del cuerpo del gabinete es de 600mm.
                    </p>
                </>
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
                              return (
                                  <div 
                                      key={comp.id}
                                      onClick={() => setSelectedComponentId(comp.id)}
                                      className={`relative w-full bg-primary/20 border border-primary rounded-sm flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-all ${selectedComponentId === comp.id ? 'ring-2 ring-accent z-10' : ''} ${treatAsHorizontalDoors ? 'h-full' : ''}`}
                                      style={compStyle}
                                  >
                                      <span className="text-xs font-medium text-primary-foreground/80 select-none">{comp.type === 'drawer' ? 'Cajón' : 'Puerta'}</span>
                                      {comp.handle === 'j-profile' && (
                                          <div className="absolute top-0.5 left-0 right-0 h-1 bg-primary/50 rounded-t-sm" title="Perfil J"></div>
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
                                    <Button variant="outline" onClick={() => { setComponents([{ id: `comp_${Date.now()}`, type: 'door', height: dimensions.height }]); setSelectedComponentId(null);}}>
                                        1 Puerta
                                    </Button>
                                    <Button variant="outline" disabled={cabinet.type === 'tall' || isCornerCabinet} onClick={() => { setComponents([
                                        { id: `comp_${Date.now()}_1`, type: 'door', height: dimensions.height },
                                        { id: `comp_${Date.now()}_2`, type: 'door', height: dimensions.height }
                                    ]); setSelectedComponentId(null);}}>
                                        2 Puertas
                                    </Button>
                                </div>
                                <Button variant="outline" className="w-full" onClick={() => { setComponents([{ id: `comp_${Date.now()}`, type: 'drawer', height: 180 }]); setSelectedComponentId(null);}}>
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
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveComponent(selectedComponent.id)}>
                                      <X className="h-4 w-4" />
                                  </Button>
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
                              
                              {selectedComponent.type === 'door' && (
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
                                                <TableCell className="font-medium py-1 px-2">1</TableCell>
                                                <TableCell className="py-1 px-2">{selectedComponent.handle === 'j-profile' ? 'Puerta (Perfil J)' : 'Puerta'}</TableCell>
                                                <TableCell className="text-right py-1 px-2">{`${(numDoors > 1 ? ((dimensions.width - 2 * (numDoors + 1)) / numDoors) : (dimensions.width-4)).toFixed(1)} x ${(selectedComponent.height - 4 - (selectedComponent.handle === 'j-profile' ? 26.8 : 0)).toFixed(1)} mm`}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                              )}

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
