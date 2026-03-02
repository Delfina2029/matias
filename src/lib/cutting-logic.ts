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
    const bodyDepth1 = depth;
    const bodyDepth2 = depth2 || depth;
    
    // Using the logic: door width = wallSpace - opposite body depth
    const door1Width = width - bodyDepth2 - 20; // 20mm tolerance/gap
    const door2Width = width - bodyDepth1 - 20;

    // Doors for the corner opening.
    cornerPieces.push({ name: 'Puerta Esquinero 1', width: door1Width, height: height - 4, quantity: 1, material: MELAMINE_MATERIAL });
    cornerPieces.push({ name: 'Puerta Esquinero 2', width: door2Width, height: height - 4, quantity: 1, material: MELAMINE_MATERIAL });

    // Carcass Pieces
    const floorBlankWidth = width - MELAMINE_THICKNESS;
    
    cornerPieces.push({ name: 'Lateral 1', width: bodyDepth1, height: height, quantity: 1, material: MELAMINE_MATERIAL });
    cornerPieces.push({ name: 'Lateral 2', width: bodyDepth2, height: height, quantity: 1, material: MELAMINE_MATERIAL });
    cornerPieces.push({ name: 'Piso (Cortar en L)', width: width - MELAMINE_THICKNESS, height: depth, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Se corta de esta pieza' });
    cornerPieces.push({ name: 'Piso (Cortar en L)', width: depth2 || depth, height: width - depth, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Se corta de esta pieza' });

    cornerPieces.push({ name: 'Estante (Cortar en L)', width: width - MELAMINE_THICKNESS - 25, height: depth - 25, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Se corta de esta pieza' });
    cornerPieces.push({ name: 'Estante (Cortar en L)', width: (depth2 || depth) - 25, height: width - depth - 25, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Se corta de esta pieza' });
    
    cornerPieces.push({ name: 'Refuerzo', width: 100, height: width - bodyDepth1 - bodyDepth2, quantity: 2, material: MELAMINE_MATERIAL });
    cornerPieces.push({ name: 'Panel Trasero', width: width, height: height - MELAMINE_THICKNESS, quantity: 1, material: BACK_PANEL_MATERIAL });
    cornerPieces.push({ name: 'Panel Trasero', width: width - bodyDepth1, height: height - MELAMINE_THICKNESS, quantity: 1, material: BACK_PANEL_MATERIAL });
    
    return cornerPieces;
  }
  
  if (cabinet.cabinetId.includes('microwave')) {
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
        let doorName: string;
        if (doorComp.handle === 'j-profile') { 
            doorHeight -= 26.8; 
            doorName = 'Puerta (Perfil J)';
        } else {
            doorHeight -= 30;
            doorName = 'Puerta (Tirar)';
        }

        if (doorComp.hinge === 'top') {
            doorName = `${doorName} (Apertura Arriba)`;
        }
        
        pieces.push({ name: doorName, width: width - 4, height: doorHeight, quantity: 1, material: MELAMINE_MATERIAL });
    }
    
    return pieces;
  }

  if (cabinet.cabinetId.startsWith('vanity')) {
    const { width, height, depth, components } = cabinet;
    const pieces: Piece[] = [];
    const interiorWidth = width - (2 * MELAMINE_THICKNESS);
    
    const isHanging = cabinet.cabinetId.includes('hanging');
    const cabinetBodyHeight = isHanging ? height : height - 100; // Account for 100mm legs or not

    // Carcass
    pieces.push({ name: 'Lateral', width: depth, height: cabinetBodyHeight, quantity: 2, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Piso', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });

    if (isHanging) {
      pieces.push({ name: 'Tapa', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    } else {
       pieces.push({ name: 'Refuerzo', width: interiorWidth, height: 100, quantity: 2, material: MELAMINE_MATERIAL });
    }


    // Add reinforcements between vertically stacked components
    if (components.length > 1) {
        const reinforcementCount = components.length - 1;
        if (reinforcementCount > 0) {
            pieces.push({ 
                name: 'Refuerzo', 
                width: interiorWidth, 
                height: 100, 
                quantity: reinforcementCount, 
                material: MELAMINE_MATERIAL,
                notes: 'Separación entre componentes'
            });
        }
    }

    if (!isHanging) {
        // Legs - as a hardware note
        pieces.push({ name: 'Patas de Mueble', width: 0, height: 100, quantity: 4, material: 'Hardware', notes: 'Altura de pata recomendada 100mm' });
    }
    
    // Components
    const topDrawerIndex = components.length > 0 ? components.findIndex((c, i, arr) => c.type === 'drawer' && i === arr.length - 1) : -1;

    components.forEach((component, index) => {
        if (component.type === 'door') {
            const doorWidth = (width - 6) / 2; // Two doors with 2mm gap between and on sides
            let doorHeight = component.height - 4;
            let doorName;
            if (component.handle === 'j-profile') {
                doorHeight -= 26.8;
                doorName = 'Puerta de Vanitory (Perfil J)';
            } else {
                doorHeight -= 30;
                doorName = 'Puerta de Vanitory (Tirar)';
            }
            pieces.push({ name: doorName, width: doorWidth, height: doorHeight, quantity: 2, material: MELAMINE_MATERIAL });
        } else if (component.type === 'drawer') {
            const drawerBoxHeight = 100;
            const drawerBoxDepth = 350; // Standardized depth for ALL vanitory drawers
            const isTopDrawer = index === topDrawerIndex;

            // --- Front piece ---
            let frontHeight = component.height - 4;
            let frontName;
            if (component.handle === 'j-profile') {
                frontHeight -= 26.8;
                frontName = 'Frente de Cajón (Perfil J)';
            } else {
                frontHeight -= 30;
                frontName = 'Frente de Cajón (Tirar)';
            }
            pieces.push({ name: frontName, width: width - 4, height: frontHeight, quantity: 1, material: MELAMINE_MATERIAL });

            // Check if it's the top drawer, which needs space for plumbing
            if (isTopDrawer) {
                // U-shaped drawer box for plumbing
                const drawerBoxWidth = interiorWidth - 24;
                const plumbingGap = 160;
                const sideBoxInnerWidth = (drawerBoxWidth - plumbingGap) / 2;

                pieces.push({ name: 'Lateral de Cajón', width: drawerBoxDepth, height: drawerBoxHeight, quantity: 4, material: MELAMINE_MATERIAL });
                pieces.push({ name: 'Frente Interno Cajón', width: drawerBoxWidth, height: drawerBoxHeight, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Pieza de refuerzo detrás del frente principal' });
                pieces.push({ name: 'Trasero de Cajón (Lado)', width: sideBoxInnerWidth, height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
                pieces.push({ name: 'Trasero de Cajón (Centro)', width: plumbingGap, height: drawerBoxHeight, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Pieza central que une las dos cajas' });
                pieces.push({ name: 'Fondo de Cajón', width: sideBoxInnerWidth, height: drawerBoxDepth - MELAMINE_THICKNESS, quantity: 2, material: BACK_PANEL_MATERIAL });

            } else {
                // Standard full-depth drawer for lower positions
                const drawerBoxWidth = interiorWidth - 26;

                pieces.push({ name: 'Lateral de Cajón', width: drawerBoxDepth, height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
                pieces.push({ name: 'Frente/Trasero de Cajón', width: drawerBoxWidth - (2 * MELAMINE_THICKNESS), height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
                pieces.push({ name: 'Fondo de Cajón', width: drawerBoxWidth - (2 * MELAMINE_THICKNESS), height: drawerBoxDepth, quantity: 1, material: BACK_PANEL_MATERIAL });
            }
        }
    });

    return pieces;
  }

  // Placar/Closet Module Logic
  if (cabinet.type === 'placar') {
    const { width, height, depth, components } = cabinet;
    const pieces: Piece[] = [];
    const interiorWidth = width - (2 * MELAMINE_THICKNESS);

    // Carcass
    pieces.push({ name: 'Lateral Placar', width: depth, height: height, quantity: 2, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Piso Placar', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Tapa Placar', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Panel Trasero Placar', width: width - 5, height: height - 5, quantity: 1, material: BACK_PANEL_MATERIAL });
    
    // Interior Components
    components.forEach(component => {
      if (component.type === 'shelf') {
        pieces.push({
          name: 'Estante Placar',
          width: interiorWidth - 2, // A little tolerance
          height: depth - 20, // Not full depth to allow for back panel and air flow
          quantity: 1,
          material: MELAMINE_MATERIAL,
        });
      }
    });

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
    pieces.push({ name: 'Refuerzo', width: interiorWidth, height: 100, quantity: 2, material: MELAMINE_MATERIAL });

    // Add reinforcements between vertically stacked components
    const treatAsHorizontalDoors = components.length > 1 && components.every(c => c.type === 'door');
    if (!treatAsHorizontalDoors && components.length > 1) {
        const reinforcementCount = components.length - 1;
        if (reinforcementCount > 0) {
            pieces.push({ 
                name: 'Refuerzo', 
                width: interiorWidth, 
                height: 100, 
                quantity: reinforcementCount, 
                material: MELAMINE_MATERIAL,
                notes: 'Separación entre componentes'
            });
        }
    }
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
      let doorName;
      
      if (component.handle === 'j-profile') {
        doorHeight -= 26.8;
        doorName = 'Puerta (Perfil J)';
      } else {
        doorHeight -= 30;
        doorName = 'Puerta (Tirar)';
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
      let frontName;
      
      if (component.handle === 'j-profile') {
        frontHeight -= 26.8;
        frontName = 'Frente de Cajón (Perfil J)';
      } else {
        frontHeight -= 30;
        frontName = 'Frente de Cajón (Tirar)';
      }
      
      pieces.push({
        name: frontName,
        width: width - 4,
        height: frontHeight,
        quantity: 1,
        material: MELAMINE_MATERIAL
      });

      const drawerBoxHeight = 100;
      const drawerBoxWidth = interiorWidth - 26;
      const drawerBoxDepth = depth - 30;

      pieces.push({ name: 'Lateral de Cajón', width: drawerBoxDepth, height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
      pieces.push({ name: 'Frente/Trasero de Cajón', width: drawerBoxWidth - (2*MELAMINE_THICKNESS), height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
      pieces.push({ name: 'Fondo de Cajón', width: drawerBoxWidth - (2*MELAMINE_THICKNESS), height: drawerBoxDepth, quantity: 1, material: BACK_PANEL_MATERIAL });
    }
  });

  return pieces;
}
