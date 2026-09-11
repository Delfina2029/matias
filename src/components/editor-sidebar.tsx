'use client';

import { useMemo, useState } from 'react';
import type { PlacedCabinet, Appearance, Piece } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { OptimizerForm } from './optimizer-form';
import { Palette, List, Settings, PlusCircle, Receipt } from 'lucide-react';
import { generatePiecesForCabinet } from '@/lib/cutting-logic';
import { AppearanceEditor } from './appearance-editor';
import { cn } from '@/lib/utils';
import { CabinetEditorPanel } from './cabinet-editor-panel';
import { cabinetData } from '@/lib/cabinets';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { CabinetSelector } from './cabinet-selector';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { QuotePanel } from './quote-panel';
import type { MaterialPrices } from '@/lib/types';


type EditorSidebarProps = {
  placedCabinets: PlacedCabinet[];
  appearance: Appearance;
  onAppearanceChange: (appearance: Appearance) => void;
  onRemoveCabinet: (instanceId: string) => void;
  onUpdateCabinet: (cabinet: PlacedCabinet) => void;
  onAddCabinet: (cabinetId: string) => void;
  onAddCustomCabinet: (customData: any) => void;
  selectedInstanceId: string | null;
  onSelectInstance: (instanceId: string | null) => void;
  prices: MaterialPrices;
  viewMode: 'plan' | '2d' | '3d' | 'technical';
  setViewMode: (mode: 'plan' | '2d' | '3d' | 'technical') => void;
  hoveredPieceName: string | null;
  onHoverPiece: (name: string | null) => void;
};

type AggregatedPiece = {
  name: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
  notes?: string;
  canRotate?: boolean;
};

const BACK_PANEL_MATERIAL = 'MDF 3mm';

