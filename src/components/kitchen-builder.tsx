'use client';

import { useState, useCallback } from 'react';
import type { PlacedCabinet, CabinetComponent, Appearance } from '@/lib/types';
import { KitchenLayout } from './kitchen-layout';
import { cabinetData } from '@/lib/cabinets';
import { EditorSidebar } from './editor-sidebar';
import { CabinetSelector } from './cabinet-selector';
import { Header } from '@/components/layout/header';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelRight, Sparkles, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { renderKitchen } from '@/ai/flows/render-kitchen-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export function KitchenBuilder() {
  const [placedCabinets, setPlacedCabinets] = useState<PlacedCabinet[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const [appearance, setAppearance] = useState<Appearance>({
    frontColor: '#f8f9fa',
    carcassColor: '#e9ecef',
    countertopColor: '#343a40',
  });

  const isMobile = useIsMobile();
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [rightSheetOpen, setRightSheetOpen] = useState(false);

  // New state for AI rendering
  const [isRendering, setIsRendering] = useState(false);
  const [renderResultUrl, setRenderResultUrl] = useState<string | null>(null);
  const [isRenderDialogOpen, setIsRenderDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerateRender = async () => {
    if (placedCabinets.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Diseño Vacío',
        description: 'Añade al menos un gabinete para generar un render.',
      });
      return;
    }

    setIsRendering(true);
    try {
      const renderInput = {
        placedCabinets: placedCabinets.map(cab => ({
            cabinetId: cab.cabinetId,
            type: cab.type,
            width: cab.width,
            height: cab.height,
        })),
        appearance,
      };

      const result = await renderKitchen(renderInput);
      
      if (result.imageUrl) {
        setRenderResultUrl(result.imageUrl);
        setIsRenderDialogOpen(true);
        toast({
          title: '¡Render Generado!',
          description: 'La IA ha creado una imagen de tu cocina.',
        });
      } else {
        throw new Error('La IA no devolvió una imagen.');
      }

    } catch (error) {
      console.error("AI render failed:", error);
      toast({
        variant: 'destructive',
        title: 'Error de Renderizado',
        description: 'No se pudo generar la imagen. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsRendering(false);
    }
  };

  const selectInstanceAndOpenSheet = (id: string | null) => {
    setSelectedInstanceId(id);
    if (id && isMobile) {
        setRightSheetOpen(true);
    }
  }

  const addCabinet = (cabinetId: string) => {
    const cabinetInfo = cabinetData.find((c) => c.id === cabinetId);
    if (!cabinetInfo) return;

    const SCALE = 1.5; // Visual scale factor

    let defaultComponents: CabinetComponent[];

    if (cabinetInfo.defaultComponents) {
      defaultComponents = cabinetInfo.defaultComponents.map((comp, i) => ({
        ...comp,
        id: `comp_${Date.now()}_${i}_${Math.random()}`,
      }));
    } else {
      defaultComponents = cabinetInfo.pieces
        .filter(p => p.name.toLowerCase().includes('puerta'))
        .map((p, i) => ({
          id: `comp_${Date.now()}_${i}_${Math.random()}`,
          type: 'door',
          height: p.height
        }));
    }
    
    if (defaultComponents.length === 0 && cabinetId !== 'base-corner-900' && cabinetInfo.type !== 'placar') {
        defaultComponents.push({
            id: `comp_${Date.now()}_${Math.random()}`,
            type: 'door',
            height: cabinetInfo.height
        });
    }
    
    const cabinetHeightM = cabinetInfo.height / 1000;
    const cabinetDepthM = cabinetInfo.depth / 1000;


    const newCabinet: PlacedCabinet = {
      cabinetId,
      instanceId: `cab_${Date.now()}_${Math.random()}`,
      type: cabinetInfo.type,
      position: [
        -2, 
        cabinetInfo.type === 'wall' ? 1.5 : (cabinetHeightM * SCALE) / 2, 
        (cabinetDepthM * SCALE / 2)
      ],
      rotation: [0, 0, 0],
      width: cabinetInfo.width,
      height: cabinetInfo.height,
      depth: cabinetInfo.depth,
      depth2: cabinetInfo.depth2,
      components: defaultComponents,
    };
    setPlacedCabinets((prev) => [...prev, newCabinet]);
    selectInstanceAndOpenSheet(newCabinet.instanceId);
  };
  
  const handleUpdateCabinet = (updatedCabinet: PlacedCabinet) => {
    setPlacedCabinets((prev) =>
      prev.map((c) =>
        c.instanceId === updatedCabinet.instanceId ? updatedCabinet : c
      )
    );
  };
  
  const handleUpdateCabinetTransform = useCallback((instanceId: string, newTransform: { position: [number, number, number], rotation: [number, number, number] }) => {
    setPlacedCabinets(prev => 
        prev.map(cab => 
            cab.instanceId === instanceId ? { ...cab, ...newTransform } : cab
        )
    );
  }, []);


  const clearLayout = () => {
    setPlacedCabinets([]);
    setSelectedInstanceId(null);
  };

  const removeCabinet = useCallback((instanceId: string) => {
    setPlacedCabinets((prev) => prev.filter((c) => c.instanceId !== instanceId));
    if (selectedInstanceId === instanceId) {
        setSelectedInstanceId(null);
    }
  }, [selectedInstanceId]);

  const addCabinetAndCloseSheet = (cabinetId: string) => {
    addCabinet(cabinetId);
    if (isMobile) {
        setLeftSheetOpen(false);
    }
  };


  if (isMobile) {
    return (
        <div className="flex flex-col h-screen bg-background">
            <Header>
                <div className="flex items-center justify-between w-full">
                    <Sheet open={leftSheetOpen} onOpenChange={setLeftSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="w-9 h-9">
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Abrir selector de gabinetes</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-[320px]">
                            <SheetTitle className="sr-only">Selector de Gabinetes</SheetTitle>
                            <SheetDescription className="sr-only">Elige los gabinetes para añadir a tu diseño.</SheetDescription>
                            <CabinetSelector onSelectCabinet={addCabinetAndCloseSheet} />
                        </SheetContent>
                    </Sheet>

                    <h1 className="text-lg font-bold text-foreground">
                        Constructor de Cocinas
                    </h1>

                    <Sheet open={rightSheetOpen} onOpenChange={setRightSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="w-9 h-9">
                                <PanelRight className="h-5 w-5" />
                                <span className="sr-only">Abrir editor</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 w-[320px] max-w-[90vw]">
                             <SheetTitle className="sr-only">Panel de Edición</SheetTitle>
                            <SheetDescription className="sr-only">Edita las propiedades de los gabinetes, gestiona la lista de corte y ajusta la apariencia del diseño.</SheetDescription>
                            <EditorSidebar
                                placedCabinets={placedCabinets}
                                appearance={appearance}
                                onAppearanceChange={setAppearance}
                                onRemoveCabinet={removeCabinet}
                                onUpdateCabinet={handleUpdateCabinet}
                                onAddCabinet={addCabinet}
                                selectedInstanceId={selectedInstanceId}
                                onSelectInstance={selectInstanceAndOpenSheet}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </Header>

            <main className="flex-1 p-2 md:p-4 overflow-hidden">
                <KitchenLayout
                    placedCabinets={placedCabinets}
                    onClearLayout={clearLayout}
                    appearance={appearance}
                    selectedInstanceId={selectedInstanceId}
                    onSelectInstance={selectInstanceAndOpenSheet}
                    onUpdateTransform={handleUpdateCabinetTransform}
                    onRemoveCabinet={removeCabinet}
                    onGenerateRender={handleGenerateRender}
                    isRendering={isRendering}
                />
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="grid grid-cols-[320px_1fr_450px] gap-4 p-4 flex-1 overflow-hidden">
        <div className="h-full min-h-0">
          <CabinetSelector onSelectCabinet={addCabinet} />
        </div>
        <div className="h-full min-h-0">
          <KitchenLayout
              placedCabinets={placedCabinets}
              onClearLayout={clearLayout}
              appearance={appearance}
              selectedInstanceId={selectedInstanceId}
              onSelectInstance={selectInstanceAndOpenSheet}
              onUpdateTransform={handleUpdateCabinetTransform}
              onRemoveCabinet={removeCabinet}
              onGenerateRender={handleGenerateRender}
              isRendering={isRendering}
          />
        </div>
        <div className="h-full min-h-0">
          <EditorSidebar
              placedCabinets={placedCabinets}
              appearance={appearance}
              onAppearanceChange={setAppearance}
              onRemoveCabinet={removeCabinet}
              onUpdateCabinet={handleUpdateCabinet}
              onAddCabinet={addCabinet}
              selectedInstanceId={selectedInstanceId}
              onSelectInstance={selectInstanceAndOpenSheet}
          />
        </div>
      </div>
      <AlertDialog open={isRenderDialogOpen} onOpenChange={setIsRenderDialogOpen}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Render de Cocina Generado por IA</AlertDialogTitle>
            <AlertDialogDescription>
              Esta es una representación fotorrealista de tu diseño.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 rounded-lg overflow-hidden border">
            {renderResultUrl && (
              <Image src={renderResultUrl} alt="Render de cocina generado por IA" width={1200} height={800} className="w-full h-auto" />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
