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
import { PanelLeft, PanelRight } from 'lucide-react';

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

  const selectInstanceAndOpenSheet = (id: string | null) => {
    setSelectedInstanceId(id);
    if (id && isMobile) {
        setRightSheetOpen(true);
    }
  }

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
              onSelectInstance={setSelectedInstanceId}
              onUpdateTransform={handleUpdateCabinetTransform}
              onRemoveCabinet={removeCabinet}
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
              onSelectInstance={setSelectedInstanceId}
          />
        </div>
      </div>
    </div>
  );
}
