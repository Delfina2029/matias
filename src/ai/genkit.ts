import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY as string,
      apiVersion: 'v1beta'
    }),
  ],
  model: 'googleai/gemini-3.5-flash',
});
