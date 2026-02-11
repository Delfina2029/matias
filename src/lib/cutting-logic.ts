import type { PlacedCabinet, Piece } from './types';

const MELAMINE_THICKNESS = 18;
const MELAMINE_MATERIAL = 'Melamina 18mm';
const BACK_PANEL_MATERIAL = 'MDF 3mm';

/**
 * Generates a list of pieces for a given cabinet based on its dimensions and components.
 * @param cabinet The placed cabinet configuration.
 * @returns An array of pieces for the cutting list.
 */
export function generatePiecesForCabinet(cabinet: PlacedCabinet): Piece[] {
  const { width, height, depth, components, type } = cabinet;
  const pieces: Piece[] = [];

  // --- Cabinet Box ---
  const interiorWidth = width - (2 * MELAMINE_THICKNESS);

  // 1. Sides (Laterales)
  pieces.push({ name: 'Lateral', width: depth, height: height, quantity: 2, material: MELAMINE_MATERIAL });
  
  // 2. Bottom and Top
  if (type === 'base') {
    // Base cabinets have a bottom panel and top stretchers (amarres)
    pieces.push({ name: 'Piso', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Amarre Superior', width: interiorWidth, height: 100, quantity: 2, material: MELAMINE_MATERIAL });
  } else {
    // Wall and Tall cabinets have a bottom and a top panel
    pieces.push({ name: 'Piso', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Tapa', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
  }

  // 3. Back Panel
  // A small tolerance is subtracted for fitting
  pieces.push({ name: 'Panel Trasero', width: width - 5, height: height - 5, quantity: 1, material: BACK_PANEL_MATERIAL });
  
  // 4. Shelves (Estantes) - Add one adjustable shelf by default for now.
  if (components.every(c => c.type === 'door')) {
    if (type !== 'tall') {
        pieces.push({ name: 'Estante', width: interiorWidth - 2, height: depth - 25, quantity: 1, material: MELAMINE_MATERIAL });
    } else {
        pieces.push({ name: 'Estante', width: interiorWidth - 2, height: depth - 25, quantity: 4, material: MELAMINE_MATERIAL });
    }
  }


  // --- Components (Doors & Drawers) ---
  components.forEach(component => {
    if (component.type === 'door') {
      // Single door piece
      pieces.push({
        name: 'Puerta',
        width: width - 4, // 2mm gap on each side
        height: component.height - 4, // 2mm gap top/bottom
        quantity: 1,
        material: MELAMINE_MATERIAL
      });
    } else if (component.type === 'drawer') {
      // A drawer is made of a front and a box
      // 1. Drawer Front (Frente de Cajón)
      const frontHeight = component.height - 4 + (component.handle === 'j-profile' ? 20 : 0);
      const frontName = component.handle === 'j-profile' ? 'Frente de Cajón (Perfil J)' : 'Frente de Cajón';
      
      pieces.push({
        name: frontName,
        width: width - 4,
        height: frontHeight,
        quantity: 1,
        material: MELAMINE_MATERIAL
      });

      // 2. Drawer Box (Cajón Interior)
      const drawerBoxHeight = Math.min(component.height - 40, 200); // Box is shorter than the front
      const drawerBoxWidth = interiorWidth - 26; // Space for slides (13mm each side)
      const drawerBoxDepth = depth - 30; // Shorter than cabinet depth
      
      const drawerSizeLabel = drawerBoxHeight <= 150 ? 'Chico' : 'Grande';

      // Drawer box sides (2)
      pieces.push({ name: `Lateral de Cajón ${drawerSizeLabel}`, width: drawerBoxDepth, height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
      // Drawer box front & back (2)
      pieces.push({ name: `Frente/Trasero de Cajón ${drawerSizeLabel}`, width: drawerBoxWidth - (2*MELAMINE_THICKNESS), height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
      // Drawer box bottom (1)
      pieces.push({ name: `Fondo de Cajón ${drawerSizeLabel}`, width: drawerBoxWidth - (2*MELAMINE_THICKNESS), height: drawerBoxDepth, quantity: 1, material: BACK_PANEL_MATERIAL });
    }
  });

  return pieces;
}
