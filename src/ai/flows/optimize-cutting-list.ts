'use server';

/**
 * @fileOverview An AI agent to optimize cutting lists for melamine boards to minimize waste.
 *
 * - optimizeCuttingList - A function that handles the optimization process.
 * - OptimizeCuttingListInput - The input type for the optimizeCuttingList function.
 * - OptimizeCuttingListOutput - The return type for the optimizeCuttingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeCuttingListInputSchema = z.object({
  cuttingList: z
    .string()
    .describe(
      'A list of cuts required for the melamine boards, including dimensions for each piece.'
    ),
  boardDimensions: z
    .string()
    .describe(
      'The dimensions of the melamine boards available (e.g., 2440mm x 1220mm).' 
    ),
  melamineType: z.string().describe('The type of melamine board being used.'),
});

export type OptimizeCuttingListInput = z.infer<
  typeof OptimizeCuttingListInputSchema
>;

const OptimizeCuttingListOutputSchema = z.object({
  optimizedLayout: z
    .string()
    .describe(
      'The optimized layout suggesting how to cut the melamine boards to minimize waste.'
    ),
  wastePercentage: z
    .number()
    .describe(
      'The estimated percentage of waste material based on the optimized layout.'
    ),
  notes: z
    .string()
    .optional()
    .describe(
      'Any additional notes or suggestions for cutting the melamine boards effectively.'
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
  prompt: `You are an expert in optimizing cutting layouts for melamine boards to minimize waste.

  Given the following cutting list and board dimensions, provide an optimized layout suggesting how to cut the melamine boards to minimize waste. Also, estimate the percentage of waste material based on your layout.

  Cutting List:
  {{cuttingList}}

  Board Dimensions:
  {{boardDimensions}}

  Melamine Type:
  {{melamineType}}

  Respond with an optimized layout and estimated waste percentage.
  Include also any notes or suggestions for cutting the melamine boards effectively.
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
