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
import { LayoutGrid } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VisualOptimizer } from './visual-optimizer';
import type { Piece } from '@/lib/types';
import { Switch } from './ui/switch';

const formSchema = z.object({
  boardDimensions: z.string().min(3, 'Las dimensiones del tablero son requeridas.'),
  materialType: z.string().min(3, 'El tipo de material es requerido.'),
  respectGrain: z.boolean().default(true),
});

type OptimizerFormProps = {
  pieces: Piece[];
  hasCuts: boolean;
};

export function OptimizerForm({ pieces, hasCuts }: OptimizerFormProps) {
  const [showOptimizer, setShowOptimizer] = useState(false);

  const availableMaterials = useMemo(() => {
    const materials = new Set(pieces.map(p => p.material).filter(m => m !== 'Hardware'));
    return Array.from(materials);
  }, [pieces]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      boardDimensions: '2750x1830',
      materialType: availableMaterials[0] || 'Melamina 18mm',
      respectGrain: true,
    },
  });

  const { boardDimensions, materialType, respectGrain } = form.watch();
  const [width, height] = boardDimensions.split('x').map(Number);
  
  const piecesForMaterial = useMemo(() => {
    return pieces.filter(p => p.material === materialType);
  }, [pieces, materialType]);

  function onSubmit() {
    setShowOptimizer(true);
  }

  useEffect(() => {
    setShowOptimizer(false);
  }, [boardDimensions, materialType, respectGrain]);

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
           <FormField
            control={form.control}
            name="respectGrain"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                <div className="space-y-0.5">
                  <FormLabel>Respetar Veta</FormLabel>
                  <FormDescription>
                    Impide la rotación de piezas para mantener la dirección de la veta.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
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
      
      {showOptimizer && hasCuts && piecesForMaterial.length > 0 && (
        <VisualOptimizer pieces={piecesForMaterial} boardWidth={width} boardHeight={height} allowRotation={!respectGrain} />
      )}
    </div>
  );
}
