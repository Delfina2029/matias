'use client';

import { useMemo } from 'react';
import type { PlacedCabinet, Appearance } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { OptimizerForm } from './optimizer-form';
import { Sparkles, Palette } from 'lucide-react';
import { generatePiecesForCabinet } from '@/lib/cutting-logic';
import { AppearanceEditor } from './appearance-editor';
import { cn } from '@/lib/utils';

type CuttingListPanelProps = {
  placedCabinets: PlacedCabinet[];
  appearance: Appearance;
  onAppearanceChange: (appearance: Appearance) => void;
};

type AggregatedPiece = {
  name: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
};

const BACK_PANEL_MATERIAL = 'MDF 3mm';

export function CuttingListPanel({ placedCabinets, appearance, onAppearanceChange }: CuttingListPanelProps) {
  const { aggregatedPieces, cuttingListString } = useMemo(() => {
    const pieceMap = new Map<string, AggregatedPiece>();

    placedCabinets.forEach((pc) => {
      const pieces = generatePiecesForCabinet(pc);
      
      pieces.forEach((piece) => {
        // Round dimensions to one decimal to avoid floating point issues creating many unique parts
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

      if (isABackPanel && !isBBackPanel) {
        return 1; // a comes after b
      }
      if (!isABackPanel && isBBackPanel) {
        return -1; // a comes before b
      }
      // For pieces of the same type, sort by name then width
      if (a.name === b.name) {
        return a.width - b.width;
      }
      return a.name.localeCompare(b.name);
    });

    const listString = piecesArray.map(p => `${p.quantity}x ${p.name} @ ${p.width}mm x ${p.height}mm (${p.material})`).join('\n');

    return { aggregatedPieces: piecesArray, cuttingListString: listString };
  }, [placedCabinets]);

  return (
    <Card className="h-full flex flex-col">
      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <CardHeader className="flex-row justify-between items-center">
            <CardTitle className="font-headline">Piezas y Apariencia</CardTitle>
            <TabsList>
                <TabsTrigger value="list">Lista de Corte</TabsTrigger>
                <TabsTrigger value="optimizer" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Optimizador
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-accent" />
                  Apariencia
                </TabsTrigger>
            </TabsList>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <TabsContent value="list" className="h-full m-0">
            <ScrollArea className="h-full p-6 pt-0">
              <Table>
                 {placedCabinets.length === 0 && <TableCaption>Añade gabinetes al diseño para ver la lista de corte.</TableCaption>}
                <TableHeader>
                  <TableRow>
                    <TableHead>Cant</TableHead>
                    <TableHead>Pieza</TableHead>
                    <TableHead>Dimensiones (AnxAl)</TableHead>
                    <TableHead>Material</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedPieces.map((piece, index) => (
                    <TableRow 
                      key={index}
                      className={cn(
                        piece.material === BACK_PANEL_MATERIAL && 'text-orange-600 dark:text-orange-400'
                      )}
                    >
                      <TableCell className="font-medium">{piece.quantity}</TableCell>
                      <TableCell>{piece.name}</TableCell>
                      <TableCell>{`${piece.width} x ${piece.height} mm`}</TableCell>
                      <TableCell>{piece.material}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="optimizer" className="h-full m-0">
            <ScrollArea className="h-full p-6 pt-0">
              <OptimizerForm cuttingListString={cuttingListString} hasCuts={aggregatedPieces.length > 0} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="appearance" className="h-full m-0">
            <ScrollArea className="h-full p-6 pt-2">
                <AppearanceEditor appearance={appearance} setAppearance={onAppearanceChange} />
            </ScrollArea>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
