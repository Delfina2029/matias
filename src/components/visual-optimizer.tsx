'use client';

import React from 'react';
import type { Piece } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from './ui/badge';

interface AggregatedPiece extends Piece {
  width: number;
  height: number;
}

interface PlacedPiece extends AggregatedPiece {
  x: number;
  y: number;
  rotated: boolean;
}

interface VisualOptimizerProps {
  pieces: AggregatedPiece[];
  boardWidth: number;
  boardHeight: number;
  allowRotation: boolean;
}

const PIXELS_PER_MM = 0.2;

const packPieces = (
  piecesToPack: AggregatedPiece[],
  boardWidth: number,
  boardHeight: number,
  allowRotation: boolean
): { placed: PlacedPiece[]; unplaced: AggregatedPiece[] } => {
  let allPieces: (Omit<AggregatedPiece, 'quantity'> & { originalId: string })[] = [];
  piecesToPack.forEach((p, i) => {
    for (let j = 0; j < p.quantity; j++) {
      // Ignore pieces with no dimensions
      if (p.width > 0 && p.height > 0) {
        allPieces.push({ ...p, quantity: 1, originalId: `${p.name}-${i}-${j}` });
      }
    }
  });

  allPieces.sort((a, b) => b.height - a.height);

  const placed: PlacedPiece[] = [];
  const unplaced: AggregatedPiece[] = [];

  let currentX = 0;
  let currentY = 0;
  let rowMaxHeight = 0;

  for (const piece of allPieces) {
    let placedInThisTurn = false;

    const pieceW = piece.width;
    const pieceH = piece.height;
    
    const rotatedW = piece.height;
    const rotatedH = piece.width;

    if (currentX + pieceW <= boardWidth && currentY + pieceH <= boardHeight) {
      placed.push({ ...piece, x: currentX, y: currentY, rotated: false });
      currentX += pieceW;
      rowMaxHeight = Math.max(rowMaxHeight, pieceH);
      placedInThisTurn = true;
    } 
    else if (allowRotation && currentX + rotatedW <= boardWidth && currentY + rotatedH <= boardHeight) {
       placed.push({ ...piece, x: currentX, y: currentY, rotated: true });
       currentX += rotatedW;
       rowMaxHeight = Math.max(rowMaxHeight, rotatedH);
       placedInThisTurn = true;
    }
    else {
      currentX = 0;
      currentY += rowMaxHeight;
      rowMaxHeight = 0;

      if (currentX + pieceW <= boardWidth && currentY + pieceH <= boardHeight) {
        placed.push({ ...piece, x: currentX, y: currentY, rotated: false });
        currentX += pieceW;
        rowMaxHeight = Math.max(rowMaxHeight, pieceH);
        placedInThisTurn = true;
      }
      else if (allowRotation && currentX + rotatedW <= boardWidth && currentY + rotatedH <= boardHeight) {
        placed.push({ ...piece, x: currentX, y: currentY, rotated: true });
        currentX += rotatedW;
        rowMaxHeight = Math.max(rowMaxHeight, rotatedH);
        placedInThisTurn = true;
      }
    }

    if (!placedInThisTurn) {
        unplaced.push(piece);
    }
  }

  const consolidatedUnplaced = new Map<string, AggregatedPiece>();
  unplaced.forEach(p => {
      const key = `${p.name}|${p.width}|${p.height}`;
      if(consolidatedUnplaced.has(key)) {
          consolidatedUnplaced.get(key)!.quantity++;
      } else {
          consolidatedUnplaced.set(key, {...p, quantity: 1});
      }
  });

  return { placed, unplaced: Array.from(consolidatedUnplaced.values()) };
};


export function VisualOptimizer({ pieces, boardWidth, boardHeight, allowRotation }: VisualOptimizerProps) {
  if (!pieces || pieces.length === 0) {
    return null;
  }

  const { placed, unplaced } = React.useMemo(
    () => packPieces(pieces, boardWidth, boardHeight, allowRotation),
    [pieces, boardWidth, boardHeight, allowRotation]
  );
  
  const placedArea = placed.reduce((acc, p) => acc + p.width * p.height, 0);
  const boardArea = boardWidth * boardHeight;
  const wastePercentage = boardArea > 0 ? (1 - placedArea / boardArea) * 100 : 0;

  const viewBoxWidth = boardWidth * PIXELS_PER_MM;
  const viewBoxHeight = boardHeight * PIXELS_PER_MM;

  return (
    <Card className="mt-6 animate-in fade-in-50">
      <CardHeader>
        <CardTitle>Diagrama de Corte Visual</CardTitle>
        <CardDescription>
            Desperdicio Estimado: <Badge variant={wastePercentage > 30 ? "destructive" : "secondary"} className={wastePercentage <= 30 ? "bg-primary/20 text-primary" : ""}>{wastePercentage.toFixed(2)}%</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="bg-secondary/30 p-2 rounded-md overflow-x-auto border">
          <svg
            width="100%"
            viewBox={`-2 -2 ${viewBoxWidth + 4} ${viewBoxHeight + 4}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <rect
              x="0"
              y="0"
              width={viewBoxWidth}
              height={viewBoxHeight}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />
            {placed.map((piece, index) => {
              const pieceWidth = (piece.rotated ? piece.height : piece.width) * PIXELS_PER_MM;
              const pieceHeight = (piece.rotated ? piece.width : piece.height) * PIXELS_PER_MM;
              return (
                <g key={`${piece.originalId}-${index}`}>
                  <rect
                    x={piece.x * PIXELS_PER_MM}
                    y={piece.y * PIXELS_PER_MM}
                    width={pieceWidth}
                    height={pieceHeight}
                    fill="hsl(var(--primary) / 0.2)"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                  />
                  <text
                    x={(piece.x + (piece.rotated ? piece.height : piece.width) / 2) * PIXELS_PER_MM}
                    y={(piece.y + (piece.rotated ? piece.width : piece.height) / 2) * PIXELS_PER_MM}
                    fontSize={Math.max(10, Math.min(pieceWidth, pieceHeight) / 5)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="hsl(var(--primary-foreground))"
                    className="pointer-events-none font-medium"
                  >
                   {`${piece.width}x${piece.height}`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {unplaced.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-destructive">Piezas que no entraron:</h4>
            <ul className="list-disc pl-5 text-destructive space-y-1">
                {unplaced.map((p, i) => (
                    <li key={i}>{p.quantity}x {p.name} ({p.width}x{p.height}mm)</li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
