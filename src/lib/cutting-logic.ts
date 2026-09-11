import type { PlacedCabinet, Piece, Appearance } from './types';
import { 
  calculateComponentDimensions, 
  calculateDrawerBoxDimensions,
  MELAMINE_THICKNESS as CABINET_MELAMINE_THICKNESS,
  FRONT_OVERLAY_OFFSET
} from './cabinet-utils';

const MELAMINE_THICKNESS = CABINET_MELAMINE_THICKNESS;
const BACK_PANEL_MATERIAL = 'MDF 3mm';

/**
 * Generates a list of pieces for a given cabinet based on its dimensions and components.
 * @param cabinet The placed cabinet configuration.
 * @param appearance The current appearance configuration.
 * @returns An array of pieces for the cutting list.
 */
export function generatePiecesForCabinet(cabinet: PlacedCabinet, appearance?: Appearance): Piece[] {
  const frontMaterial = appearance ? `Melamina ${appearance.frontColorName}` : 'Melamina Frente';
  const carcassMaterial = appearance ? `Melamina ${appearance.carcassColorName}` : 'Melamina Carcasa';
  
  const isInset = appearance?.frontStyle === 'inset';
  const carcassDepth = isInset ? cabinet.depth : cabinet.depth - FRONT_OVERLAY_OFFSET;
  const interiorDepth = cabinet.depth - FRONT_OVERLAY_OFFSET;

  // Handle special cases like corner cabinets first
  if (cabinet.cabinetId === 'base-blind-corner') {
    const pieces: Piece[] = [];
    const { width, height, depth, useLegs, components } = cabinet;
    const effectiveHeight = useLegs ? height - 100 : height;
    
    // Default blind width (usually 450-500mm to leave room for a 600mm adjacent cabinet + gap)
    const blindPartWidth = 500; 
    const interiorWidth = width - (2 * MELAMINE_THICKNESS);
    const doorSpaceWidth = width - blindPartWidth;

    const invert = cabinet.invertSide || false;

    // Carcass
    pieces.push({ name: 'Lateral Exterior', width: carcassDepth, height: effectiveHeight, quantity: 1, material: carcassMaterial, edgeBanding: { h1: true }, notes: invert ? 'Lado Izquierdo' : 'Lado Derecho' });
    pieces.push({ name: 'Lateral Ciego (Interior)', width: carcassDepth, height: effectiveHeight, quantity: 1, material: carcassMaterial, edgeBanding: { h1: true }, notes: 'Divisor interno' });
    pieces.push({ name: 'Piso', width: width - MELAMINE_THICKNESS, height: interiorDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
    pieces.push({ name: 'Refuerzo Superior', width: width - MELAMINE_THICKNESS, height: 100, quantity: 2, material: carcassMaterial });
    
    // Blind Front (Tabique)
    pieces.push({ 
        name: 'Frente Ciego (Tabique)', 
        width: blindPartWidth - 50, 
        height: effectiveHeight, 
        quantity: 1, 
        material: carcassMaterial, 
        notes: invert ? 'Ubicado a la Derecha' : 'Ubicado a la Izquierda' 
    });
    
    pieces.push({ 
        name: 'Regleta Frontal', 
        width: 50, 
        height: effectiveHeight, 
        quantity: 1, 
        material: frontMaterial, 
        edgeBanding: { h1: true }, 
        notes: invert ? 'Lado de Bisagras (Izq)' : 'Lado de Bisagras (Der)' 
    });
    
    pieces.push({ name: 'Panel Trasero', width: width - 5, height: effectiveHeight - 5, quantity: 1, material: BACK_PANEL_MATERIAL });

    // Components (Door & Shelf)
    const doorComp = components.find(c => c.type === 'door');
    if (doorComp) {
        const door = calculateComponentDimensions(
            'base',
            cabinet.cabinetId,
            doorComp,
            0,
            doorSpaceWidth,
            1,
            cabinet.useJProfileDiscounts,
            useLegs,
            appearance?.frontStyle || 'overlay',
            cabinet.height
        );
        pieces.push({ name: door.name, width: door.width, height: door.height, quantity: 1, material: frontMaterial, edgeBanding: { w1: true, w2: true, h1: true, h2: true } });
        pieces.push({ name: 'Bisagras Cierre Suave Codo 9 (Media)', width: 0, height: 0, quantity: 2, material: 'Herrajes', notes: 'Para batir sobre lateral interno' });
    }

    // Shelf
    pieces.push({ name: 'Estante', width: width - (2 * MELAMINE_THICKNESS) - 2, height: carcassDepth - 20, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
    pieces.push({ name: 'Soportes Estante', width: 0, height: 0, quantity: 4, material: 'Herrajes' });

    if (useLegs) {
        pieces.push({ name: 'Patas Cuadradas 10cm', width: 0, height: 0, quantity: 4, material: 'Herrajes' });
    }

    return pieces;
  }
  
  if (cabinet.cabinetId === 'base-corner') {
    const cornerPieces: Piece[] = [];
    const { width, height, width2, depth2, useLegs } = cabinet; 
    
    const totalWidth1 = width;
    const totalWidth2 = width2 || width;
    const totalDepth1 = cabinet.depth;
    const totalDepth2 = depth2 || cabinet.depth;

    const bodyDepth1 = isInset ? totalDepth1 : totalDepth1 - FRONT_OVERLAY_OFFSET;
    const bodyDepth2 = isInset ? totalDepth2 : totalDepth2 - FRONT_OVERLAY_OFFSET;
    const interiorDepth1 = totalDepth1 - FRONT_OVERLAY_OFFSET;
    const interiorDepth2 = totalDepth2 - FRONT_OVERLAY_OFFSET;
    
    const effectiveHeight = useLegs ? height - 100 : height;

    // Doors for the corner opening (-20mm descuento superior, -30mm perfil J)
    let doorHeight = effectiveHeight - 20;
    let doorName = 'Puerta Esquinero';
    if (cabinet.useJProfileDiscounts) {
        doorHeight -= 30;
        doorName += ' (Perfil J 30mm)';
    }

    // Door 1 width: space from Lateral 2 to the inner corner, minus 3mm gap
    const door1Width = (totalWidth1 - bodyDepth2) - 3; 
    // Door 2 width: space from Lateral 1 to the inner corner, minus thickness of Door 1 and gap
    const door2Width = (totalWidth2 - bodyDepth1) - 3 - MELAMINE_THICKNESS;

    cornerPieces.push({ name: doorName + ' 1', width: door1Width, height: doorHeight, quantity: 1, material: frontMaterial, edgeBanding: { w1: true, w2: true, h1: true, h2: true } });
    cornerPieces.push({ name: doorName + ' 2', width: door2Width, height: doorHeight, quantity: 1, material: frontMaterial, edgeBanding: { w1: true, w2: true, h1: true, h2: true } });

    // Carcass Pieces (Laterales)
    cornerPieces.push({ name: 'Lateral Exterior 1', width: bodyDepth1, height: effectiveHeight, quantity: 1, material: carcassMaterial, edgeBanding: { h1: true } });
    cornerPieces.push({ name: 'Lateral Exterior 2', width: bodyDepth2, height: effectiveHeight, quantity: 1, material: carcassMaterial, edgeBanding: { h1: true } });

    // Piso (Corte en L)
    const pisoBoundingWidth = totalWidth1 - MELAMINE_THICKNESS;
    const pisoBoundingHeight = totalWidth2 - MELAMINE_THICKNESS; 
    cornerPieces.push({ 
        name: 'Piso (Corte en L)', 
        width: pisoBoundingWidth, 
        height: pisoBoundingHeight, 
        quantity: 1, 
        material: carcassMaterial, 
        edgeBanding: { w1: true, h1: true },
        notes: `Profundidades: Brazo Ancho A: ${isInset ? interiorDepth2 : bodyDepth2}mm, Brazo Ancho B: ${isInset ? interiorDepth1 : bodyDepth1}mm`
    });

    // Estante (Corte en L)
    const estanteBoundingWidth = totalWidth1 - MELAMINE_THICKNESS - 2;
    const estanteBoundingHeight = totalWidth2 - MELAMINE_THICKNESS - 2;
    cornerPieces.push({ 
        name: 'Estante Interno (Corte en L)', 
        width: estanteBoundingWidth, 
        height: estanteBoundingHeight, 
        quantity: 1, 
        material: carcassMaterial, 
        edgeBanding: { w1: true, h1: true },
        notes: `Profundidades: Brazo Ancho A: ${bodyDepth2 - 20}mm, Brazo Ancho B: ${bodyDepth1 - 20}mm`
    });
    
    // Refuerzos Superiores (Flejes)
    cornerPieces.push({ name: 'Refuerzo Superior Trasero (Pared 1)', width: totalWidth1 - MELAMINE_THICKNESS, height: 100, quantity: 1, material: carcassMaterial });
    cornerPieces.push({ name: 'Refuerzo Superior Trasero (Pared 2)', width: totalWidth2 - MELAMINE_THICKNESS * 2, height: 100, quantity: 1, material: carcassMaterial });
    cornerPieces.push({ name: 'Refuerzo Superior Frontal 1', width: totalWidth1 - bodyDepth2 - MELAMINE_THICKNESS, height: 100, quantity: 1, material: carcassMaterial });
    cornerPieces.push({ name: 'Refuerzo Superior Frontal 2', width: totalWidth2 - bodyDepth1 - MELAMINE_THICKNESS * 2, height: 100, quantity: 1, material: carcassMaterial });

    // Paneles Traseros
    cornerPieces.push({ name: 'Panel Trasero Pared 1', width: totalWidth1 - 5, height: effectiveHeight - 5, quantity: 1, material: BACK_PANEL_MATERIAL });
    cornerPieces.push({ name: 'Panel Trasero Pared 2', width: totalWidth2 - MELAMINE_THICKNESS - 5, height: effectiveHeight - 5, quantity: 1, material: BACK_PANEL_MATERIAL });
    
    // Hardware
    if (useLegs) {
      cornerPieces.push({ name: 'Patas Cuadradas 10cm', width: 0, height: 0, quantity: 5, material: 'Herrajes' });
    }
    cornerPieces.push({ name: 'Bisagras Rinconeras / Esquinero', width: 0, height: 0, quantity: 4, material: 'Herrajes', notes: 'Para empalme y lateral' });
    cornerPieces.push({ name: 'Tapas Tornillo (Melamina)', width: 0, height: 0, quantity: 24, material: 'Herrajes' });
    cornerPieces.push({ name: 'Soportes Estante', width: 0, height: 0, quantity: 8, material: 'Herrajes' });
    
    // Profiles
    if (cabinet.useJProfileDiscounts) {
        cornerPieces.push({ name: 'Perfil J (Aluminio)', width: door1Width, height: 0, quantity: 1, material: 'Herrajes' });
        cornerPieces.push({ name: 'Perfil J (Aluminio)', width: door2Width, height: 0, quantity: 1, material: 'Herrajes' });
    } else {
        cornerPieces.push({ name: 'Tiradores', width: 0, height: 0, quantity: 2, material: 'Herrajes' });
    }
    
    return cornerPieces;
  }
  
  if (cabinet.cabinetId === 'wall-microwave') {
    const pieces: Piece[] = [];
    const { width, height, depth, components } = cabinet;
    const interiorWidth = width - (2 * MELAMINE_THICKNESS);
    
    // Carcass
    pieces.push({ name: 'Lateral', width: carcassDepth, height: height, quantity: 2, material: carcassMaterial, edgeBanding: { h1: true } });
    pieces.push({ name: 'Piso', width: interiorWidth, height: carcassDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
    pieces.push({ name: 'Tapa', width: interiorWidth, height: carcassDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
    pieces.push({ name: 'Panel Trasero', width: width - 5, height: height - 5, quantity: 1, material: BACK_PANEL_MATERIAL });

    const doorComp = components.find(c => c.type === 'door');

    // Add shelf between components
    if (components.length > 1) {
      pieces.push({ name: 'Estante Microondas', width: interiorWidth, height: carcassDepth - 20, quantity: 1, material: carcassMaterial });
      pieces.push({ name: 'Soportes Estante', width: 0, height: 0, quantity: 4, material: 'Herrajes' });
    }

    if(doorComp) {
        let doorHeight = doorComp.height - 4;
        let doorName: string;
        if (doorComp.handle === 'j-profile') { 
            doorHeight -= 26.8; 
            doorName = 'Puerta (Perfil J)';
        } else {
            doorName = 'Puerta (Tirar)';
            pieces.push({ name: 'Tirador', width: 0, height: 0, quantity: 1, material: 'Herrajes' });
        }

        if (doorComp.hinge === 'top') {
            doorName = `${doorName} (Apertura Arriba)`;
            pieces.push({ name: 'Pistón a Gas', width: 0, height: 0, quantity: 1, material: 'Herrajes' });
        }
        
        pieces.push({ name: doorName, width: width - 4, height: doorHeight, quantity: 1, material: frontMaterial });
        pieces.push({ name: 'Bisagras Cierre Suave Codo 0', width: 0, height: 0, quantity: 2, material: 'Herrajes' });
        
        if (doorComp.handle === 'j-profile') {
            pieces.push({ name: 'Perfil J (Aluminio)', width: width - 4, height: 0, quantity: 1, material: 'Herrajes' });
        }
    }
    
    pieces.push({ name: 'Tapas Tornillo (Melamina)', width: 0, height: 0, quantity: 8, material: 'Herrajes' });

    return pieces;
  }

  if (cabinet.cabinetId.startsWith('vanity')) {
    const { width, height, depth, components, cabinetId } = cabinet;
    const pieces: Piece[] = [];
    const interiorWidth = width - (2 * MELAMINE_THICKNESS);
    
    const isHanging = cabinet.cabinetId.includes('hanging');
    const cabinetBodyHeight = isHanging ? height : height - 100; // Account for 100mm legs or not
    
    // Hanging vanities use inset fronts, so carcass depth is full depth
    const vanityCarcassDepth = isHanging ? depth : carcassDepth;
    const vanityPisoDepth = isHanging ? depth : vanityCarcassDepth;

    // Carcass
    pieces.push({ name: 'Lateral', width: vanityCarcassDepth, height: cabinetBodyHeight, quantity: 2, material: carcassMaterial, edgeBanding: { h1: true, h2: isHanging } });
    pieces.push({ name: 'Piso', width: interiorWidth, height: vanityPisoDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });

    // All vanities get top reinforcements for a ceramic sink, not a full top.
    const refuerzoQty = isHanging ? 3 : 2; // Hanging vanities get an extra reinforcement
    pieces.push({ 
      name: 'Refuerzo Superior Vertical', 
      width: interiorWidth, 
      height: 100, 
      quantity: refuerzoQty, 
      material: carcassMaterial, 
      notes: isHanging ? 'Colocación vertical para colgar y paso de bacha (frente, fondo y anclaje)' : 'Colocación vertical (frente y fondo)' 
    });

    // Add back panel only for the drawer area in hanging vanities
    if (isHanging) {
      const drawerHeight = components
        .filter(c => c.type === 'drawer')
        .reduce((sum, c) => sum + c.height, 0);
      if (drawerHeight > 0) {
        pieces.push({
          name: 'Panel Trasero',
          width: width - 5,
          height: drawerHeight - 5,
          quantity: 1,
          material: BACK_PANEL_MATERIAL,
          notes: 'Solo para la zona de cajones'
        });
      }
    }

    // Add reinforcements between vertically stacked drawers (for both hanging and non-hanging vanities)
    const frontComponents = components.filter(c => c.type === 'drawer' || c.type === 'door');
    const treatAsHorizontalDoors = frontComponents.length > 1 && frontComponents.every(c => c.type === 'door');

    // For hanging vanities: add reinforcement between stacked drawers only
    // For non-hanging: add reinforcement between any stacked front components
    const drawerComponents = components.filter(c => c.type === 'drawer');
    const needsReinforcement = isHanging
      ? drawerComponents.length > 1
      : (!treatAsHorizontalDoors && frontComponents.length > 1);

    if (needsReinforcement) {
      const reinforcementCount = isHanging ? drawerComponents.length - 1 : frontComponents.length - 1;
      if (reinforcementCount > 0) {
        pieces.push({
          name: 'Refuerzo Intermedio',
          width: interiorWidth,
          height: 100,
          quantity: reinforcementCount,
          material: carcassMaterial,
          notes: 'Separación entre frentes'
        });
      }
    }


    if (!isHanging) {
        // Legs
        pieces.push({ name: 'Patas Cuadradas 10cm', width: 0, height: 0, quantity: 4, material: 'Herrajes' });
    }
    pieces.push({ name: 'Tapas Tornillo (Melamina)', width: 0, height: 0, quantity: 12, material: 'Herrajes' });
    
    // Components
    // Find the index of the highest drawer in the stack.
    let topDrawerIndex = -1;
    components.forEach((c, i) => {
        if (c.type === 'drawer' && topDrawerIndex === -1) {
            topDrawerIndex = i;
        }
    });

    components.forEach((component, index) => {
        if (component.type === 'door') {
            const compIndex = index;
            const door = calculateComponentDimensions(
                cabinet.type,
                cabinet.cabinetId,
                component,
                compIndex,
                width,
                1,
                cabinet.useJProfileDiscounts
            );

            const qty = (cabinetId === 'vanity-patas-1d2p' ? 1 : (cabinetId.endsWith('2p') || cabinetId.endsWith('1d2p') ? 2 : 1));
            pieces.push({ name: door.name, width: door.width, height: door.height, quantity: qty, material: frontMaterial, edgeBanding: { w1: true, w2: true, h1: true, h2: true } });
            
            pieces.push({ name: 'Bisagras Cierre Suave Codo 0', width: 0, height: 0, quantity: qty * 2, material: 'Herrajes' });
            if (isHanging) {
                // No handle or J-profile for hanging vanities per user request
            } else if (component.handle !== 'j-profile') {
                pieces.push({ name: 'Tirador / Manija', width: 0, height: 0, quantity: qty, material: 'Herrajes' });
            } else {
                pieces.push({ name: 'Perfil J (Aluminio)', width: door.width, height: 0, quantity: qty, material: 'Herrajes' });
            }

        } else if (component.type === 'drawer') {
            const compIndex = index;
            const isTopDrawer = compIndex === topDrawerIndex;
            
            const front = calculateComponentDimensions(
                cabinet.type,
                cabinet.cabinetId,
                component,
                compIndex,
                width,
                1,
                cabinet.useJProfileDiscounts
            );

            pieces.push({ name: front.name, width: front.width, height: front.height, quantity: 1, material: frontMaterial, edgeBanding: { w1: true, w2: true, h1: true, h2: true } });
            
            if (isHanging) {
                // No handle or J-profile for hanging vanities per user request
            } else if (component.handle !== 'j-profile') {
                pieces.push({ name: 'Tirador / Manija', width: 0, height: 0, quantity: 1, material: 'Herrajes' });
            } else {
                pieces.push({ name: 'Perfil J (Aluminio)', width: front.width, height: 0, quantity: 1, material: 'Herrajes' });
            }
            
            // Determine slide length
            let slideLength = 500;
            if (cabinet.depth < 350) slideLength = 300;
            else if (cabinet.depth < 400) slideLength = 350;
            else if (cabinet.depth < 450) slideLength = 400;
            else if (cabinet.depth < 500) slideLength = 450;
            pieces.push({ name: `Correderas (Telescópica ${slideLength}mm)`, width: 0, height: 0, quantity: 1, material: 'Herrajes' });

            // --- Drawer Box ---
            const box = calculateDrawerBoxDimensions(
                cabinet.type,
                cabinet.cabinetId,
                interiorWidth,
                cabinet.depth,
                isTopDrawer,
                cabinet.useLegs,
                component.drawerBoxHeight
            );

            if (box.type === 'u-shape') {
                const sideBoxWidth = box.sideBoxInnerWidth! - (2 * MELAMINE_THICKNESS);
                const frontCenterDepth = 130; // 13 cm from the front panel

                pieces.push({ name: 'Lateral de Cajón Vanitory', width: box.depth, height: box.height, quantity: 4, material: carcassMaterial, canRotate: true });
                pieces.push({ name: 'Frente/Trasero Lateral U', width: sideBoxWidth, height: box.height, quantity: 4, material: carcassMaterial, canRotate: true });
                pieces.push({ name: 'Frente/Cruce Central U', width: box.plumbingGap!, height: box.height, quantity: 2, material: carcassMaterial, canRotate: true, notes: 'Frente central y cruce de la H' });
                
                pieces.push({ name: 'Fondo de Cajón U (Lados)', width: sideBoxWidth, height: box.depth - (2 * MELAMINE_THICKNESS), quantity: 2, material: BACK_PANEL_MATERIAL, canRotate: true });
                pieces.push({ name: 'Fondo de Cajón U (Frente Centro)', width: box.plumbingGap!, height: frontCenterDepth, quantity: 1, material: BACK_PANEL_MATERIAL, canRotate: true });
            } else {
                pieces.push({ name: 'Lateral de Cajón', width: box.depth, height: box.height, quantity: 2, material: carcassMaterial, canRotate: true });
                if (isHanging) {
                    pieces.push({ name: 'Frente/Trasero de Cajón', width: box.width, height: box.height, quantity: 2, material: carcassMaterial, canRotate: true });
                } else {
                    pieces.push({ name: 'Frente/Trasero de Cajón', width: box.width - (2*MELAMINE_THICKNESS), height: box.height, quantity: 2, material: carcassMaterial, canRotate: true });
                }
                pieces.push({ name: 'Fondo de Cajón', width: box.width - (2*MELAMINE_THICKNESS), height: box.depth, quantity: 1, material: BACK_PANEL_MATERIAL, canRotate: true });
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
    pieces.push({ name: 'Lateral Placar', width: carcassDepth, height: height, quantity: 2, material: carcassMaterial, edgeBanding: { h1: true } });
    pieces.push({ name: 'Piso Placar', width: interiorWidth, height: carcassDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
    pieces.push({ name: 'Tapa Placar', width: interiorWidth, height: carcassDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
    pieces.push({ name: 'Panel Trasero Placar', width: width - 5, height: height - 5, quantity: 1, material: BACK_PANEL_MATERIAL });
    
    // Interior Components
    components.forEach(component => {
      if (component.type === 'shelf') {
        pieces.push({
          name: 'Estante Placar',
          width: interiorWidth - 2, // A little tolerance
          height: carcassDepth - 20, // Not full depth to allow for back panel and air flow
          quantity: 1,
          material: carcassMaterial,
          edgeBanding: { w1: true }
        });
        pieces.push({ name: 'Soportes Estante', width: 0, height: 0, quantity: 4, material: 'Herrajes' });
      } else if (component.type === 'hanging-rail') {
        pieces.push({
            name: 'Barral para Placar',
            width: interiorWidth - 10,
            height: 0,
            quantity: 1,
            material: 'Herrajes',
            notes: 'Largo del barral'
        });
      } else if (component.type === 'drawer') {
        const drawerBoxHeight = component.drawerBoxHeight || 100;
        pieces.push({ name: 'Correderas Telescópicas', width: 0, height: carcassDepth - 50, quantity: 2, material: 'Herrajes' });
        
        // Frente
        const frontWidth = interiorWidth - 6; // 3mm gap per side
        pieces.push({ name: 'Frente de Cajón Interno', width: frontWidth, height: component.height - 6, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true, w2: true, h1: true, h2: true } });
        
        // Caja
        const boxWidth = interiorWidth - 26; // minus slides
        pieces.push({ name: 'Lateral de Cajón', width: carcassDepth - 50, height: drawerBoxHeight, quantity: 2, material: carcassMaterial, edgeBanding: { w1: true } });
        pieces.push({ name: 'Frente/Trasero de Cajón', width: boxWidth - (2*MELAMINE_THICKNESS), height: drawerBoxHeight, quantity: 2, material: carcassMaterial, edgeBanding: { w1: true } });
        pieces.push({ name: 'Fondo de Cajón', width: boxWidth - (2*MELAMINE_THICKNESS), height: carcassDepth - 50, quantity: 1, material: BACK_PANEL_MATERIAL });
      } else if (component.type === 'vertical-divider') {
        pieces.push({
            name: 'Divisor Vertical Placar',
            width: carcassDepth - 20, // same depth as shelves
            height: component.height,
            quantity: 1,
            material: carcassMaterial,
            edgeBanding: { h1: true } // assuming h is the long edge
        });
      }
    });

    pieces.push({ name: 'Tapas Tornillo (Melamina)', width: 0, height: 0, quantity: 24, material: 'Herrajes' });

    return pieces;
  }

  // --- Regular rectangular cabinet logic ---
  const { width, height, depth, components, type, useLegs } = cabinet;
  const pieces: Piece[] = [];
  const effectiveHeight = (type === 'base' && useLegs) ? height - 100 : height;

  const interiorWidth = width - (2 * MELAMINE_THICKNESS);

  // 1. Sides
  pieces.push({ name: 'Lateral', width: carcassDepth, height: effectiveHeight, quantity: 2, material: carcassMaterial, edgeBanding: { h1: true } });
  
  // 2. Bottom and Top/Reinforcements for base cabinets
  if (type === 'base') {
    pieces.push({ name: 'Piso', width: interiorWidth, height: interiorDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
    
    // Always add two top reinforcements (front and back)
    pieces.push({ name: 'Refuerzo Superior', width: interiorWidth, height: 100, quantity: 2, material: carcassMaterial, notes: 'Para frente y fondo' });

    // Optional Inner Shelf for base-1p and base-2p
    if (cabinet.hasInnerShelf && (cabinet.cabinetId === 'base-1p' || cabinet.cabinetId === 'base-2p')) {
      pieces.push({
        name: 'Estante Interno',
        width: interiorWidth,
        height: interiorDepth - 7, // 7mm deduction for back panel
        quantity: 1,
        material: carcassMaterial,
        edgeBanding: { w1: true }
      });
      pieces.push({ name: 'Soportes Estante', width: 0, height: 0, quantity: 4, material: 'Herrajes' });
    }

    // Add reinforcements between vertically stacked components (drawers or doors)
    const verticallyStackedFronts = components.filter(c => c.type === 'drawer' || c.type === 'door');
    // This logic prevents adding vertical separators for horizontally-placed doors
    const treatAsHorizontalDoors = verticallyStackedFronts.length > 1 && verticallyStackedFronts.every(c => c.type === 'door');
    
    if (!treatAsHorizontalDoors && verticallyStackedFronts.length > 1) {
        const reinforcementCount = verticallyStackedFronts.length - 1;
        if (reinforcementCount > 0) {
            pieces.push({ 
                name: 'Refuerzo Intermedio', 
                width: interiorWidth, 
                height: 100, 
                quantity: reinforcementCount, 
                material: carcassMaterial,
                notes: 'Separación entre frentes'
            });
        }
    }
  } else { // For wall and tall cabinets
    pieces.push({ name: 'Piso', width: interiorWidth, height: interiorDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
    pieces.push({ name: 'Tapa', width: interiorWidth, height: interiorDepth, quantity: 1, material: carcassMaterial, edgeBanding: { w1: true } });
  }

  if (useLegs && type === 'base') {
    pieces.push({ name: 'Patas Cuadradas 10cm', width: 0, height: 0, quantity: 4, material: 'Herrajes' });
  }

  // 3. Back Panel
  pieces.push({ name: 'Panel Trasero', width: width - 5, height: effectiveHeight - 5, quantity: 1, material: BACK_PANEL_MATERIAL });
  
  // 4. Shelves
  if (components.every(c => c.type === 'door')) {
    const shelfQty = type !== 'tall' ? 1 : 4;
    pieces.push({ name: 'Estante', width: interiorWidth - 2, height: interiorDepth - 25, quantity: shelfQty, material: carcassMaterial, edgeBanding: { w1: true } });
    pieces.push({ name: 'Soportes Estante', width: 0, height: 0, quantity: shelfQty * 4, material: 'Herrajes' });
  }
  pieces.push({ name: 'Tapas Tornillo (Melamina)', width: 0, height: 0, quantity: 12, material: 'Herrajes' });

  // --- Components (Doors & Drawers) ---
  
  components.forEach((component, index) => {
    if (component.type === 'door') {
      const door = calculateComponentDimensions(
        type,
        cabinet.cabinetId,
        component,
        index,
        width,
        1, // defaultNumDoors
        cabinet.useJProfileDiscounts,
        useLegs,
        appearance?.frontStyle || 'overlay',
        cabinet.height
      );

      pieces.push({
        name: door.name,
        width: door.width,
        height: door.height,
        quantity: component.numDoors || 1,
        material: frontMaterial,
        edgeBanding: { w1: true, w2: true, h1: true, h2: true }
      });
      
      const hingeQty = (door.height > 1000 ? 3 : 2) * (component.numDoors || 1);
      pieces.push({ name: 'Bisagras Cierre Suave Codo 0', width: 0, height: 0, quantity: hingeQty, material: 'Herrajes' });
      
      if (component.handle !== 'j-profile') {
          pieces.push({ name: 'Tirador / Manija', width: 0, height: 0, quantity: component.numDoors || 1, material: 'Herrajes' });
      } else {
          pieces.push({ name: 'Perfil J (Aluminio)', width: door.width, height: 0, quantity: component.numDoors || 1, material: 'Herrajes' });
      }
      
    } else if (component.type === 'drawer') {
      const front = calculateComponentDimensions(
        type,
        cabinet.cabinetId,
        component,
        index,
        width,
        1,
        cabinet.useJProfileDiscounts,
        useLegs,
        appearance?.frontStyle || 'overlay',
        cabinet.height
      );

      pieces.push({
        name: front.name,
        width: front.width,
        height: front.height,
        quantity: 1,
        material: frontMaterial,
        edgeBanding: { w1: true, w2: true, h1: true, h2: true }
      });
      
      if (component.handle !== 'j-profile') {
          pieces.push({ name: 'Tirador / Manija', width: 0, height: 0, quantity: 1, material: 'Herrajes' });
      } else {
          pieces.push({ name: 'Perfil J (Aluminio)', width: front.width, height: 0, quantity: 1, material: 'Herrajes' });
      }
      
      let slideLength = 500;
      if (cabinet.depth < 350) slideLength = 300;
      else if (cabinet.depth < 400) slideLength = 350;
      else if (cabinet.depth < 450) slideLength = 400;
      else if (cabinet.depth < 500) slideLength = 450;
      pieces.push({ name: `Correderas (Telescópica ${slideLength}mm)`, width: 0, height: 0, quantity: 1, material: 'Herrajes' });

      const box = calculateDrawerBoxDimensions(
        type,
        cabinet.cabinetId,
        interiorWidth,
        cabinet.depth,
        index === 0,
        useLegs,
        component.drawerBoxHeight
      );

      pieces.push({ name: 'Lateral de Cajón', width: box.depth, height: box.height, quantity: 2, material: carcassMaterial, edgeBanding: { h1: true }, canRotate: true });
      pieces.push({ name: 'Frente/Trasero de Cajón', width: box.width - (2*MELAMINE_THICKNESS), height: box.height, quantity: 2, material: carcassMaterial, edgeBanding: { h1: true }, canRotate: true });
      pieces.push({ name: 'Fondo de Cajón', width: box.width - (2*MELAMINE_THICKNESS), height: box.depth, quantity: 1, material: BACK_PANEL_MATERIAL, canRotate: true });
    }
  });

  return pieces;
}
