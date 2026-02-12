'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { Appearance } from '@/lib/types';

type AppearanceEditorProps = {
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
};

const WOOD_COLORS = [
  { name: 'Blanco', color: '#f8f9fa' },
  { name: 'Roble Claro', color: '#D2B48C' },
  { name: 'Nogal', color: '#6F4E37' },
  { name: 'Gris Grafito', color: '#555555' },
];

const CARCASS_COLORS = [
    { name: 'Blanco', color: '#e9ecef' },
    { name: 'Gris', color: '#adb5bd' },
];

const COUNTERTOP_COLORS = [
  { name: 'Granito Negro', color: '#343a40' },
  { name: 'Mármol Blanco', color: '#fdfdfd' },
  { name: 'Cuarzo Gris', color: '#ced4da' },
  { name: 'Madera', color: '#a0785a' },
];

export function AppearanceEditor({ appearance, setAppearance }: AppearanceEditorProps) {
  
  const ColorSwatch = ({ name, color, isSelected, onClick }: { name: string; color: string; isSelected: boolean, onClick: () => void }) => (
    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onClick}>
      <div
        className={cn('h-16 w-16 rounded-md border-2 p-0 flex items-center justify-center', isSelected && 'ring-2 ring-accent ring-offset-2')}
        style={{ backgroundColor: color }}
        aria-label={`Seleccionar ${name}`}
      >
        {isSelected && <Check className="h-6 w-6 text-accent-foreground mix-blend-difference" />}
      </div>
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3">Color de Frentes (Puertas/Cajones)</h4>
        <div className="grid grid-cols-4 gap-3">
          {WOOD_COLORS.map((c) => (
            <ColorSwatch
              key={c.name}
              name={c.name}
              color={c.color}
              isSelected={appearance.frontColor === c.color}
              onClick={() => setAppearance({ ...appearance, frontColor: c.color })}
            />
          ))}
        </div>
      </div>
       <div>
        <h4 className="font-semibold mb-3">Color de Cuerpo</h4>
        <div className="grid grid-cols-4 gap-3">
          {CARCASS_COLORS.map((c) => (
            <ColorSwatch
              key={c.name}
              name={c.name}
              color={c.color}
              isSelected={appearance.carcassColor === c.color}
              onClick={() => setAppearance({ ...appearance, carcassColor: c.color })}
            />
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-3">Color de Encimera</h4>
        <div className="grid grid-cols-4 gap-3">
          {COUNTERTOP_COLORS.map((c) => (
            <ColorSwatch
              key={c.name}
              name={c.name}
              color={c.color}
              isSelected={appearance.countertopColor === c.color}
              onClick={() => setAppearance({ ...appearance, countertopColor: c.color })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
