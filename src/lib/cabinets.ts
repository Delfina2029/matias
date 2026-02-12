import type { Cabinet } from './types';
import { Box, Archive, Container, Pentagon } from 'lucide-react';

const MELAMINE_THICKNESS = 18;
const MELAMINE_MATERIAL = 'Melamina 18mm';
const BACK_PANEL_MATERIAL = 'MDF 3mm';

export const cabinetData: Cabinet[] = [
  {
    id: 'base-600',
    name: 'Gabinete Base 600mm',
    type: 'base',
    icon: Box,
    width: 600,
    height: 720,
    depth: 580,
    pieces: [
      { name: 'Lateral', width: 562, height: 720, quantity: 2, material: MELAMINE_MATERIAL },
      { name: 'Base', width: 564, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Amarre Superior (Frontal)', width: 564, height: 100, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Amarre Superior (Trasero)', width: 564, height: 100, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Panel Trasero', width: 582, height: 702, quantity: 1, material: BACK_PANEL_MATERIAL },
      { name: 'Puerta', width: 596, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Estante', width: 564, height: 540, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'base-450',
    name: 'Gabinete Base 450mm',
    type: 'base',
    icon: Box,
    width: 450,
    height: 720,
    depth: 580,
    pieces: [
      { name: 'Lateral', width: 562, height: 720, quantity: 2, material: MELAMINE_MATERIAL },
      { name: 'Base', width: 414, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Amarre Superior (Frontal)', width: 414, height: 100, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Amarre Superior (Trasero)', width: 414, height: 100, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Panel Trasero', width: 432, height: 702, quantity: 1, material: BACK_PANEL_MATERIAL },
      { name: 'Puerta', width: 446, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Estante', width: 414, height: 540, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'base-corner-900',
    name: 'Gabinete Esquinero 770mm',
    type: 'base',
    icon: Pentagon,
    width: 770,
    height: 800,
    depth: 770,
    pieces: [
      // These pieces are primarily for component generation.
      // The actual cutting list is generated in cutting-logic.ts
      { name: 'Puerta Esquinero A', width: 170, height: 796, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Puerta Esquinero B', width: 170, height: 796, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'wall-600',
    name: 'Gabinete de Pared 600mm',
    type: 'wall',
    icon: Archive,
    width: 600,
    height: 600,
    depth: 320,
    pieces: [
      { name: 'Lateral', width: 302, height: 600, quantity: 2, material: MELAMINE_MATERIAL },
      { name: 'Tapa', width: 564, height: 302, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Base', width: 564, height: 302, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Panel Trasero', width: 582, height: 582, quantity: 1, material: BACK_PANEL_MATERIAL },
      { name: 'Puerta', width: 596, height: 596, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Estante', width: 564, height: 280, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'tall-600',
    name: 'Gabinete Alto 600mm',
    type: 'tall',
    icon: Container,
    width: 600,
    height: 2000,
    depth: 580,
    pieces: [
      { name: 'Lateral', width: 562, height: 2000, quantity: 2, material: MELAMINE_MATERIAL },
      { name: 'Tapa', width: 564, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Base', width: 564, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Estante Fijo', width: 564, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Panel Trasero', width: 582, height: 1982, quantity: 1, material: BACK_PANEL_MATERIAL },
      { name: 'Puerta Superior', width: 596, height: 1246, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Puerta Inferior', width: 596, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Estante', width: 564, height: 540, quantity: 3, material: MELAMINE_MATERIAL },
    ],
  },
];
