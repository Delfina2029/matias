import type { Cabinet } from './types';
import { Box, Archive, Container, Pentagon, Microwave } from 'lucide-react';

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
      { name: 'Puerta', width: 596, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
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
      { name: 'Puerta', width: 446, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'base-corner-900',
    name: 'Gabinete Esquinero',
    type: 'base',
    icon: Pentagon,
    width: 770,
    height: 800,
    depth: 600,
    depth2: 300,
    pieces: [],
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
      { name: 'Puerta', width: 596, height: 596, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'wall-microwave-600',
    name: 'Gabinete Porta Microondas',
    type: 'wall',
    icon: Microwave,
    width: 600,
    height: 800,
    depth: 400,
    pieces: [],
    defaultComponents: [
      { type: 'opening', height: 400 },
      { type: 'door', height: 400, hinge: 'top' },
    ]
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
      { name: 'Puerta Superior', width: 596, height: 1246, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Puerta Inferior', width: 596, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
];
