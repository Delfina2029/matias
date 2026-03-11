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
  if (cabinet.cabinetId === 'base-corner') {
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
  
  if (cabinet.cabinetId === 'wall-microwave') {
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
    const { width, height, depth, components, cabinetId } = cabinet;
    const pieces: Piece[] = [];
    const interiorWidth = width - (2 * MELAMINE_THICKNESS);
    
    const isHanging = cabinet.cabinetId.includes('hanging');
    const cabinetBodyHeight = isHanging ? height : height - 100; // Account for 100mm legs or not

    // Carcass
    pieces.push({ name: 'Lateral', width: depth, height: cabinetBodyHeight, quantity: 2, material: MELAMINE_MATERIAL });
    pieces.push({ name: 'Piso', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });

    // All vanities get top reinforcements for a ceramic sink, not a full top.
    pieces.push({ name: 'Refuerzo', width: interiorWidth, height: 100, quantity: 2, material: MELAMINE_MATERIAL, notes: 'Para frente y fondo' });


    // Add reinforcements between vertically stacked components
    const frontComponents = components.filter(c => c.type === 'drawer' || c.type === 'door');
    
    // Logic for reinforcements between components (simplified)
    const reinforcementCount = frontComponents.length - 1;
    if (reinforcementCount > 0) {
      pieces.push({
        name: 'Refuerzo Intermedio',
        width: interiorWidth,
        height: 100,
        quantity: reinforcementCount,
        material: MELAMINE_MATERIAL,
        notes: 'Separación entre frentes'
      });
    }


    if (!isHanging) {
        // Legs - as a hardware note
        pieces.push({ name: 'Patas de Mueble', width: 0, height: 100, quantity: 4, material: 'Hardware', notes: 'Altura de pata recomendada 100mm' });
    }
    
    // Components
    // Find the index of the highest drawer in the stack.
    let topDrawerIndex = -1;
    for (let i = 0; i < components.length; i++) {
        if (components[i].type === 'drawer') {
            topDrawerIndex = i;
            break;
        }
    }

    components.forEach((component, index) => {
        if (component.type === 'door') {
            const doorWidth = (interiorWidth - 10) / 2;
            let doorHeight = component.height - 4;
            let doorName;
            if (component.handle === 'j-profile') {
                doorHeight -= 26.8;
                doorName = 'Puerta de Vanitory (Perfil J, Interior)';
            } else {
                doorName = 'Puerta de Vanitory (Interior)';
            }
            pieces.push({ name: doorName, width: doorWidth, height: doorHeight, quantity: 2, material: MELAMINE_MATERIAL });
        } else if (component.type === 'drawer') {
            const drawerBoxHeight = 100;
            const isTopDrawer = index === topDrawerIndex; // Check if the current drawer is the highest one.

            // --- Front piece ---
            let frontHeight = component.height - 4;
            let drawerFrontWidth = width - 4;

            // Special case for 'vanity-hanging-1d1o' and 'vanity-hanging-2d' as requested
            if (cabinetId === 'vanity-hanging-1d1o' || cabinetId === 'vanity-hanging-2d') {
                frontHeight = component.height; // No height discount
                drawerFrontWidth = width - 45; // Specific width calculation
            }

            let frontName;
            if (component.handle === 'j-profile') {
                frontHeight -= 26.8;
                frontName = 'Frente de Cajón (Perfil J)';
            } else {
                frontName = 'Frente de Cajón (Tirar)';
            }

            pieces.push({ name: frontName, width: drawerFrontWidth, height: frontHeight, quantity: 1, material: MELAMINE_MATERIAL });

            // Check if it's the top drawer, which needs space for plumbing
            if (isTopDrawer) {
                // U-shaped drawer box for plumbing
                const drawerBoxDepth = 350;
                const drawerBoxWidth = interiorWidth - 30; // slide clearance
                const plumbingGap = 160;
                const sideBoxInnerWidth = (drawerBoxWidth - plumbingGap) / 2;

                pieces.push({ name: 'Lateral de Cajón Vanitory', width: drawerBoxDepth, height: drawerBoxHeight, quantity: 4, material: MELAMINE_MATERIAL });
                pieces.push({ name: 'Frente Interno Cajón Vanitory', width: drawerBoxWidth, height: drawerBoxHeight, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Pieza de refuerzo detrás del frente principal' });
                pieces.push({ name: 'Trasero de Cajón Vanitory (Lado)', width: sideBoxInnerWidth, height: drawerBoxHeight, quantity: 2, material: MELAMINE_MATERIAL });
                pieces.push({ name: 'Trasero de Cajón Vanitory (Centro)', width: plumbingGap, height: drawerBoxHeight, quantity: 1, material: MELAMINE_MATERIAL, notes: 'Pieza central que une las dos cajas' });
                pieces.push({ name: 'Fondo de Cajón Vanitory', width: sideBoxInnerWidth, height: drawerBoxDepth - MELAMINE_THICKNESS, quantity: 2, material: BACK_PANEL_MATERIAL });

            } else {
                // Standard full-depth drawer for lower positions
                const drawerBoxDepth = 350;
                const drawerBoxWidth = interiorWidth - 30;

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
      } else if (component.type === 'hanging-rail') {
        pieces.push({
            name: 'Barral para Placar',
            width: interiorWidth - 10,
            height: 0,
            quantity: 1,
            material: 'Hardware',
            notes: 'Largo del barral'
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
  
  // 2. Bottom and Top/Reinforcements for base cabinets
  if (type === 'base') {
    pieces.push({ name: 'Piso', width: interiorWidth, height: depth, quantity: 1, material: MELAMINE_MATERIAL });
    
    // Always add two top reinforcements (front and back)
    pieces.push({ name: 'Refuerzo Superior', width: interiorWidth, height: 100, quantity: 2, material: MELAMINE_MATERIAL, notes: 'Para frente y fondo' });

    // Add reinforcements between vertically stacked components (drawers or doors)
    const verticallyStackedFronts = components.filter(c => c.type === 'drawer' || c.type === 'door');
    // This logic prevents adding vertical separators for horizontally-placed doors
    const treatAsHorizontalDoors = verticallyStackedFronts.length > 1 && verticallyStackedFronts.every(c => c.type === 'door') && type !== 'tall';
    
    if (!treatAsHorizontalDoors && verticallyStackedFronts.length > 1) {
        const reinforcementCount = verticallyStackedFronts.length - 1;
        if (reinforcementCount > 0) {
            pieces.push({ 
                name: 'Refuerzo Intermedio', 
                width: interiorWidth, 
                height: 100, 
                quantity: reinforcementCount, 
                material: MELAMINE_MATERIAL,
                notes: 'Separación entre frentes'
            });
        }
    }
  } else { // For wall and tall cabinets
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
        frontName = 'Frente de Cajón (Tirar)';
      }
      
      const drawerFrontWidth = width - 4;

      pieces.push({
        name: frontName,
        width: drawerFrontWidth,
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
