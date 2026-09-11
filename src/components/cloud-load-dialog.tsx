import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Trash2, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Design {
  id: string;
  name: string;
  placedCabinets: any[];
  appearance: any;
  prices: any;
  updatedAt: string;
  isLocal?: boolean;
}

interface CloudLoadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadDesign: (design: Design) => void;
}

const LOCAL_DESIGNS_KEY = 'nidel_kitchen_designs';

function getLocalDesigns(): Design[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_DESIGNS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map((d: any) => ({ ...d, isLocal: true }));
  } catch {
    return [];
  }
}

function removeLocalDesign(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_DESIGNS_KEY);
    const designs = raw ? JSON.parse(raw) : [];
    const filtered = designs.filter((d: any) => d.id !== id);
    localStorage.setItem(LOCAL_DESIGNS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error removing local design:', e);
  }
}

export function CloudLoadDialog({
  isOpen,
  onOpenChange,
  onLoadDesign,
}: CloudLoadDialogProps) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDesigns = async () => {
    setIsLoading(true);
    const localDesigns = getLocalDesigns();
    const map = new Map<string, Design>();

    // Add local designs first
    localDesigns.forEach((d) => {
      map.set(d.name.toLowerCase(), d);
    });

    try {
      const q = query(
        collection(db, 'kitchen-designs'),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const designName = (data.name || 'Sin nombre').trim();
        const existing = map.get(designName.toLowerCase());
        const cloudUpdatedAt = data.updatedAt || new Date().toISOString();

        if (!existing || new Date(cloudUpdatedAt) >= new Date(existing.updatedAt)) {
          map.set(designName.toLowerCase(), {
            id: docSnap.id,
            name: designName,
            placedCabinets: data.placedCabinets || [],
            appearance: data.appearance || {},
            prices: data.prices || {},
            updatedAt: cloudUpdatedAt,
            isLocal: false,
          });
        }
      });
    } catch (error) {
      console.warn('Firestore designs fetch unavailable, displaying locally saved designs:', error);
    } finally {
      const sorted = Array.from(map.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setDesigns(sorted);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDesigns();
    }
  }, [isOpen]);

  const handleDelete = async (design: Design, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Estás seguro de que quieres eliminar el diseño "${design.name}"?`)) {
      return;
    }

    setIsDeleting(design.id);
    try {
      // Remove from local storage
      removeLocalDesign(design.id);

      // Remove from Firestore if not only local
      if (!design.id.startsWith('local-')) {
        try {
          await deleteDoc(doc(db, 'kitchen-designs', design.id));
        } catch (e) {
          console.warn('Could not delete from Firestore:', e);
        }
      }

      toast({
        title: 'Diseño Eliminado',
        description: `El diseño "${design.name}" ha sido eliminado.`,
      });
      setDesigns((prev) => prev.filter((d) => d.id !== design.id));
    } catch (error) {
      console.error('Error deleting design:', error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el diseño.',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cargar Diseño Guardado</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto my-4 min-h-[200px] max-h-[50vh] pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground text-sm">Cargando diseños...</p>
            </div>
          ) : designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/60 mb-2" />
              <p className="text-muted-foreground text-sm font-medium">No hay diseños guardados</p>
              <p className="text-muted-foreground text-xs">Usa el botón "Guardar" para empezar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {designs.map((design) => (
                <div
                  key={design.id}
                  onClick={() => {
                    onLoadDesign(design);
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 hover:bg-accent/40 cursor-pointer transition-all duration-150"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-sm text-foreground truncate">{design.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Modificado: {formatDate(design.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isDeleting === design.id}
                      onClick={(e) => handleDelete(design, e)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      {isDeleting === design.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
