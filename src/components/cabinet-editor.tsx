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
      title: 'Cabinet Updated',
      description: 'The cabinet dimensions have been saved.',
    });
  };
  
  const handleComingSoon = () => {
    toast({
        title: 'Coming Soon!',
        description: 'This feature is under development.',
    });
  }

  return (
    <Dialog open={!!cabinet} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Cabinet</DialogTitle>
          <DialogDescription>
            Modify the dimensions and properties of the cabinet. Note: changing dimensions does not yet update the cutting list.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              Width
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
              Height
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
              Depth
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
            <h4 className="font-medium text-center">Customize Components</h4>
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleComingSoon}>
                    <Archive className="w-6 h-6" />
                    <span>Add Drawers</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleComingSoon}>
                    <PlusSquare className="w-6 h-6" />
                    <span>Change Doors</span>
                </Button>
            </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
