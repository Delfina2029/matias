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

export interface PlacedCabinet {
  instanceId: string;
  cabinetId: string;
  x: number;
  y: number;
}
