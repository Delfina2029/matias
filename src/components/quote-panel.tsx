'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { PlacedCabinet, Appearance, Piece } from '@/lib/types';
import { generatePiecesForCabinet } from '@/lib/cutting-logic';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Percent } from 'lucide-react';
import { cabinetData } from '@/lib/cabinets';
import { Input } from '@/components/ui/input';
import type { MaterialPrices } from '@/lib/types';

type QuotePanelProps = {
  placedCabinets: PlacedCabinet[];
  appearance: Appearance;
  prices: MaterialPrices;
  onUpdatePrices?: (prices: MaterialPrices) => void;
  isFactoryMode?: boolean;
};

type MaterialSummary = {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
};

type CabinetQuoteItem = {
  name: string;
  dimensions: string;
  quantity: number;
  estimatedPrice: number;
};

export function QuotePanel({ placedCabinets, appearance, prices, onUpdatePrices, isFactoryMode = false }: QuotePanelProps) {
  const localPrices = prices;
  
  // Dynamic factory markup factor read from materials editor (defaults to 100%)
  const factoryMarkupPercent = typeof localPrices.factoryMarkupPercent === 'number' 
    ? localPrices.factoryMarkupPercent 
    : 100;
  
  const factoryMultiplier = 1 + (factoryMarkupPercent / 100);

  // Tab/Switch state for Sales Mode: 'presupuesto' (Commercial Customer) vs 'pedido' (To Factory)
  const [salesViewMode, setSalesViewMode] = useState<'presupuesto' | 'pedido'>('presupuesto');
  
  // Editable sales markup percentage (default 30%)
  const [businessMarkupPercent, setBusinessMarkupPercent] = useState<number>(30);

  const melaminaArea = (localPrices.melaminaWidth || 0) * (localPrices.melaminaHeight || 0) / 1000000;
  const mdfArea = (localPrices.mdfWidth || 0) * (localPrices.mdfHeight || 0) / 1000000;
  const melaminaUnitPrice = melaminaArea > 0 ? (localPrices.melaminaPlaca || 0) / melaminaArea : 0;
  const mdfUnitPrice = mdfArea > 0 ? (localPrices.mdf3mmPlaca || 0) / mdfArea : 0;

  // 1. Technical Material Quote (Factory Mode)
  const materialQuote = useMemo(() => {
    const summary: Record<string, { quantity: number; unit: string; unitPrice: number }> = {};
    
    let totalCuttingMeters = 0;
    let totalBandingMeters = 0;

    placedCabinets.forEach(cabinet => {
      const pieces = generatePiecesForCabinet(cabinet, appearance);
      pieces.forEach(piece => {
        const area = (piece.width * piece.height * piece.quantity) / 1000000;
        
        if (piece.material.toLowerCase().includes('melamina')) {
          summary['Melamina'] = summary['Melamina'] || { quantity: 0, unit: 'm²', unitPrice: melaminaUnitPrice };
          summary['Melamina'].quantity += area;
          
          totalCuttingMeters += ((piece.width + piece.height) * 2 * piece.quantity) / 1000;
          
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
  }, [placedCabinets, appearance, localPrices, melaminaArea, mdfArea, melaminaUnitPrice, mdfUnitPrice]);

  // Helper function to calculate cost of a single placed cabinet
  const calculateCabinetCost = (cabinet: PlacedCabinet): number => {
    let cost = 0;
    const pieces = generatePiecesForCabinet(cabinet, appearance);
    
    let cabinetCuttingMeters = 0;
    let cabinetBandingMeters = 0;

    pieces.forEach(piece => {
      const area = (piece.width * piece.height * piece.quantity) / 1000000;
      
      if (piece.material.toLowerCase().includes('melamina')) {
        cost += area * melaminaUnitPrice;
        cabinetCuttingMeters += ((piece.width + piece.height) * 2 * piece.quantity) / 1000;
        
        if (piece.edgeBanding) {
          let pieceBanding = 0;
          if (piece.edgeBanding.w1) pieceBanding += piece.width;
          if (piece.edgeBanding.w2) pieceBanding += piece.width;
          if (piece.edgeBanding.h1) pieceBanding += piece.height;
          if (piece.edgeBanding.h2) pieceBanding += piece.height;
          cabinetBandingMeters += (pieceBanding * piece.quantity) / 1000;
        }
      } else if (piece.material.toLowerCase().includes('mdf')) {
        cost += area * mdfUnitPrice;
      } else if (piece.material === 'Herrajes') {
        const name = piece.name;
        let price = 0;

        if (name === 'Bisagras Cierre Suave Codo 0') price = localPrices.bisagraCierreSuave0 || 0;
        else if (name === 'Bisagras Cierre Suave Codo 9') price = localPrices.bisagraCierreSuave9 || 0;
        else if (name === 'Bisagras Cierre Suave Codo 15') price = localPrices.bisagraCierreSuave15 || 0;
        else if (name === 'Correderas (Telescópica 300mm)') price = localPrices.correderaTelescopica300 || 0;
        else if (name === 'Correderas (Telescópica 350mm)') price = localPrices.correderaTelescopica350 || 0;
        else if (name === 'Correderas (Telescópica 400mm)') price = localPrices.correderaTelescopica400 || 0;
        else if (name === 'Correderas (Telescópica 450mm)') price = localPrices.correderaTelescopica450 || 0;
        else if (name === 'Correderas (Telescópica 500mm)') price = localPrices.correderaTelescopica500 || 0;
        else if (name === 'Tirador / Manija') price = localPrices.tirador || 0;
        else if (name === 'Patas Cuadradas 10cm') price = localPrices.pataCuadrada10cm || 0;
        else if (name === 'Pistón a Gas') price = localPrices.pistonGas || 0;
        else if (name === 'Soportes Estante') price = localPrices.soporteEstante || 0;
        else if (name === 'Barral para Placar') price = localPrices.barralPlacar || 0;
        else if (name === 'Perfil J (Aluminio)') price = localPrices.perfilJ || 0;
        else if (name === 'Tapas Tornillo (Melamina)') price = localPrices.tapaTornillo || 0;

        cost += price * piece.quantity;
      }
    });

    // Add service costs proportioned to the cabinet
    cost += cabinetCuttingMeters * (localPrices.corteMelamina || 0);
    cost += cabinetBandingMeters * (localPrices.cantosPegados || 0);
    cost += cabinetBandingMeters * (localPrices.cantoPreencolado || 0);

    return cost;
  };

  // 2. Sales Cabinet-based Quote (Sales Mode)
  const salesQuote = useMemo(() => {
    const groups: Record<string, { cabinet: PlacedCabinet; count: number; name: string }> = {};

    placedCabinets.forEach(pc => {
      const cabinetInfo = cabinetData.find(c => c.id === pc.cabinetId);
      const name = cabinetInfo?.name || pc.cabinetId;
      const key = `${pc.cabinetId}|${pc.width}|${pc.height}|${pc.depth}`;
      if (groups[key]) {
        groups[key].count += 1;
      } else {
        groups[key] = { cabinet: pc, count: 1, name };
      }
    });

    return Object.values(groups).map((group): CabinetQuoteItem => {
      const estimatedCost = calculateCabinetCost(group.cabinet);
      return {
        name: group.name,
        dimensions: `${group.cabinet.width}x${group.cabinet.height}x${group.cabinet.depth} mm`,
        quantity: group.count,
        estimatedPrice: estimatedCost
      };
    });
  }, [placedCabinets, appearance, localPrices, melaminaUnitPrice, mdfUnitPrice]);

  const grandTotal = useMemo(() => {
    if (isFactoryMode) {
      return materialQuote.reduce((acc, item) => acc + item.total, 0);
    } else {
      // Switch calculation based on sales view: 
      // 'presupuesto' -> Factory cost + Factory markup + Custom business markup (Total raw * factoryMultiplier * (1 + businessMarkupPercent/100))
      // 'pedido' -> Factory cost + Factory markup (Total raw * factoryMultiplier)
      return salesQuote.reduce((acc, item) => {
        const rawCost = item.estimatedPrice * item.quantity;
        const factoryCost = rawCost * factoryMultiplier;
        const finalSalesPrice = salesViewMode === 'presupuesto' 
          ? (factoryCost * (1 + businessMarkupPercent / 100)) 
          : factoryCost;
        return acc + finalSalesPrice;
      }, 0);
    }
  }, [isFactoryMode, materialQuote, salesQuote, salesViewMode, businessMarkupPercent, factoryMultiplier]);

  const handlePrint = () => {
    window.print();
  };

  // Generate aggregated pieces for despiece inside QuotePanel
  const aggregatedPieces = useMemo(() => {
    const pieceMap = new Map<string, { name: string; width: number; height: number; quantity: number; material: string }>();

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

    return Array.from(pieceMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [placedCabinets, appearance]);

  const { user } = useAuth();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendEmailOrder = async () => {
    setIsSendingEmail(true);
    try {
      let modulesText = '';
      salesQuote.forEach(item => {
        modulesText += `- ${item.quantity}x ${item.name} (${item.dimensions})\n`;
      });

      let materialsText = '';
      materialQuote.forEach(item => {
        const formattedQty = ['Placa', 'ml', 'm²'].includes(item.unit) ? item.quantity.toFixed(2) : Math.ceil(item.quantity);
        materialsText += `- ${formattedQty} ${item.unit} x ${item.name}\n`;
      });

      let cuttingListText = '';
      aggregatedPieces.forEach(piece => {
        if (piece.material !== 'Hardware' && piece.material !== 'Herrajes') {
          cuttingListText += `- [${piece.quantity}x] ${piece.name}: ${piece.height} x ${piece.width} mm (${piece.material})\n`;
        }
      });

      const response = await fetch('/api/send-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: user?.email || 'Desconocido',
          clientName: user?.displayName || user?.email?.split('@')[0] || 'Cliente',
          modulesText,
          materialsText,
          cuttingListText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Fallo desconocido al enviar el email.');
      }

      alert('¡Pedido enviado a fábrica con éxito!');
    } catch (error: any) {
      console.error('Error sending order:', error);
      alert('Error al enviar el pedido por email: ' + error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };



  return (
    <div className="flex-1 overflow-y-auto print:p-0">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .card-wrapper {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      
      <div className="p-4 space-y-6 print-container">
        {/* Header Section */}
        <div className="flex justify-between items-center border-b pb-4 print:border-b-2">
            <div className="flex items-center gap-3">
                <img 
                  src="/logo.jpg" 
                  alt="Nidel Muebles Logo" 
                  className="h-10 w-auto object-contain rounded print:h-12"
                />
                <div>
                    <h2 className="text-xl font-bold text-[#E07A5F] print:text-black">Nidel Muebles</h2>
                    <h3 className="text-lg font-semibold print:text-black">
                      {isFactoryMode 
                        ? "Resumen Técnico de Cotización" 
                        : salesViewMode === 'presupuesto' 
                          ? "Presupuesto de Cocina" 
                          : "Pedido de Cocina a Fábrica"}
                    </h3>
                    <p className="text-xs text-muted-foreground print:text-gray-600">
                      {isFactoryMode 
                        ? "Desglose técnico de materiales, servicios y herrajes." 
                        : salesViewMode === 'presupuesto'
                          ? "Presupuesto comercial para el cliente (Precios con IVA incluido)."
                          : "Orden de compra interna / Pago a Fábrica (Costo de Fábrica)."}
                    </p>
                    <p className="text-xs text-muted-foreground print:text-gray-600 mt-1">
                      Fecha: {new Date().toLocaleDateString('es-AR')}
                    </p>
                </div>
            </div>
        </div>

        {/* Action Buttons & Tabs inside Sales mode */}
        <div className="flex justify-between items-center gap-2 no-print flex-wrap">
            {!isFactoryMode ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center rounded-md bg-muted p-1 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSalesViewMode('presupuesto')}
                    className={`h-8 text-xs font-semibold transition-all px-3 rounded ${
                      salesViewMode === 'presupuesto' 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background/50 text-muted-foreground'
                    }`}
                  >
                    Presupuesto (Cliente)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSalesViewMode('pedido')}
                    className={`h-8 text-xs font-semibold transition-all px-3 rounded ${
                      salesViewMode === 'pedido' 
                        ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700' 
                        : 'hover:bg-background/50 text-muted-foreground'
                    }`}
                  >
                    Pedido a Fábrica
                  </Button>
                </div>
                {/* Percentage gain switcher input for shop */}
                {salesViewMode === 'presupuesto' && (
                  <>
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 border">
                      <span className="text-[11px] font-semibold text-muted-foreground">Ganancia Venta:</span>
                      <div className="flex items-center max-w-[70px] relative">
                        <Input
                          type="number"
                          min="0"
                          max="200"
                          value={businessMarkupPercent}
                          onChange={(e) => setBusinessMarkupPercent(Math.max(0, parseInt(e.target.value) || 0))}
                          className="h-7 text-xs font-bold pl-1.5 pr-5 text-center focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary"
                        />
                        <Percent className="w-3 h-3 text-muted-foreground absolute right-1.5 pointer-events-none" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Factory Mode input switcher */
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1 border">
                <span className="text-[11px] font-semibold text-muted-foreground">Ganancia Fábrica:</span>
                <div className="flex items-center max-w-[70px] relative">
                  <Input
                    type="number"
                    min="0"
                    max="200"
                    value={factoryMarkupPercent}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      if (onUpdatePrices) {
                        onUpdatePrices({ ...localPrices, factoryMarkupPercent: val });
                      }
                    }}
                    className="h-7 text-xs font-bold pl-1.5 pr-5 text-center focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary"
                  />
                  <Percent className="w-3 h-3 text-muted-foreground absolute right-1.5 pointer-events-none" />
                </div>
              </div>
            )}
            
            <div className="flex gap-2 ml-auto">
              {salesViewMode === 'pedido' && (
                <Button 
                  onClick={handleSendEmailOrder} 
                  disabled={isSendingEmail}
                  className="flex items-center gap-2 bg-[#E07A5F] hover:bg-[#d66c50] text-white font-semibold shadow-sm no-print"
                >
                    {isSendingEmail ? 'Enviando...' : 'Enviar Pedido a Fábrica'}
                </Button>
              )}
              <Button onClick={handlePrint} className="flex items-center gap-2 bg-[#E07A5F] hover:bg-[#d66c50] text-white font-semibold shadow-sm no-print">
                  <Printer className="w-4 h-4" />
                  {salesViewMode === 'presupuesto' ? 'Imprimir / Guardar en PC' : 'Imprimir Pedido'}
              </Button>
            </div>
        </div>

        {/* Content Table Card */}
        <Card className="card-wrapper overflow-hidden border border-muted/60 shadow-lg rounded-xl print:border-none print:shadow-none print:rounded-none">
          <div className="h-1.5 bg-gradient-to-r from-[#E07A5F] via-[#c8a96e] to-[#81B29A] print:hidden" />
          <CardContent className="p-0">
            {isFactoryMode ? (
              // ─── FACTORY MODE DETAILED TABLE ───
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
                    <TableRow key={item.name} className="print:border-b">
                      <TableCell className="font-medium text-xs print:text-black">{item.name}</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-xs print:text-black">
                        {['Placa', 'ml', 'm²'].includes(item.unit) ? item.quantity.toFixed(2) : Math.ceil(item.quantity)} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-xs print:text-black">
                          ${item.unitPrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs print:text-black">
                        ${item.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold print:text-black">Total Técnico</TableCell>
                    <TableCell className="text-right font-bold text-lg text-primary print:text-black">
                      ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            ) : (
              // ─── SALES MODE SIMPLIFIED TABLE ───
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción del Módulo</TableHead>
                    <TableHead className="text-center">Dimensiones (An x Al x Pr)</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesQuote.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No hay gabinetes en el diseño para cotizar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesQuote.map((item, index) => {
                      // Apply markup sequentially using the dynamic factoryMultiplier:
                      // 'presupuesto' -> unit * factoryMultiplier * (1 + businessMarkupPercent / 100)
                      // 'pedido' -> unit * factoryMultiplier
                      const markedUpUnitPrice = salesViewMode === 'presupuesto' 
                        ? (item.estimatedPrice * factoryMultiplier * (1 + businessMarkupPercent / 100))
                        : (item.estimatedPrice * factoryMultiplier);
                      const markedUpSubtotal = markedUpUnitPrice * item.quantity;
                      return (
                        <TableRow key={index} className="print:border-b">
                          <TableCell className="font-medium text-xs print:text-black">{item.name}</TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground print:text-black">{item.dimensions}</TableCell>
                          <TableCell className="text-right text-xs print:text-black">{item.quantity}</TableCell>
                          <TableCell className="text-right text-xs print:text-black">
                              ${Math.round(markedUpUnitPrice).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs print:text-black">
                            ${Math.round(markedUpSubtotal).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold print:text-black">
                      {salesViewMode === 'presupuesto' ? 'Total Presupuestado' : 'Total a Pagar a Fábrica'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg text-primary print:text-black">
                      ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </CardContent>
        </Card>
 
        {/* Breakdown block on the bottom right */}
        <div className="flex flex-col items-end mt-4 pr-6 print:pr-0">
          <div className="w-72 text-right space-y-2 border-t pt-4 print:border-t-2">
            {salesViewMode === 'presupuesto' && !isFactoryMode ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold print:text-black">TOTAL:</span>
                  <span className="font-bold text-foreground print:text-black">${Math.round(grandTotal / 1.21).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-semibold print:text-black">IVA 21 % :</span>
                  <span className="font-bold text-foreground print:text-black">${Math.round(grandTotal - (grandTotal / 1.21)).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-base border-t pt-2 mt-1">
                  <span className="font-extrabold text-[#E07A5F] print:text-black">TOTAL:</span>
                  <span className="font-extrabold text-[#E07A5F] print:text-black">${Math.round(grandTotal).toLocaleString('es-AR')}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-base">
                <span className="font-extrabold text-[#E07A5F] print:text-black">TOTAL GENERAL:</span>
                <span className="font-extrabold text-[#E07A5F] print:text-black">${Math.round(grandTotal).toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Notes for Sales Mode */}
        {!isFactoryMode && (
          <div className="mt-8 text-xs text-muted-foreground print:text-gray-600 space-y-2 border-t pt-4">
            <p className="font-semibold text-foreground print:text-black">
              {salesViewMode === 'presupuesto' ? 'Términos y Condiciones:' : 'Notas de la Orden:'}
            </p>
            {salesViewMode === 'presupuesto' ? (
              <ul className="list-disc pl-4 space-y-1">
                <li>Este presupuesto es una estimación sujeta a variaciones según medidas finales en obra.</li>
                <li>Los precios expresados en este presupuesto ya incluyen el Impuesto al Valor Agregado (IVA).</li>
                <li>Validez del presupuesto: 15 días corridos.</li>
                <li>No incluye transporte ni costos de instalación a menos que se especifique lo contrario.</li>
              </ul>
            ) : (
              <ul className="list-disc pl-4 space-y-1">
                <li>Los costos detallados corresponden al precio de producción con el {factoryMarkupPercent}% de ganancia de fábrica (armado, colocación y flete incluidos).</li>
                <li>El importe total indicado representa el desembolso a transferir al taller/fábrica para la ejecución del lote.</li>
              </ul>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
