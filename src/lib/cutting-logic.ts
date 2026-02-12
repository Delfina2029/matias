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
  // Handle special cases like corner cabinets first
  if (cabinet.cabinetId === 'base-corner-900') {
    const cornerPieces: Piece[] = [];
    const { width, height, depth, depth2 } = cabinet; // width is wall space
    const wallSpace = width;
    const bodyDepth1 = depth;
    const bodyDepth2 = depth2 || depth;
    
    // Using the logic: door width = wallSpace - opposite body depth
    const door1Width = wallSpace - bodyDepth2 - 20; // 20mm tolerance/gap
    const door2Width = wallSpace - bodyDepth1 - 20;

    // Doors for the corner opening.
    cornerPieces.push({ name: 'Puerta Esquinero 1', width: door1Width, height: height - 4, quantity: 1, material: MELAMINE_MATERIAL });
    cornerPieces.push({ name: 'Puerta Esquinero 2', width: door2Width, height: height - 4, quantity: 1, material: MELAMINE_MATERIAL });

    // Carcass Pieces
    const floorBlankWidth = wallSpace - MELAMINE_THICKNESS;
    
    cornerPieces.push({ name: 'Lateral 1', width: bodyDepth1, height: height, quantity: 1, material: MELAMINE_MATERIAL });
    cornerPieces.push({ name: 'Lateral 2', width: bodyDepth2, height: height, quantity: 1, material: MELAMINE_MATERIAL });
    cornerPieces.push({ name: 'Piso (Cortar en L)', width: floorBlankWidth, height: floorBlankWidth, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Requiere corte en L' });
    cornerPieces.push({ name: 'Estante (Cortar en L)', width: floorBlankWidth - 25, height: floorBlankWidth - 25, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Requiere corte en L' });
    cornerPieces.push({ name: 'Amarre Superior (x2)', width: 100, height: wallSpace - bodyDepth1 - bodyDepth2, quantity: 2, material: MELAMINE_MATERIAL });
    cornerPieces.push({ name: 'Panel Trasero (x2)', width: wallSpace, height: height - MELAMINE_THICKNESS, quantity: 2, material: BACK_PANEL_MATERIAL });
    
    return cornerPieces;
  } else if (cabinet.cabinetId.includes('microwave')) {
    const pieces: Piece[] = [];
    const { width, height, depth, components } = cabinet;
    const interiorWidth = width - (2 * MELAMINE_THICKNESS);
    
    // Carcass
    pieces.push({ name: 'Lateral', width: depth, height: height, quantity: 2, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Piso', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Tapa', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Panel Trasero', width: width - 5, height: height - 5, quantity: 1, material: BACK_PANEL_MATERIAL });

    const doorComp = components.find(c => c.type === 'door');

    // Add shelf between components
    if (components.length > 1) {
      pieces.push({ name: 'Estante Microondas', width: interiorWidth, height: depth - 20, quantity: 1, material: MELAMINE_MATERIAL });
    }

    if(doorComp) {
        let doorHeight = doorComp.height - 4;
        let doorName = doorComp.handle === 'j-profile' ? 'Puerta (Perfil J)' : 'Puerta';
        if (doorComp.handle === 'j-profile') { doorHeight -= 26.8; }
        if (doorComp.hinge === 'top') {
            doorName = `${doorName} (Apertura Arriba)`;
        }
        
        pieces.push({ name: doorName, width: width - 4, height: doorHeight, quantity: 1, material: MELAMINE_MATERIAL });
    }
    
    return pieces;
  }


  // --- Regular rectangular cabinet logic ---
  const { width, height, depth, components, type } = cabinet;
  const pieces: Piece[] = [];

  const interiorWidth = width - (2 * MELAMINE_THICKNESS);

  // 1. Sides
  pieces.push({ name: 'Lateral', width: depth, height: height, quantity: 2, material: MELAMINE_MATERIAL });
  
  // 2. Bottom and Top
  if (type === 'base') {
    pieces.push({ name: 'Piso', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Amarre Superior', width: interiorWidth, height: 100, quantity: 2, material: MELAMINE_MATERIAL });
  } else {
    pieces.push({ name: 'Piso', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Tapa', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
  }

  // 3. Back Panel
  pieces.push({ name: 'Panel Trasero', width: width - 5, height: height - 5, quantity: 1, material: BACK_PANEL_MATERIAL });
  
  // 4. Shelves
  if (components.every(c => c.type === 'door')) {
    if (type !== 'tall') {
        pieces.push({ name: 'Estante', width: interiorWidth - 2, height: depth - 25, quantity: 1, material: MELAMINE_MATERIAL });
    } else {
        pieces.push({ name: 'Estante', width: interiorWidth - 2, height: depth - 25, quantity: 4, material: MELAMINE_MATERIAL });
    }
  }

  // --- Components (Doors & Drawers) ---
  const treatAsHorizontalDoors = type !== 'tall' && components.length > 1 && components.every(c => c.type === 'door');
  const numHorizontalDoors = treatAsHorizontalDoors ? components.length : 1;
  
  components.forEach(component => {
    if (component.type === 'door') {
      let doorHeight = component.height - 4;
      let doorName = component.handle === 'j-profile' ? 'Puerta (Perfil J)' : 'Puerta';
      
      if (component.handle === 'j-profile') {
        doorHeight -= 26.8;
      }
      if (component.hinge === 'top') {
        doorName = `${doorName} (Apertura Arriba)`;
      }

      const doorWidth = treatAsHorizontalDoors
        ? (width - 2 * numHorizontalDoors - 2) / numHorizontalDoors
        : width - 4;
      
      pieces.push({
        name: doorName,
        width: doorWidth,
        height: doorHeight,
        quantity: 1,
        material: MELAMINE_MATERIAL
      });
    } else if (component.type === 'drawer') {
      let frontHeight = component.height - 4;
      const frontName = component.handle === 'j-profile' ? 'Frente de Cajón (Perfil J)' : 'Frente de Cajón';
      
      if (component.handle === 'j-profile') {
        frontHeight -= 26.8;
      }
      
      pieces.push({
        name: frontName,
        width: width - 4,
        height: frontHeight,
        quantity: 1,
        material: MELAMINE_MATERIAL
      });

      const drawerBoxHeight = Math.min(component.height - 40, 200);
      const drawerBoxWidth = interiorWidth - 26;
      const drawerBoxDepth = depth - 30;
      const drawerSizeLabel = drawerBoxHeight <= 150 ? 'Chico' : 'Grande';

      pieces.push({ name: `Lateral de Cajón ${drawerSizeLabel}`, width: drawerBoxDepth, height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
      pieces.push({ name: `Frente/Trasero de Cajón ${drawerSizeLabel}`, width: drawerBoxWidth - (2*MELAMINE_THICKNESS), height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
      pieces.push({ name: `Fondo de Cajón ${drawerSizeLabel}`, width: drawerBoxWidth - (2*MELAMINE_THICKNESS), height: drawerBoxDepth, quantity: 1, material: BACK_PANEL_MATERIAL });
    }
  });

  return pieces;
}
