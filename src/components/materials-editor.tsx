'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { MaterialPrices } from '@/lib/types';

type MaterialsEditorProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prices: MaterialPrices;
  onSave: (newPrices: MaterialPrices) => void;
};

export function MaterialsEditor({ isOpen, onOpenChange, prices, onSave }: MaterialsEditorProps) {
  const [localPrices, setLocalPrices] = useState<Record<keyof MaterialPrices, string>>(
    () => Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, String(v)])) as Record<keyof MaterialPrices, string>
  );

  useEffect(() => {
    setLocalPrices(Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, String(v)])) as Record<keyof MaterialPrices, string>);
  }, [prices]);

  const handleChange = (name: keyof MaterialPrices, value: string) => {
    setLocalPrices(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updatedPrices = Object.fromEntries(
        Object.entries(localPrices).map(([k, v]) => [k, parseFloat(v) || 0])
    ) as unknown as MaterialPrices;
    onSave(updatedPrices);
    onOpenChange(false);
  };

  const PriceRow = ({ 
    label, 
    id, 
    details, 
    unit 
  }: { 
    label: string; 
    id: keyof MaterialPrices; 
    details?: string;
    unit?: string;
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{label}</span>
            {details && <span className="text-xs text-muted-foreground italic">- {details}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-32 group">
          <span className="absolute left-3 top-2 text-muted-foreground text-xs">$</span>
          <Input
            type="number"
            className="pl-6 h-8 text-sm"
            value={localPrices[id] ?? ''}
            onChange={(e) => handleChange(id, e.target.value)}
          />
        </div>
        {unit && <span className="text-xs text-muted-foreground w-20">{unit}</span>}
      </div>
    </div>
  );

  const BoardRow = ({ 
    label, 
    prefix,
    idPrice,
    idW,
    idH
  }: { 
    label: string, 
    prefix: string,
    idPrice: keyof MaterialPrices,
    idW: keyof MaterialPrices,
    idH: keyof MaterialPrices
  }) => (
    <div className="flex flex-col gap-3 py-4 border-b">
        <div className="flex items-center justify-between">
            <span className="font-bold text-sm uppercase">{label}</span>
            <div className="relative w-32 group">
                <span className="absolute left-3 top-2 text-muted-foreground text-xs">$</span>
                <Input
                    type="number"
                    className="pl-6 h-8 text-sm font-bold border-primary/20 bg-primary/5"
                    value={localPrices[idPrice] ?? ''}
                    onChange={(e) => handleChange(idPrice, e.target.value)}
                />
            </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            <span>Dimensiones:</span>
            <div className="flex items-center gap-1">
                <Input
                    type="number"
                    className="w-16 h-7 text-[10px] p-1"
                    value={localPrices[idW] ?? ''}
                    onChange={(e) => handleChange(idW, e.target.value)}
                />
                <span>x</span>
                <Input
                    type="number"
                    className="w-16 h-7 text-[10px] p-1"
                    value={localPrices[idH] ?? ''}
                    onChange={(e) => handleChange(idH, e.target.value)}
                />
                <span>mm</span>
            </div>
            <span className="ml-auto italic">
                {((Number(localPrices[idW] || 0) * Number(localPrices[idH] || 0)) / 1000000).toFixed(3)} m² por placa
            </span>
        </div>
    </div>
  );



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Administrar Precios de Materiales</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-4 -mr-4 min-h-[300px]">
          <div className="space-y-2 py-4">
            <div className="mb-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Placas y Servicios</h4>
                <div className="space-y-1">
                    {BoardRow({
                        label: "Melamina 18mm", 
                        prefix: "melamina", 
                        idPrice: "melaminaPlaca", 
                        idW: "melaminaWidth", 
                        idH: "melaminaHeight"
                    })}
                    {PriceRow({ 
                        label: "Corte Melamina", 
                        id: "corteMelamina", 
                        details: "x corte", 
                        unit: "(metro lineal)" 
                    })}
                    {PriceRow({ 
                        label: "Cantos Pegados Acrílico", 
                        id: "cantosPegados", 
                        details: "Pegado a máquina", 
                        unit: "(metro lineal)" 
                    })}
                    {PriceRow({ 
                        label: "Canto Preencolado", 
                        id: "cantoPreencolado", 
                        details: "Para pedido", 
                        unit: "(metro lineal)" 
                    })}
                    {BoardRow({ 
                        label: "MDF 3mm (Fondo)", 
                        prefix: "mdf", 
                        idPrice: "mdf3mmPlaca", 
                        idW: "mdfWidth", 
                        idH: "mdfHeight" 
                    })}
                </div>
            </div>

            <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Herrajes y Accesorios</h4>
                <div className="divide-y border-t border-b">
                    {PriceRow({ label: "Bisagra Cierre Suave Codo 0", id: "bisagraCierreSuave0", unit: "(unidad)" })}
                    {PriceRow({ label: "Bisagra Cierre Suave Codo 9", id: "bisagraCierreSuave9", unit: "(unidad)" })}
                    {PriceRow({ label: "Bisagra Cierre Suave Codo 15", id: "bisagraCierreSuave15", unit: "(unidad)" })}
                    {PriceRow({ label: "Corredera Telescópica 300mm", id: "correderaTelescopica300", unit: "(par)" })}
                    {PriceRow({ label: "Corredera Telescópica 350mm", id: "correderaTelescopica350", unit: "(par)" })}
                    {PriceRow({ label: "Corredera Telescópica 400mm", id: "correderaTelescopica400", unit: "(par)" })}
                    {PriceRow({ label: "Corredera Telescópica 450mm", id: "correderaTelescopica450", unit: "(par)" })}
                    {PriceRow({ label: "Corredera Telescópica 500mm", id: "correderaTelescopica500", unit: "(par)" })}
                    {PriceRow({ label: "Perfil J", id: "perfilJ", unit: "(ml)" })}
                    {PriceRow({ label: "Pata Cuadrada 10cm", id: "pataCuadrada10cm", unit: "(unidad)" })}
                    {PriceRow({ label: "Tapa Tornillo (Melamina)", id: "tapaTornillo", unit: "(unidad)" })}
                    {PriceRow({ label: "Pistón a Gas", id: "pistonGas", unit: "(unidad)" })}
                    {PriceRow({ label: "Soportes Estante", id: "soporteEstante", unit: "(unidad)" })}
                    {PriceRow({ label: "Barral para Placar", id: "barralPlacar", unit: "(metro lineal)" })}
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
