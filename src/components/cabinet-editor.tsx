'use client';

import { useState } from 'react';
import type { PlacedCabinet } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Archive, PlusSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CabinetEditorProps = {
  cabinet: PlacedCabinet;
  onUpdate: (cabinet: PlacedCabinet) => void;
  onClose: () => void;
};

export function CabinetEditor({ cabinet, onUpdate, onClose }: CabinetEditorProps) {
  const [dimensions, setDimensions] = useState({
    width: cabinet.width,
    height: cabinet.height,
    depth: cabinet.depth,
  });
  const { toast } = useToast();

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDimensions((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSave = () => {
    onUpdate({ ...cabinet, ...dimensions });
    toast({
      title: 'Gabinete Actualizado',
      description: 'Las dimensiones del gabinete han sido guardadas.',
    });
  };
  
  const handleComingSoon = () => {
    toast({
        title: '¡Próximamente!',
        description: 'Esta función está en desarrollo.',
    });
  }

  return (
    <Dialog open={!!cabinet} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Gabinete</DialogTitle>
          <DialogDescription>
            Modifica las dimensiones y propiedades del gabinete. Nota: cambiar las dimensiones aún no actualiza la lista de corte.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              Ancho
            </Label>
            <Input
              id="width"
              name="width"
              type="number"
              value={dimensions.width}
              onChange={handleDimensionChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">
              Alto
            </Label>
            <Input
              id="height"
              name="height"
              type="number"
              value={dimensions.height}
              onChange={handleDimensionChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="depth" className="text-right">
              Profundidad
            </Label>
            <Input
              id="depth"
              name="depth"
              type="number"
              value={dimensions.depth}
              onChange={handleDimensionChange}
              className="col-span-3"
            />
          </div>
        </div>
        
        <Separator />

        <div className="space-y-4">
            <h4 className="font-medium text-center">Personalizar Componentes</h4>
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleComingSoon}>
                    <Archive className="w-6 h-6" />
                    <span>Añadir Cajones</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleComingSoon}>
                    <PlusSquare className="w-6 h-6" />
                    <span>Cambiar Puertas</span>
                </Button>
            </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
