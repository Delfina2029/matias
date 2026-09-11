import { CabinetComponent, PlacedCabinet } from './types';

export const MELAMINE_THICKNESS = 18;
export const BASE_DOOR_HEIGHT_DISCOUNT = 20; // 20mm base discount for all base cabinet doors top clearance
export const J_PROFILE_BASE_DISCOUNT = 30; // 30mm additional when J-profile is ON
export const J_PROFILE_GENERAL_DISCOUNT = 26.8; // 26.8mm for wall/tall cabinets with J-profile
export const GENERAL_GAP = 6; // 6mm total gap for standard fronts (3mm each side)
export const INTER_DOOR_GAP = 6; // 6mm gap between two side-by-side doors (3mm per puerta)
export const EDGE_OFFSET = 3; // 3mm offset from cabinet edges per side

export const DRAWER_BOX_WIDTH_OFFSET = 26; // interiorWidth - 26
export const DRAWER_BOX_DEPTH_OFFSET = 50; // depth - 50 (5cm discount from cabinet depth)
export const DRAWER_BOX_HEIGHT = 100;
export const FRONT_OVERLAY_OFFSET = 20; // 20mm less depth for carcass to allow overlay fronts

/**
 * Calculates the dimensions of a door or drawer front.
 */
export function calculateComponentDimensions(
  cabinetType: PlacedCabinet['type'],
  cabinetId: string,
  component: CabinetComponent,
  index: number,
  cabinetWidth: number,
  defaultNumDoors: number = 1,
  useJProfileDiscounts: boolean = false,
  useLegs: boolean = false,
  frontStyle: 'overlay' | 'inset' = 'overlay',
  cabinetHeight: number = 810
) {
  let height = component.height - GENERAL_GAP;
  let name = component.type === 'door' ? 'Puerta' : 'Frente de Cajón';
  
  // Vanity has special logic
  const isVanity = cabinetId.startsWith('vanity');
  const isHangingVanity = cabinetId.includes('hanging');
  const isJProfile = component.handle === 'j-profile' || useJProfileDiscounts;

  // Inset front height logic
  if (frontStyle === 'inset' && !isHangingVanity) {
    const effectiveHeight = (cabinetType === 'base' && useLegs) ? cabinetHeight - 100 : cabinetHeight;
    const openingHeight = effectiveHeight - 2 * MELAMINE_THICKNESS;
    const scaleFactor = openingHeight / effectiveHeight;
    height = component.height * scaleFactor - 4; // 2mm gap top and bottom
    
    if (isJProfile) {
      height -= 20; // discount for inset J-profile
      name += ' (Embutido - Perfil J)';
    } else {
      name += ' (Embutido)';
    }
  } else {
    // Rule for Base Cabinets:
    // - Con Perfil J: Descuento de 40mm por frente para agarre (30mm perfil + 10mm holgura).
    // - Sin Perfil J: Descuento estándar de 6mm (3mm por lado) o 20mm si es la superior.
    if (cabinetType === 'base' && !isVanity) {
      // LOCKED BY USER REQUEST: bajo001, bajo002, bajo003
      if (cabinetId === 'base-1p' || cabinetId === 'base-2p' || cabinetId === 'base-2c') {
          // Both drawers in bajo003 and doors in bajo001/002 get exactly 53mm total deduction
          // (50mm top space + 3mm bottom clearance).
          
          // First, calculate the true scaled component height if legs are used
          const effectiveHeight = useLegs ? cabinetHeight - 100 : cabinetHeight;
          const trueCompHeight = useLegs ? component.height * (effectiveHeight / (cabinetHeight || 810)) : component.height;
          
          if (cabinetId === 'base-2c' && index === 0 && useJProfileDiscounts) {
              // Bottom drawer with J profile gets 40mm discount
              height = trueCompHeight - 40;
              name += ' (Perfil J -40mm)';
          } else if (cabinetId === 'base-2c' && index === 0 && !useJProfileDiscounts) {
              // Bottom drawer without J profile gets 53mm discount to match top drawer
              height = trueCompHeight - 53;
              name += ' (Espacio Dedos -53mm)';
          } else {
              // Top drawer or Doors
              height = trueCompHeight - 53;
              if (isJProfile) {
                  name += ' (Perfil J -53mm)';
              } else {
                  name += ' (Espacio Dedos -53mm)';
              }
          }
      } else if (cabinetId === 'base-3c') {
          // LOCKED BY USER REQUEST: bajo004
          const effectiveHeight = useLegs ? cabinetHeight - 100 : cabinetHeight;
          const trueCompHeight = useLegs ? component.height * (effectiveHeight / (cabinetHeight || 810)) : component.height;
          
          if (isJProfile) {
              height = trueCompHeight - 40;
              name += ' (Perfil J -40mm)';
          } else {
              height = trueCompHeight - 53;
              name += ' (Espacio Dedos -53mm)';
          }
      } else if (isJProfile) {
          height = component.height - 40; // Unified 40mm discount for J-profile in base cabinets
          name += ' (Perfil J -40mm)';
      } else if (index === 0) {
          height = component.height - BASE_DOOR_HEIGHT_DISCOUNT;
          name += ' (Tirar)';
      } else {
          height = component.height - GENERAL_GAP;
          name += ' (Tirar)';
      }
    } else if (!isVanity) {
      // Standard component height logic for Wall/Tall
      if (isJProfile) {
          height = component.height - J_PROFILE_GENERAL_DISCOUNT;
          name += ' (Perfil J)';
      } else {
          height = component.height - GENERAL_GAP;
          name += ' (Tirar)';
      }
    }
  }

  const numHorizontalDoors = component.numDoors || 1;
  let width = cabinetWidth - (EDGE_OFFSET * 2);
  
  // Specific hanging vanity door/drawer logic (Inset fronts)
  if (isHangingVanity) {
      // The component height in cabinets.ts is already predefined (e.g. 170). We use it directly.
      height = component.height; 
      
      const interiorWidth = cabinetWidth - (MELAMINE_THICKNESS * 2);
      width = interiorWidth - 8; // 4mm gap per side
  } else if (frontStyle === 'inset') {
      const isCorner = cabinetId === 'base-corner' || cabinetId === 'base-blind-corner';
      if (!isCorner) {
          const interiorWidth = cabinetWidth - (MELAMINE_THICKNESS * 2);
          width = (interiorWidth - 4 - 3 * (numHorizontalDoors - 1)) / numHorizontalDoors;
      } else {
          width = (cabinetWidth - 8 - 3 * (numHorizontalDoors - 1)) / numHorizontalDoors;
      }
  }

  if (numHorizontalDoors > 1 && !isHangingVanity && frontStyle !== 'inset') {
    // Formula: (TotalWidth - LeftEdge - RightEdge - gapsBetweenDoors) / numDoors
    const totalGaps = INTER_DOOR_GAP * (numHorizontalDoors - 1);
    width = (cabinetWidth - (EDGE_OFFSET * 2) - totalGaps) / numHorizontalDoors;
  }

  // Specific vanity door logic for non-hanging vanities
  if (isVanity && !isHangingVanity && component.type === 'door' && frontStyle !== 'inset') {
      const isTwoDoor = cabinetId.endsWith('2p') || cabinetId.endsWith('1d2p') || cabinetId.includes('hanging'); 
      if (isTwoDoor) {
          width = (cabinetWidth - (EDGE_OFFSET * 2) - INTER_DOOR_GAP) / 2;
      }
  }

  return { width, height, name };
}

