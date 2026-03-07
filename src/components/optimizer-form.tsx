'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  optimizeCuttingList,
  type OptimizeCuttingListOutput,
} from '@/ai/flows/optimize-cutting-list';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  boardDimensions: z.string().min(3, 'Las dimensiones del tablero son requeridas.'),
  melamineType: z.string().min(3, 'El tipo de melamina es requerido.'),
});

type OptimizerFormProps = {
  cuttingListString: string;
  hasCuts: boolean;
};

export function OptimizerForm({ cuttingListString, hasCuts }: OptimizerFormProps) {
  const [result, setResult] = useState<OptimizeCuttingListOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      boardDimensions: '2440mm x 1220mm',
      melamineType: 'Melamina Blanca',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await optimizeCuttingList({
        ...values,
        cuttingList: cuttingListString,
      });
      setResult(output);
      toast({
        title: "¡Optimización Completa!",
        description: "La IA ha generado un plan de corte optimizado.",
      });
    } catch (error) {
      console.error('Optimization failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Optimización',
        description:
          'Algo salió mal al optimizar la lista de corte. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="boardDimensions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimensiones del Tablero</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una dimensión" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="2440mm x 1220mm">2440mm x 1220mm</SelectItem>
                    <SelectItem value="2750mm x 1830mm">2750mm x 1830mm</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="melamineType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Melamina</FormLabel>
                <FormControl>
                  <Input placeholder="ej: Melamina Blanca" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading || !hasCuts} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Optimizar con IA
          </Button>
          {!hasCuts && <p className="text-sm text-center text-muted-foreground pt-2">Añade gabinetes al diseño para habilitar la optimización.</p>}
        </form>
      </Form>
      
      {result && (
        <Card className="mt-6 animate-in fade-in-50">
          <CardHeader>
            <CardTitle>Diseño Optimizado</CardTitle>
            <CardDescription>
              Desperdicio Estimado: <Badge variant="secondary" className="bg-primary/20 text-primary">{result.wastePercentage.toFixed(2)}%</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Plan de Diseño:</h4>
              <p className="whitespace-pre-wrap text-muted-foreground bg-secondary p-3 rounded-md">{result.optimizedLayout}</p>
            </div>
            {result.notes && (
              <>
                <Separator/>
                <div>
                  <h4 className="font-semibold mb-2">Notas:</h4>
                  <p className="whitespace-pre-wrap text-muted-foreground bg-secondary p-3 rounded-md">{result.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
