'use client';

import { useMemo } from 'react';
import type { PlacedCabinet, Piece } from '@/lib/types';
import { cabinetData } from '@/lib/cabinets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { OptimizerForm } from './optimizer-form';
import { Sparkles } from 'lucide-react';

type CuttingListPanelProps = {
  placedCabinets: PlacedCabinet[];
};

type AggregatedPiece = Piece & {
  from: string[];
};

export function CuttingListPanel({ placedCabinets }: CuttingListPanelProps) {
  const { aggregatedPieces, cuttingListString } = useMemo(() => {
    const pieceMap = new Map<string, AggregatedPiece>();

    placedCabinets.forEach((pc) => {
      const cabinet = cabinetData.find((c) => c.id === pc.cabinetId);
      if (cabinet) {
        cabinet.pieces.forEach((piece) => {
          const key = `${piece.width}x${piece.height}x${piece.material}`;
          const existing = pieceMap.get(key);
          if (existing) {
            existing.quantity += piece.quantity;
            if (!existing.from.includes(cabinet.name)) {
              existing.from.push(cabinet.name);
            }
          } else {
            pieceMap.set(key, { ...piece, from: [cabinet.name] });
          }
        });
      }
    });

    const piecesArray = Array.from(pieceMap.values());
    const listString = piecesArray.map(p => `${p.quantity}x ${p.name} @ ${p.width}mm x ${p.height}mm (${p.material})`).join('\n');

    return { aggregatedPieces: piecesArray, cuttingListString: listString };
  }, [placedCabinets]);

  return (
    <Card className="h-full flex flex-col">
      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <CardHeader className="flex-row justify-between items-center">
            <CardTitle className="font-headline">Project Pieces</CardTitle>
            <TabsList>
                <TabsTrigger value="list">Cutting List</TabsTrigger>
                <TabsTrigger value="optimizer" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Optimizer
                </TabsTrigger>
            </TabsList>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <TabsContent value="list" className="h-full m-0">
            <ScrollArea className="h-full p-6 pt-0">
              <Table>
                 {placedCabinets.length === 0 && <TableCaption>Add cabinets to the layout to see the cutting list.</TableCaption>}
                <TableHeader>
                  <TableRow>
                    <TableHead>Qty</TableHead>
                    <TableHead>Dimensions (WxH)</TableHead>
                    <TableHead>Material</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedPieces.map((piece, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{piece.quantity}</TableCell>
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
        </CardContent>
      </Tabs>
    </Card>
  );
}
