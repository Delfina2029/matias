import type { Cabinet } from './types';
import { Box, Archive, Container } from 'lucide-react';

const MELAMINE_THICKNESS = 18;
const MELAMINE_MATERIAL = '18mm Melamine';
const BACK_PANEL_MATERIAL = '3mm MDF';

export const cabinetData: Cabinet[] = [
  {
    id: 'base-600',
    name: 'Base Cabinet 600mm',
    type: 'base',
    icon: Box,
    width: 600,
    height: 720,
    depth: 580,
    pieces: [
      { name: 'Side', width: 562, height: 720, quantity: 2, material: MELAMINE_MATERIAL },
      { name: 'Bottom', width: 564, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Top Stretcher (Front)', width: 564, height: 100, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Top Stretcher (Back)', width: 564, height: 100, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Back Panel', width: 582, height: 702, quantity: 1, material: BACK_PANEL_MATERIAL },
      { name: 'Door', width: 596, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Shelf', width: 564, height: 540, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'base-450',
    name: 'Base Cabinet 450mm',
    type: 'base',
    icon: Box,
    width: 450,
    height: 720,
    depth: 580,
    pieces: [
      { name: 'Side', width: 562, height: 720, quantity: 2, material: MELAMINE_MATERIAL },
      { name: 'Bottom', width: 414, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Top Stretcher (Front)', width: 414, height: 100, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Top Stretcher (Back)', width: 414, height: 100, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Back Panel', width: 432, height: 702, quantity: 1, material: BACK_PANEL_MATERIAL },
      { name: 'Door', width: 446, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Shelf', width: 414, height: 540, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'wall-600',
    name: 'Wall Cabinet 600mm',
    type: 'wall',
    icon: Archive,
    width: 600,
    height: 600,
    depth: 320,
    pieces: [
      { name: 'Side', width: 302, height: 600, quantity: 2, material: MELAMINE_MATERIAL },
      { name: 'Top', width: 564, height: 302, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Bottom', width: 564, height: 302, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Back Panel', width: 582, height: 582, quantity: 1, material: BACK_PANEL_MATERIAL },
      { name: 'Door', width: 596, height: 596, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Shelf', width: 564, height: 280, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'tall-600',
    name: 'Tall Cabinet 600mm',
    type: 'tall',
    icon: Container,
    width: 600,
    height: 2000,
    depth: 580,
    pieces: [
      { name: 'Side', width: 562, height: 2000, quantity: 2, material: MELAMINE_MATERIAL },
      { name: 'Top', width: 564, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Bottom', width: 564, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Fixed Shelf', width: 564, height: 562, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Back Panel', width: 582, height: 1982, quantity: 1, material: BACK_PANEL_MATERIAL },
      { name: 'Upper Door', width: 596, height: 1246, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Lower Door', width: 596, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Shelf', width: 564, height: 540, quantity: 3, material: MELAMINE_MATERIAL },
    ],
  },
];