/**
 * Calculates drawer box dimensions.
 */
export function calculateDrawerBoxDimensions(
  cabinetType: PlacedCabinet['type'],
  cabinetId: string,
  interiorWidth: number,
  cabinetDepth: number,
  isTopDrawer: boolean = false,
  useLegs: boolean = false,
  customBoxHeight?: number
) {
  const isVanity = cabinetId.startsWith('vanity');
  const isHangingVanity = cabinetId.includes('hanging');
  const boxHeight = customBoxHeight || DRAWER_BOX_HEIGHT;
  
  // Hanging vanity drawers are custom-dimensioned
  let drawerBoxWidthOffset = DRAWER_BOX_WIDTH_OFFSET;
  if (isHangingVanity) {
      drawerBoxWidthOffset = 24; // 564 - 24 = 540 width
  }

  if (isVanity && isTopDrawer && cabinetId !== 'vanity-patas-1d2p') {
    // U-shaped drawer for plumbing
    const drawerBoxDepth = 350;
    const drawerBoxWidth = interiorWidth - drawerBoxWidthOffset;
    const plumbingGap = isHangingVanity ? 140 : 160;
    const sideBoxInnerWidth = (drawerBoxWidth - plumbingGap) / 2;
    
    return {
      type: 'u-shape',
      depth: drawerBoxDepth,
      width: drawerBoxWidth,
      plumbingGap,
      sideBoxInnerWidth,
      height: boxHeight
    };
  }

  const drawerBoxWidth = interiorWidth - drawerBoxWidthOffset;
  const drawerBoxDepth = isVanity ? 350 : cabinetDepth - DRAWER_BOX_DEPTH_OFFSET;
  
  return {
    type: 'standard',
    width: drawerBoxWidth,
    depth: drawerBoxDepth,
    height: boxHeight
  };
}