export function EditorSidebar({
    placedCabinets,
    appearance,
    onAppearanceChange,
    onRemoveCabinet,
    onUpdateCabinet,
    onAddCabinet,
    onAddCustomCabinet,
    selectedInstanceId,
    onSelectInstance,
    prices,
    viewMode,
    setViewMode,
    hoveredPieceName,
    onHoverPiece
}: EditorSidebarProps) {
    const [activeTab, setActiveTab] = useState('edit');
    const [piecesGrainSettings, setPiecesGrainSettings] = useState<Record<string, boolean>>({});
    
    const editingCabinet = useMemo(() => {
        return placedCabinets.find(c => c.instanceId === selectedInstanceId) || null;
    }, [selectedInstanceId, placedCabinets]);

    const aggregatedPieces = useMemo(() => {
        const pieceMap = new Map<string, AggregatedPiece>();

        placedCabinets.forEach((pc) => {
          const pieces = generatePiecesForCabinet(pc, appearance);
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
        return piecesArray;
    }, [placedCabinets]);

    const summarizedPieces = useMemo(() => {
        const pieceMap = new Map<string, { width: number; height: number; quantity: number; material: string, canRotate: boolean }>();
        const allPieces = placedCabinets.flatMap(pc => generatePiecesForCabinet(pc, appearance));

        allPieces.forEach((piece) => {
          const roundedWidth = Math.round(piece.width * 10) / 10;
          const roundedHeight = Math.round(piece.height * 10) / 10;
          if (piece.material === 'Herrajes' || piece.material === 'Hardware' || roundedWidth <= 0 || roundedHeight <= 0) return;
          
          const key = `${roundedHeight}|${roundedWidth}|${piece.material}|${!!piece.canRotate}`;
          const existing = pieceMap.get(key);

          if (existing) {
            existing.quantity += piece.quantity;
          } else {
            pieceMap.set(key, { 
                width: roundedWidth, 
                height: roundedHeight, 
                quantity: piece.quantity, 
                material: piece.material,
                canRotate: !!piece.canRotate
            });
          }
        });

        const piecesArray = Array.from(pieceMap.values());
        piecesArray.sort((a, b) => {
            if (a.material !== b.material) return a.material.localeCompare(b.material);
            if (a.height !== b.height) return b.height - a.height;
            return b.width - a.width;
        });
        return piecesArray;
    }, [placedCabinets]);
    
    const handleCloseEditor = () => {
        onSelectInstance(null);
    }
    
    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <Tabs defaultValue="edit" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="p-3">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="add"><PlusCircle className="w-4 h-4 mr-1"/>Añadir</TabsTrigger>
                        <TabsTrigger value="edit"><Settings className="w-4 h-4 mr-1"/>Editar</TabsTrigger>
                        <TabsTrigger value="list"><List className="w-4 h-4 mr-1"/>Despiece</TabsTrigger>
                        <TabsTrigger value="quote"><Receipt className="w-4 h-4 mr-1"/>Cotización</TabsTrigger>
                        <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1"/>Apariencia</TabsTrigger>
                    </TabsList>
                </CardHeader>
                
                <TabsContent value="add" className="flex-1 h-full min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
                    <CabinetSelector onSelectCabinet={onAddCabinet} onAddCustomCabinet={onAddCustomCabinet} />
                </TabsContent>

                <TabsContent value="edit" className="flex-1 h-full min-h-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
                   {editingCabinet ? (
                        <CabinetEditorPanel
                            cabinet={editingCabinet}
                            appearance={appearance}
                            onUpdate={onUpdateCabinet}
                            onClose={handleCloseEditor}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            hoveredPieceName={hoveredPieceName}
                            onHoverPiece={onHoverPiece}
                        />
                   ) : (
                    <div className="flex-1 overflow-y-auto p-4 pt-2">
                        <div className="space-y-3">
                            {placedCabinets.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">Añade gabinetes al diseño para empezar.</p>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground text-center pt-2 pb-1">Selecciona un módulo en la escena para editarlo.</p>
                                    {placedCabinets.map(placed => {
                                        const cabinetInfo = cabinetData.find(c => c.id === placed.cabinetId);
                                        return (
                                            <Card 
                                                key={placed.instanceId}
                                                className="hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => onSelectInstance(placed.instanceId)}
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
                    </div>
                   )}
                </TabsContent>

                <TabsContent value="list" className="flex-1 h-full min-h-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-6">
                             <Tabs defaultValue="detailed" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="detailed">Despiece Detallado</TabsTrigger>
                                    <TabsTrigger value="summary">Resumen para Fábrica</TabsTrigger>
                                </TabsList>
                                <TabsContent value="detailed" className="mt-4">
                                    <Table>
                                        {aggregatedPieces.length === 0 && <TableCaption>La lista de corte aparecerá aquí.</TableCaption>}
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cant</TableHead>
                                                <TableHead>Pieza</TableHead>
                                                <TableHead>Dimensiones (Al x An)</TableHead>
                                                <TableHead>Material</TableHead>
                                                <TableHead className="text-center">Veta</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {aggregatedPieces.map((piece, index) => {
                                                const key = `${piece.name}|${piece.width}|${piece.height}|${piece.material}`;
                                                return (
                                                    <TableRow key={index} className={cn(piece.material === BACK_PANEL_MATERIAL && 'text-orange-600 dark:text-orange-400', piece.material === 'Hardware' && 'text-muted-foreground')}>
                                                        <TableCell className="font-medium">{piece.quantity}</TableCell>
                                                        <TableCell>{piece.name}</TableCell>
                                                        <TableCell>{piece.material !== 'Hardware' ? `${piece.height} x ${piece.width} mm` : piece.notes || '-'}</TableCell>
                                                        <TableCell>{piece.material}</TableCell>
                                                        <TableCell className="text-center">
                                                            {piece.material !== BACK_PANEL_MATERIAL && piece.material !== 'Hardware' ? (
                                                                <Switch
                                                                    checked={piecesGrainSettings[key] ?? !piece.canRotate}
                                                                    onCheckedChange={(checked) => {
                                                                        setPiecesGrainSettings(prev => ({ ...prev, [key]: checked }));
                                                                    }}
                                                                    aria-label="Respetar veta"
                                                                />
                                                            ) : 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                                <TabsContent value="summary" className="mt-4">
                                         <Table>
                                        {summarizedPieces.length === 0 && <TableCaption>La lista de corte aparecerá aquí.</TableCaption>}
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Cant</TableHead>
                                                <TableHead>Dimensiones (Al x An)</TableHead>
                                                <TableHead>Material</TableHead>
                                                <TableHead className="text-center">Gira?</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {summarizedPieces.map((piece, index) => (
                                                <TableRow key={index} className={cn(piece.material === BACK_PANEL_MATERIAL && 'text-orange-600 dark:text-orange-400')}>
                                                    <TableCell className="font-medium">{piece.quantity}</TableCell>
                                                    <TableCell>{`${piece.height} x ${piece.width} mm`}</TableCell>
                                                    <TableCell>{piece.material}</TableCell>
                                                    <TableCell className="text-center font-medium">
                                                        {piece.canRotate ? 'Sí' : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </Tabs>
                            <Separator />
                            <OptimizerForm pieces={aggregatedPieces} hasCuts={aggregatedPieces.length > 0} grainSettings={piecesGrainSettings} />
                    </div>
                </TabsContent>

                 <TabsContent value="quote" className="flex-1 h-full min-h-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
                    <QuotePanel placedCabinets={placedCabinets} appearance={appearance} prices={prices} />
                </TabsContent>

                <TabsContent value="appearance" className="flex-1 h-full min-h-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 overflow-y-auto p-4 pt-2">
                        <AppearanceEditor appearance={appearance} setAppearance={onAppearanceChange} />
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
