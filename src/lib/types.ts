import type { LucideProps } from "lucide-react";
import type React from "react";

export interface Piece {
  name: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
  canRotate?: boolean;
  notes?: string;
  edgeBanding?: {
    w1?: boolean;
    w2?: boolean;
    h1?: boolean;
    h2?: boolean;
  };
}

export type MaterialPrices = {
  melaminaPlaca: number;
  melaminaWidth: number;
  melaminaHeight: number;
  corteMelamina: number;
  cantosPegados: number;
  mdf3mmPlaca: number;
  mdfWidth: number;
  mdfHeight: number;
  bisagraEstandar: number;
  bisagraCodo9: number;
  bisagraEsquinero: number;
  correderaPar: number;
  tirador: number;
  pataMueble: number;
  pistonGas: number;
  soporteEstante: number;
  barralPlacar: number;
  bisagraCierreSuave0: number;
  bisagraCierreSuave9: number;
  bisagraCierreSuave15: number;
  correderaTelescopica300: number;
  correderaTelescopica350: number;
  correderaTelescopica400: number;
  correderaTelescopica450: number;
  correderaTelescopica500: number;
  pataCuadrada10cm: number;
  perfilJ: number;
  tapaTornillo: number;
  cantoPreencolado: number;
  factoryMarkupPercent?: number; // Optional factory markup percentage (default 100%)
};

export interface CabinetComponent {
  id: string;
  type: 'drawer' | 'door' | 'opening' | 'shelf' | 'hanging-rail' | 'vertical-divider';
  height: number;
  handle?: 'j-profile';
  hinge?: 'side' | 'top';
  numDoors?: number; // 1 or 2 side-by-side
  drawerBoxHeight?: number; // interior box height in mm (default 100)
  positionY?: number; // absolute Y position from the bottom of the cabinet in mm
  positionX?: number; // absolute X position from the left of the cabinet in mm
}

export interface Cabinet {
  id: string;
  name: string;
  type: 'base' | 'wall' | 'tall' | 'placar';
  description?: string;
  icon: React.ComponentType<LucideProps>;
  width: number;
  width2?: number; // Added width2 here
  height: number;
  depth: number;
  depth2?: number;
  pieces: Piece[];
  defaultComponents?: Omit<CabinetComponent, 'id'>[];
  notes?: string;
  imageUrl?: string;
}

export interface PlacedCabinet {
  instanceId: string;
  cabinetId: string;
  type: 'base' | 'wall' | 'tall' | 'placar';
  position: [number, number, number]; // [x, y, z]
  rotation: [number, number, number]; // [x, y, z] Euler angles in radians
  width: number;
  width2?: number;
  height: number;
  depth: number;
  depth2?: number;
  components: CabinetComponent[];
  useJProfileDiscounts?: boolean;
  useLegs?: boolean;
  hasInnerShelf?: boolean;
  innerShelfHeights?: number[];
  invertSide?: boolean;
}

export interface Appearance {
  frontColor: string;
  frontColorName: string;
  carcassColor: string;
  carcassColorName: string;
  countertopColor: string;
  countertopColorName: string;
  frontStyle?: 'overlay' | 'inset';
}
