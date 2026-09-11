'use server';

/**
 * @fileOverview Un agente de IA para generar representaciones fotorrealistas de diseños de cocinas.
 *
 * - renderKitchen - Una función que maneja el proceso de renderizado.
 * - RenderKitchenInput - El tipo de entrada para la función renderKitchen.
 * - RenderKitchenOutput - El tipo de retorno para la función renderKitchen.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CabinetSchema = z.object({
  cabinetId: z.string().describe('El identificador del tipo de gabinete, ej: "base-600".'),
  type: z.string().describe('El tipo de gabinete, ej: "base", "wall", "tall".'),
  width: z.number().describe('El ancho del gabinete en mm.'),
  height: z.number().describe('La altura del gabinete en mm.'),
});

const AppearanceSchema = z.object({
  frontColor: z.string().describe('El color hexadecimal para los frentes de los gabinetes.'),
  carcassColor: z.string().describe('El color hexadecimal para el cuerpo de los gabinetes.'),
  countertopColor: z.string().describe('El color hexadecimal para la encimera.'),
});

const RenderKitchenInputSchema = z.object({
  placedCabinets: z.array(CabinetSchema).describe('Una lista de los gabinetes en la escena.'),
  appearance: AppearanceSchema.describe('La configuración de apariencia para la cocina.'),
});

export type RenderKitchenInput = z.infer<typeof RenderKitchenInputSchema>;

const RenderKitchenOutputSchema = z.object({
  imageUrl: z.string().describe("La URL de datos de la imagen generada en formato Base64. Formato: 'data:image/...;base64,...'"),
});

export type RenderKitchenOutput = z.infer<typeof RenderKitchenOutputSchema>;

export async function renderKitchen(input: RenderKitchenInput): Promise<RenderKitchenOutput> {
  return renderKitchenFlow(input);
}

const renderKitchenFlow = ai.defineFlow(
  {
    name: 'renderKitchenFlow',
    inputSchema: RenderKitchenInputSchema,
    outputSchema: RenderKitchenOutputSchema,
  },
  async (input) => {
    const { placedCabinets, appearance } = input;

    let cabinetDescriptions = 'No hay gabinetes en la escena.';
    if (placedCabinets.length > 0) {
      cabinetDescriptions = placedCabinets.map(cab => `- Un gabinete de tipo '${cab.type}' llamado '${cab.cabinetId}' de ${cab.width}mm de ancho y ${cab.height}mm de alto.`).join('\n');
    }

    const prompt = `
Genera una fotografía fotorrealista, a nivel de los ojos y en gran angular, de una cocina moderna y minimalista.

La cocina presenta los siguientes elementos contra una pared de hormigón gris claro y un suelo de madera clara pulida. La iluminación debe ser brillante y natural, procedente de una gran ventana fuera de plano.

**Apariencia:**
- Color de los frentes de los gabinetes: ${appearance.frontColor}
- Color del cuerpo de los gabinetes: ${appearance.carcassColor}
- Color de la encimera: ${appearance.countertopColor}

**Gabinetes (dispuestos de izquierda a derecha):**
${cabinetDescriptions}

La escena debe estar estilizada como una fotografía de arquitectura de alta gama. Incluye algunos accesorios de cocina sutiles para dar realismo, como una planta en una maceta o unos cuantos cuencos de cerámica en la encimera, pero mantenla limpia y despejada. No muestres a ninguna persona.
`;

    const { media } = await ai.generate({
      model: 'googleai/imagen-3.0-generate-002',
      prompt: prompt,
    });

    if (!media || !media.url) {
      throw new Error('La generación de la imagen falló o no devolvió una URL.');
    }

    return { imageUrl: media.url };
  }
);
