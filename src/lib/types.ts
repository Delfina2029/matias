import type { LucideIcon } from "lucide-react";

export interface Piece {
  name: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
  notes?: string;
}

export interface CabinetComponent {
  id: string;
  type: 'drawer' | 'door' | 'opening' | 'shelf';
  height: number;
  handle?: 'j-profile';
  hinge?: 'side' | 'top';
}

export interface Cabinet {
  id: string;
  name: string;
  type: 'base' | 'wall' | 'tall' | 'placar';
  icon: LucideIcon;
  width: number;
  height: number;
  depth: number;
  depth2?: number;
  pieces: Piece[];
  defaultComponents?: Omit<CabinetComponent, 'id'>[];
}

export interface PlacedCabinet {
  instanceId: string;
  cabinetId: string;
  type: 'base' | 'wall' | 'tall' | 'placar';
  position: [number, number, number]; // [x, y, z]
  rotation: [number, number, number]; // [x, y, z] Euler angles in radians
  width: number;
  height: number;
  depth: number;
  depth2?: number;
  components: CabinetComponent[];
}

export interface Appearance {
  frontColor: string;
  carcassColor: string;
  countertopColor: string;
}
