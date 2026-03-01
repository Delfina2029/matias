'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { PlacedCabinet, Appearance } from '@/lib/types';
import { cabinetData } from '@/lib/cabinets';
import { Button } from './ui/button';
import { Trash2, X, Image as ImageIcon, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { renderKitchen } from '@/ai/flows/render-kitchen-flow';
import { useToast } from '@/hooks/use-toast';


export function KitchenLayout(props: KitchenLayoutProps) {
  const { 
    placedCabinets, 
    onClearLayout, 
    onRemoveCabinet,
    onSelectCabinet,
    selectedCabinetId,
    appearance
  } = props;
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const { toast } = useToast();

  const handleRender = async () => {
    if (placedCabinets.length === 0) {
        toast({
            variant: "destructive",
            title: "No hay gabinetes",
            description: "Añade al menos un gabinete al diseño antes de renderizar.",
        });
        return;
    }
    
    setIsRendering(true);
    setImageUrl(null);

    try {
        const payload = {
            appearance,
            placedCabinets: placedCabinets.map(cab => ({
                cabinetId: cab.cabinetId,
                type: cab.type,
                width: cab.width,
                height: cab.height,
            })),
        };

        const result = await renderKitchen(payload);
        setImageUrl(result.imageUrl);
        toast({
            title: "¡Renderizado completo!",
            description: "La vista previa de tu cocina ha sido generada.",
        });
    } catch (error) {
        console.error("AI rendering failed:", error);
        toast({
            variant: "destructive",
            title: "Error al renderizar",
            description: "No se pudo generar la imagen. Por favor, inténtalo de nuevo.",
        });
    } finally {
        setIsRendering(false);
    }
  };

  const handleClear = () => {
    onClearLayout();
    setImageUrl(null);
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm min-w-0">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-headline">Vista Previa Fotorrealista (IA)</h2>
        <div className="flex items-center space-x-2">
            <Button onClick={handleRender} disabled={isRendering}>
                {isRendering ? <Loader2 className="animate-spin" /> : <Wand2 />}
                <span>Generar Vista Previa</span>
            </Button>
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleClear} aria-label="Limpiar Diseño">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpiar todo el diseño</p>
              </TooltipContent>
            </Tooltip>
            </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-px bg-border overflow-hidden">
        {/* Image Viewer */}
        <div className="flex-1 relative bg-muted/20 flex items-center justify-center p-4 overflow-hidden">
          {isRendering && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Generando tu cocina con IA... (puede tardar un minuto)</p>
            </div>
          )}
          {imageUrl ? (
             <div className="relative w-full h-full rounded-md overflow-hidden shadow-inner">
                <Image 
                    src={imageUrl} 
                    alt="Vista previa de la cocina generada por IA" 
                    fill
                    style={{ objectFit: 'contain' }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
                <ImageIcon className="mx-auto w-16 h-16 mb-4" />
                <h3 className="font-semibold text-lg">Tu cocina aparecerá aquí</h3>
                <p className="text-sm max-w-sm mx-auto">Añade gabinetes, elige tus colores y luego haz clic en "Generar Vista Previa" para que la IA cree una imagen fotorrealista de tu diseño.</p>
            </div>
          )}
        </div>
        
        {/* Scene Contents */}
        <div className="bg-background flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Contenido del Diseño</h3>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {placedCabinets.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Añade gabinetes desde el panel de la izquierda para empezar.</p>
                    ) : (
                        placedCabinets.map(placed => {
                            const cabinetInfo = cabinetData.find(c => c.id === placed.cabinetId);
                            return (
                                <Card 
                                    key={placed.instanceId}
                                    className={cn(
                                        "hover:shadow-md transition-shadow",
                                        selectedCabinetId === placed.instanceId && 'ring-2 ring-accent'
                                    )}
                                >
                                    <CardContent className="p-3 flex items-center justify-between gap-2">
                                        {cabinetInfo && <cabinetInfo.icon className="w-8 h-8 text-primary shrink-0" />}
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-medium truncate">{cabinetInfo?.name || placed.cabinetId}</p>
                                            <p className="text-xs text-muted-foreground">{placed.width}x{placed.height}x{placed.depth}mm</p>
                                        </div>
                                        <div className="flex items-center">
                                            <Button variant="ghost" size="sm" onClick={() => onSelectCabinet(placed.instanceId)}>Editar</Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-8 h-8 text-destructive/80 hover:text-destructive"
                                                onClick={() => onRemoveCabinet(placed.instanceId)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// KitchenLayoutProps needs to be defined
interface KitchenLayoutProps {
  placedCabinets: PlacedCabinet[];
  onUpdateLayout: React.Dispatch<React.SetStateAction<PlacedCabinet[]>>;
  onClearLayout: () => void;
  onRemoveCabinet: (instanceId: string) => void;
  onSelectCabinet: (instanceId: string | null) => void;
  selectedCabinetId?: string | null;
  appearance: Appearance;
}
