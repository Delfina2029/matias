'use client';

import { useMemo, useState, useEffect } from 'react';
import type { PlacedCabinet, Appearance } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { OptimizerForm } from './optimizer-form';
import { Palette, List, Plus, Settings } from 'lucide-react';
import { generatePiecesForCabinet } from '@/lib/cutting-logic';
import { AppearanceEditor } from './appearance-editor';
import { cn } from '@/lib/utils';
import { cabinetData } from '@/lib/cabinets';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { CabinetEditorPanel } from './cabinet-editor-panel';
import { CabinetSelector } from './cabinet-selector';

type EditorSidebarProps = {
  placedCabinets: PlacedCabinet[];
  appearance: Appearance;
  onAppearanceChange: (appearance: Appearance) => void;
  onRemoveCabinet: (instanceId: string) => void;
  onUpdateCabinet: (cabinet: PlacedCabinet) => void;
  onAddCabinet: (cabinetId: string) => void;
  selectedInstanceId: string | null;
  onSelectInstance: (instanceId: string | null) => void;
};

type AggregatedPiece = {
  name: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
};

const BACK_PANEL_MATERIAL = 'MDF 3mm';

export function EditorSidebar({
    placedCabinets,
    appearance,
    onAppearanceChange,
    onRemoveCabinet,
    onUpdateCabinet,
    onAddCabinet,
    selectedInstanceId,
    onSelectInstance
}: EditorSidebarProps) {
    const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('add');

    const editingCabinet = useMemo(() => {
        return placedCabinets.find(c => c.instanceId === editingInstanceId) || null;
    }, [editingInstanceId, placedCabinets]);

    useEffect(() => {
        if (selectedInstanceId && !editingInstanceId) {
            setEditingInstanceId(selectedInstanceId);
        }
        if (!selectedInstanceId && editingInstanceId) {
            // This case is handled by the close button in the editor panel
        }
    }, [selectedInstanceId, editingInstanceId]);
    
    useEffect(() => {
        if (editingInstanceId) {
            setActiveTab("edit");
        }
    }, [editingInstanceId]);

    const { aggregatedPieces, cuttingListString } = useMemo(() => {
        const pieceMap = new Map<string, AggregatedPiece>();

        placedCabinets.forEach((pc) => {
          const pieces = generatePiecesForCabinet(pc);
          pieces.forEach((piece) => {
            const roundedWidth = Math.round(piece.width * 10) / 10;
            const roundedHeight = Math.round(piece.height * 10) / 10;
            const key = `${piece.name}|${roundedWidth}|${roundedHeight}|${piece.material}`;
            const existing = pieceMap.get(key);
            if (existing) {
              existing.quantity += piece.quantity;
            } else {
              pieceMap.set(key, { ...piece, width: roundedWidth, height: roundedHeight });
            }
          });
        });

        const piecesArray = Array.from(pieceMap.values());
        piecesArray.sort((a, b) => {
          const isABackPanel = a.material === BACK_PANEL_MATERIAL;
          const isBBackPanel = b.material === BACK_PANEL_MATERIAL;
          if (isABackPanel && !isBBackPanel) return 1;
          if (!isABackPanel && isBBackPanel) return -1;
          if (a.name === b.name) return a.width - b.width;
          return a.name.localeCompare(b.name);
        });
        const listString = piecesArray.map(p => `${p.quantity}x ${p.name} @ ${p.width}mm x ${p.height}mm (${p.material})`).join('\n');
        return { aggregatedPieces: piecesArray, cuttingListString: listString };
    }, [placedCabinets]);
    
    const handleCloseEditor = () => {
        setEditingInstanceId(null);
        onSelectInstance(null);
    }

    return (
        <Card className="h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <CardHeader className="p-3">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="add"><Plus className="w-4 h-4 mr-1"/>Añadir</TabsTrigger>
                        <TabsTrigger value="edit"><Settings className="w-4 h-4 mr-1"/>Editar</TabsTrigger>
                        <TabsTrigger value="list"><List className="w-4 h-4 mr-1"/>Despiece</TabsTrigger>
                        <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1"/>Apariencia</TabsTrigger>
                    </TabsList>
                </CardHeader>

                <TabsContent value="add" className="flex-1 overflow-hidden m-0">
                    <CabinetSelector onSelectCabinet={onAddCabinet} />
                </TabsContent>

                <TabsContent value="edit" className="flex-1 flex flex-col overflow-hidden m-0">
                    {editingCabinet ? (
                        <CabinetEditorPanel
                            cabinet={editingCabinet}
                            onUpdate={onUpdateCabinet}
                            onClose={handleCloseEditor}
                        />
                    ) : (
                       <ScrollArea className="h-full p-4 pt-2">
                            <div className="space-y-3">
                                {placedCabinets.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">Añade gabinetes para empezar a editar.</p>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground text-center pt-2 pb-1">Selecciona un mueble en la lista o en la escena 3D para editarlo.</p>
                                        {placedCabinets.map(placed => {
                                            const cabinetInfo = cabinetData.find(c => c.id === placed.cabinetId);
                                            return (
                                                <Card 
                                                    key={placed.instanceId}
                                                    className={cn("hover:shadow-md transition-shadow cursor-pointer", selectedInstanceId === placed.instanceId && 'ring-2 ring-primary')}
                                                    onClick={() => {
                                                        onSelectInstance(placed.instanceId)
                                                        setEditingInstanceId(placed.instanceId)
                                                    }}
                                                >
                                                    <CardContent className="p-3 flex items-center justify-between gap-2">
                                                        {cabinetInfo && <cabinetInfo.icon className="w-8 h-8 text-primary shrink-0" />}
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="font-medium truncate">{cabinetInfo?.name || placed.cabinetId}</p>
                                                            <p className="text-xs text-muted-foreground">{placed.width}x{placed.height}x{placed.depth}mm</p>
                                                        </div>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="w-8 h-8 text-destructive/80 hover:text-destructive shrink-0"
                                                            onClick={(e) => { e.stopPropagation(); onRemoveCabinet(placed.instanceId); }}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </TabsContent>

                <TabsContent value="list" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full p-4 pt-2">
                        <div className="space-y-6">
                            <Table>
                                {placedCabinets.length === 0 && <TableCaption>Añade gabinetes al diseño para ver la lista de corte.</TableCaption>}
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cant</TableHead><TableHead>Pieza</TableHead><TableHead>Dimensiones</TableHead><TableHead>Material</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aggregatedPieces.map((piece, index) => (
                                        <TableRow key={index} className={cn(piece.material === BACK_PANEL_MATERIAL && 'text-orange-600 dark:text-orange-400')}>
                                            <TableCell className="font-medium">{piece.quantity}</TableCell><TableCell>{piece.name}</TableCell><TableCell>{`${piece.width} x ${piece.height} mm`}</TableCell><TableCell>{piece.material}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <OptimizerForm cuttingListString={cuttingListString} hasCuts={aggregatedPieces.length > 0} />
                        </div>
                    </ScrollArea>
                </TabsContent>

                 <TabsContent value="appearance" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full p-4 pt-2">
                        <AppearanceEditor appearance={appearance} setAppearance={onAppearanceChange} />
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
