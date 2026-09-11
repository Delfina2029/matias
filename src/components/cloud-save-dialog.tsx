import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collection, addDoc, getDocs, query, where, limit, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CloudSaveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placedCabinets: any[];
  appearance: any;
  prices: any;
}

export function CloudSaveDialog({
  isOpen,
  onOpenChange,
  placedCabinets,
  appearance,
  prices,
}: CloudSaveDialogProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nombre requerido',
        description: 'Por favor ingresa un nombre para el diseño.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const designData = {
        name: name.trim(),
        placedCabinets,
        appearance,
        prices,
        updatedAt: new Date().toISOString(),
      };

      // Search for design with same name
      const q = query(
        collection(db, 'kitchen-designs'),
        where('name', '==', name.trim()),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDocId = querySnapshot.docs[0].id;
        await setDoc(doc(db, 'kitchen-designs', existingDocId), designData);
        toast({
          title: 'Diseño Actualizado',
          description: `El diseño "${name}" ha sido guardado exitosamente en la nube.`,
        });
      } else {
        await addDoc(collection(db, 'kitchen-designs'), designData);
        toast({
          title: 'Diseño Guardado',
          description: `El diseño "${name}" ha sido guardado exitosamente en la nube.`,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving design to Firestore:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo guardar el diseño en la nube. Revisa tu conexión a internet.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Guardar Diseño en la Nube</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="design-name">Nombre del Diseño</Label>
              <Input
                id="design-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Cocina de Melamina Roble"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-primary text-white hover:bg-primary/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
