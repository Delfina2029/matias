'use client';

import { useMemo } from 'react';
import type { PlacedCabinet, Appearance, Piece } from '@/lib/types';
import { generatePiecesForCabinet } from '@/lib/cutting-logic';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MaterialPrices } from '@/lib/types';

type QuotePanelProps = {
  placedCabinets: PlacedCabinet[];
  appearance: Appearance;
  prices: MaterialPrices;
};

type MaterialSummary = {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
};

export function QuotePanel({ placedCabinets, appearance, prices }: QuotePanelProps) {
  // Use prices directly as it's already the right type now
  const localPrices = prices;

  const materialQuote = useMemo(() => {
    const summary: Record<string, { quantity: number; unit: string; unitPrice: number }> = {};
    
    const melaminaArea = (localPrices.melaminaWidth || 0) * (localPrices.melaminaHeight || 0) / 1000000;
    const mdfArea = (localPrices.mdfWidth || 0) * (localPrices.mdfHeight || 0) / 1000000;
    const melaminaUnitPrice = melaminaArea > 0 ? (localPrices.melaminaPlaca || 0) / melaminaArea : 0;
    const mdfUnitPrice = mdfArea > 0 ? (localPrices.mdf3mmPlaca || 0) / mdfArea : 0;

    let totalCuttingMeters = 0;
    let totalBandingMeters = 0;

    placedCabinets.forEach(cabinet => {
      const pieces = generatePiecesForCabinet(cabinet, appearance);
      pieces.forEach(piece => {
        const area = (piece.width * piece.height * piece.quantity) / 1000000;
        
        if (piece.material.toLowerCase().includes('melamina')) {
          summary['Melamina'] = summary['Melamina'] || { quantity: 0, unit: 'm²', unitPrice: melaminaUnitPrice };
          summary['Melamina'].quantity += area;
          
          // Calculate cutting: perimeter / 1000 = cutting line estimate
          totalCuttingMeters += ((piece.width + piece.height) * 2 * piece.quantity) / 1000;
          
          // Calculate banding
          if (piece.edgeBanding) {
            let pieceBanding = 0;
            if (piece.edgeBanding.w1) pieceBanding += piece.width;
            if (piece.edgeBanding.w2) pieceBanding += piece.width;
            if (piece.edgeBanding.h1) pieceBanding += piece.height;
            if (piece.edgeBanding.h2) pieceBanding += piece.height;
            totalBandingMeters += (pieceBanding * piece.quantity) / 1000;
          }
        } else if (piece.material.toLowerCase().includes('mdf')) {
          summary['MDF 3mm'] = summary['MDF 3mm'] || { quantity: 0, unit: 'm²', unitPrice: mdfUnitPrice };
          summary['MDF 3mm'].quantity += area;
        } else if (piece.material === 'Herrajes') {
          const name = piece.name;
          let price = 0;
          let unitLabel = 'un';

          if (name === 'Bisagras Cierre Suave Codo 0') price = localPrices.bisagraCierreSuave0 || 0;
          else if (name === 'Bisagras Cierre Suave Codo 9') price = localPrices.bisagraCierreSuave9 || 0;
          else if (name === 'Bisagras Cierre Suave Codo 15') price = localPrices.bisagraCierreSuave15 || 0;
          else if (name === 'Correderas (Telescópica 300mm)') { price = localPrices.correderaTelescopica300 || 0; unitLabel = 'par'; }
          else if (name === 'Correderas (Telescópica 350mm)') { price = localPrices.correderaTelescopica350 || 0; unitLabel = 'par'; }
          else if (name === 'Correderas (Telescópica 400mm)') { price = localPrices.correderaTelescopica400 || 0; unitLabel = 'par'; }
          else if (name === 'Correderas (Telescópica 450mm)') { price = localPrices.correderaTelescopica450 || 0; unitLabel = 'par'; }
          else if (name === 'Correderas (Telescópica 500mm)') { price = localPrices.correderaTelescopica500 || 0; unitLabel = 'par'; }
          else if (name === 'Tirador / Manija') price = localPrices.tirador || 0;
          else if (name === 'Patas Cuadradas 10cm') price = localPrices.pataCuadrada10cm || 0;
          else if (name === 'Pistón a Gas') price = localPrices.pistonGas || 0;
          else if (name === 'Soportes Estante') price = localPrices.soporteEstante || 0;
          else if (name === 'Barral para Placar') { price = localPrices.barralPlacar || 0; unitLabel = 'ml'; }
          else if (name === 'Perfil J (Aluminio)') { price = localPrices.perfilJ || 0; unitLabel = 'ml'; }
          else if (name === 'Tapas Tornillo (Melamina)') { price = localPrices.tapaTornillo || 0; }

          summary[name] = summary[name] || { quantity: 0, unit: unitLabel, unitPrice: price };
          summary[name].quantity += piece.quantity;
        }
      });
    });

    // Add services to summary
    if (totalCuttingMeters > 0) {
        summary['Corte Melamina'] = { 
            quantity: totalCuttingMeters, 
            unit: 'ml', 
            unitPrice: localPrices.corteMelamina || 0
        };
    }
    if (totalBandingMeters > 0) {
        summary['Cantos Pegados Acrílico'] = { 
            quantity: totalBandingMeters, 
            unit: 'ml', 
            unitPrice: localPrices.cantosPegados || 0
        };
        summary['Canto Preencolado (Pedido)'] = { 
            quantity: totalBandingMeters, 
            unit: 'ml', 
            unitPrice: localPrices.cantoPreencolado || 0
        };
    }

    return Object.entries(summary).map(([name, data]): MaterialSummary => {
      let displayQuantity = data.quantity;
      let displayUnitPrice = data.unitPrice;
      let displayUnit = data.unit;
      let calculatedTotal = data.quantity * data.unitPrice;

      // Special display for board-based items to match user request "Modo Placa"
      if (name === 'Melamina' && melaminaArea > 0) {
          displayQuantity = data.quantity / melaminaArea;
          displayUnitPrice = localPrices.melaminaPlaca || 0;
          displayUnit = 'Placa';
      } else if (name === 'MDF 3mm' && mdfArea > 0) {
          displayQuantity = data.quantity / mdfArea;
          displayUnitPrice = localPrices.mdf3mmPlaca || 0;
          displayUnit = 'Placa';
      }

      return {
        name,
        quantity: displayQuantity,
        unit: displayUnit,
        unitPrice: displayUnitPrice,
        total: calculatedTotal
      };
    });
  }, [placedCabinets, appearance, localPrices]);

  const grandTotal = materialQuote.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-6">
        <div className="flex justify-between items-end">
            <div>
                <h3 className="text-lg font-bold">Resumen de Cotización</h3>
                <p className="text-sm text-muted-foreground">Presupuesto estimado basado en materiales y herrajes.</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium uppercase">Total Estimado</p>
                <p className="text-2xl font-bold text-primary">${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material / Herraje</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialQuote.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium text-xs">{item.name}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs">
                      {['Placa', 'ml', 'm²'].includes(item.unit) ? item.quantity.toFixed(2) : Math.ceil(item.quantity)} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                        ${item.unitPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs">
                      ${item.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">
                    ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* Price adjustment moved to Options menu */}
      </div>
    </div>
  );
}
