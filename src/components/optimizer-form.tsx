'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { LayoutGrid, RotateCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VisualOptimizer } from './visual-optimizer';
import type { Piece } from '@/lib/types';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

const formSchema = z.object({
  boardDimensions: z.string().min(3, 'Las dimensiones del tablero son requeridas.'),
  materialType: z.string().min(3, 'El tipo de material es requerido.'),
});

type OptimizerFormProps = {
  pieces: Piece[];
  hasCuts: boolean;
  grainSettings: Record<string, boolean>;
};

export function OptimizerForm({ pieces, hasCuts, grainSettings }: OptimizerFormProps) {
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [isBoardRotated, setIsBoardRotated] = useState(false);

  const availableMaterials = useMemo(() => {
    const materials = new Set(pieces.map(p => p.material).filter(m => m !== 'Hardware'));
    return Array.from(materials);
  }, [pieces]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      boardDimensions: '2750x1830',
      materialType: availableMaterials[0] || 'Melamina 18mm',
    },
  });

  const { boardDimensions, materialType } = form.watch();

  const [baseWidth, baseHeight] = useMemo(() => boardDimensions.split('x').map(Number), [boardDimensions]);
  const finalBoardWidth = isBoardRotated ? baseHeight : baseWidth;
  const finalBoardHeight = isBoardRotated ? baseWidth : baseHeight;

  const piecesForMaterial = useMemo(() => {
    return pieces.filter(p => p.material === materialType);
  }, [pieces, materialType]);

  const piecesForOptimizer = useMemo(() => {
    return piecesForMaterial.map(p => {
      const key = `${p.name}|${p.width}|${p.height}|${p.material}`;
      const respectGrain = grainSettings?.[key] ?? true;
      return { ...p, allowRotation: !respectGrain };
    });
  }, [piecesForMaterial, grainSettings]);


  function onSubmit() {
    setShowOptimizer(true);
  }

  useEffect(() => {
    // Reset optimizer view if settings change
    setShowOptimizer(false);
  }, [boardDimensions, materialType, grainSettings, isBoardRotated]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="materialType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material a Optimizar</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableMaterials.map(mat => (
                        <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
                <FormField
                    control={form.control}
                    name="boardDimensions"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Dimensiones del Tablero (mm)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecciona una dimensión" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="2750x1830">2750 x 1830</SelectItem>
                            <SelectItem value="2440x1220">2440 x 1220</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div className="flex items-center space-x-2 pb-2">
                    <Switch
                        id="rotate-board"
                        checked={isBoardRotated}
                        onCheckedChange={setIsBoardRotated}
                    />
                    <Label htmlFor="rotate-board" className="flex items-center gap-1 text-sm cursor-pointer">
                        <RotateCw className="w-3.5 h-3.5"/>
                        Girar
                    </Label>
                </div>
           </div>
          <Button type="submit" disabled={!hasCuts || piecesForMaterial.length === 0} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Generar Diagrama de Corte
          </Button>
          {piecesForMaterial.length === 0 && hasCuts && (
             <p className="text-sm text-center text-muted-foreground pt-2">No hay piezas de {materialType} para optimizar.</p>
          )}
          {!hasCuts && <p className="text-sm text-center text-muted-foreground pt-2">Añade gabinetes al diseño para generar el diagrama.</p>}
        </form>
      </Form>
      
      {showOptimizer && hasCuts && piecesForOptimizer.length > 0 && (
        <VisualOptimizer pieces={piecesForOptimizer} boardWidth={finalBoardWidth} boardHeight={finalBoardHeight} />
      )}
    </div>
  );
}
