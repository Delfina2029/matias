import type { LucideIcon } from "lucide-react";

export interface Piece {
  name: string;
  width: number;
  height: number;
  quantity: number;
  material: string;
}

export interface Cabinet {
  id: string;
  name: string;
  type: 'base' | 'wall' | 'tall';
  icon: LucideIcon;
  width: number;
  height: number;
  depth: number;
  pieces: Piece[];
}

export interface CabinetComponent {
  id: string;
  type: 'drawer' | 'door';
  height: number;
  handle?: 'j-profile';
}

export interface PlacedCabinet {
  instanceId: string;
  cabinetId: string;
  type: 'base' | 'wall' | 'tall';
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  components: CabinetComponent[];
}
