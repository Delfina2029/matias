'use server';

/**
 * @fileOverview Un agente de IA para optimizar listas de corte para tableros de melamina para minimizar el desperdicio.
 *
 * - optimizeCuttingList - Una función que maneja el proceso de optimización.
 * - OptimizeCuttingListInput - El tipo de entrada para la función optimizeCuttingList.
 * - OptimizeCuttingListOutput - El tipo de retorno para la función optimizeCuttingList.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeCuttingListInputSchema = z.object({
  cuttingList: z
    .string()
    .describe(
      'Una lista de cortes requeridos para los tableros de melamina, incluyendo las dimensiones para cada pieza.'
    ),
  boardDimensions: z
    .string()
    .describe(
      'Las dimensiones de los tableros de melamina disponibles (ej., 2440mm x 1220mm).' 
    ),
  melamineType: z.string().describe('El tipo de tablero de melamina que se está utilizando.'),
});

export type OptimizeCuttingListInput = z.infer<
  typeof OptimizeCuttingListInputSchema
>;

const OptimizeCuttingListOutputSchema = z.object({
  optimizedLayout: z
    .string()
    .describe(
      'El diseño optimizado que sugiere cómo cortar los tableros de melamina para minimizar el desperdicio.'
    ),
  wastePercentage: z
    .number()
    .describe(
      'El porcentaje estimado de material de desecho basado en el diseño optimizado.'
    ),
  notes: z
    .string()
    .optional()
    .describe(
      'Cualquier nota o sugerencia adicional para cortar los tableros de melamina de manera efectiva.'
    ),
});

export type OptimizeCuttingListOutput = z.infer<
  typeof OptimizeCuttingListOutputSchema
>;

export async function optimizeCuttingList(
  input: OptimizeCuttingListInput
): Promise<OptimizeCuttingListOutput> {
  return optimizeCuttingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeCuttingListPrompt',
  input: {schema: OptimizeCuttingListInputSchema},
  output: {schema: OptimizeCuttingListOutputSchema},
  prompt: `Eres un experto en optimizar diseños de corte para tableros de melamina para minimizar el desperdicio.

  Dada la siguiente lista de cortes y dimensiones del tablero, proporciona un diseño optimizado que sugiera cómo cortar los tableros de melamina para minimizar el desperdicio. Además, estima el porcentaje de material de desecho basado en tu diseño.

  Lista de Cortes:
  {{cuttingList}}

  Dimensiones del Tablero:
  {{boardDimensions}}

  Tipo de Melamina:
  {{melamineType}}

  Responde con un diseño optimizado y el porcentaje de desperdicio estimado.
  Incluye también cualquier nota o sugerencia adicional para cortar los tableros de melamina de manera efectiva.
  `,
});

const optimizeCuttingListFlow = ai.defineFlow(
  {
    name: 'optimizeCuttingListFlow',
    inputSchema: OptimizeCuttingListInputSchema,
    outputSchema: OptimizeCuttingListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
