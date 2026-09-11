'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ComponentSchema = z.object({
  type: z.enum(['drawer', 'door', 'opening', 'shelf', 'hanging-rail', 'vertical-divider']),
  height: z.number().describe('La altura del componente en mm (ej. 700 para puerta).'),
  numDoors: z.number().optional().describe('Para puertas, 1 o 2 (lado a lado).'),
});

const SketchToCabinetOutputSchema = z.object({
  cabinetId: z.string().describe('Identificador base del gabinete (ej. "base-1door", "base-drawers", "wall-1door", "tall-pantry"). Por defecto "base-custom" si no se encuentra.'),
  type: z.enum(['base', 'wall', 'tall', 'placar']),
  width: z.number().describe('Ancho total del gabinete en mm.'),
  height: z.number().describe('Altura total del gabinete en mm.'),
  depth: z.number().describe('Profundidad total del gabinete en mm.'),
  components: z.array(ComponentSchema).describe('Componentes del gabinete interpretados desde el boceto.'),
});

export type SketchToCabinetOutput = z.infer<typeof SketchToCabinetOutputSchema>;

export async function processSketch(base64Image: string): Promise<SketchToCabinetOutput> {
  return sketchToCabinetFlow(base64Image);
}

const sketchToCabinetFlow = ai.defineFlow(
  {
    name: 'sketchToCabinetFlow',
    inputSchema: z.string(),
    outputSchema: SketchToCabinetOutputSchema,
  },
  async (base64Image) => {
    const prompt = `
Actúa como un diseñador experto en fabricación de muebles (gabinetes/placares).
Recibirás un dibujo o boceto a mano alzada de un módulo de cocina o placar con dimensiones anotadas en milímetros (mm).
Tu objetivo es analizar la imagen y extraer:
- Las dimensiones totales del mueble (ancho, alto, profundidad).
- El tipo de mueble: base, wall, tall, placar.
- Los componentes internos: cajones (drawers), puertas (doors), estantes (shelves), etc. y su altura aproximada.
- Un \`cabinetId\` base aproximado de acuerdo a los gabinetes comunes (ej. "base-1door", "base-drawers", "wall-1door").

Devuelve los datos estructurados en formato JSON.
Si no puedes leer con seguridad alguna dimensión, estima valores estándar (ej. 600mm ancho, 720mm o 820mm alto para base, 580mm prof para base).
`;
    
    const { output } = await ai.generate({
      model: 'googleai/gemini-3.5-flash',
      prompt: [
        { text: prompt },
        { media: { url: base64Image } }
      ],
      output: { schema: SketchToCabinetOutputSchema }
    });

    if (!output) {
      throw new Error('La IA no pudo procesar la imagen.');
    }

    return output;
  }
);
