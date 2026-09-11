'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PlacedCabinet, CabinetComponent, Appearance, MaterialPrices } from '@/lib/types';
import { KitchenLayout } from './kitchen-layout';
import { cabinetData } from '@/lib/cabinets';
import { EditorSidebar } from './editor-sidebar';
import { CabinetSelector } from './cabinet-selector';
import { Header } from '@/components/layout/header';
import { MaterialsEditor } from './materials-editor';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelRight, Sparkles, Loader2, CloudUpload, CloudDownload, ChevronDown, Settings } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { renderKitchen } from '@/ai/flows/render-kitchen-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { CloudSaveDialog } from './cloud-save-dialog';
import { CloudLoadDialog } from './cloud-load-dialog';

function migrateCabinets(cabs: PlacedCabinet[]): PlacedCabinet[] {
  return cabs.map(cab => {
    let components = cab.components;
    let position = cab.position;
    let updated = false;

    if (cab.cabinetId === 'vanity-hanging-1d1o') {
      const hasOpeningAtBottom = cab.components[0]?.type === 'opening';
      if (!hasOpeningAtBottom) {
        components = [
          { id: '1', type: 'opening', height: 260 },
          { id: '2', type: 'drawer', height: 170 }
        ];
        updated = true;
      }
      
      // Migrate elevation Y
      const correctY = 0.57 + ((cab.height / 1000) * 1.5) / 2; // 0.57 + visualHeight / 2
      if (Math.abs(cab.position[1] - correctY) > 0.05 && cab.position[1] < correctY) {
        position = [cab.position[0], correctY, cab.position[2]];
        updated = true;
      }
    } else if (cab.cabinetId === 'vanity-hanging-2d') {
      const hasOpeningAtBottom = cab.components[0]?.type === 'opening';
      if (!hasOpeningAtBottom) {
        components = [
          { id: '1', type: 'opening', height: 120 },
          { id: '2', type: 'drawer', height: 170 },
          { id: '3', type: 'drawer', height: 170 }
        ];
        updated = true;
      }
      
      // Migrate elevation Y
      const correctY = 0.57 + ((cab.height / 1000) * 1.5) / 2;
      if (Math.abs(cab.position[1] - correctY) > 0.05 && cab.position[1] < correctY) {
        position = [cab.position[0], correctY, cab.position[2]];
        updated = true;
      }
    } else if (cab.cabinetId === 'base-3c') {
      // ==============================================================
      // LOCKED BY USER REQUEST: bajo004
      // Force 305, 305, 200 drawer configuration for old state
      // ==============================================================
      const isTopSmall = cab.components[2]?.height === 200;
      if (!isTopSmall) {
        components = [
          { id: cab.components[0]?.id || 'b3c-1', type: 'drawer', height: 305, drawerBoxHeight: 150 },
          { id: cab.components[1]?.id || 'b3c-2', type: 'drawer', height: 305, drawerBoxHeight: 150 },
          { id: cab.components[2]?.id || 'b3c-3', type: 'drawer', height: 200, drawerBoxHeight: 100 }
        ];
        updated = true;
      }
    }

    if (updated) {
      return {
        ...cab,
        components,
        position
      };
    }
    return cab;
  });
}

export function KitchenBuilder({ onBackToMenu }: { onBackToMenu?: () => void }) {
  const [placedCabinets, setPlacedCabinets] = useState<PlacedCabinet[]>([]);

  const handlePlacedCabinetsChange = useCallback((newCabinets: PlacedCabinet[]) => {
    setPlacedCabinets(newCabinets);
    if (typeof window !== 'undefined') {
        localStorage.setItem('kitchenBuilderCabinets', JSON.stringify(newCabinets));
    }
  }, []);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'plan' | '2d' | '3d' | 'technical'>('2d');
  const [hoveredPieceName, setHoveredPieceName] = useState<string | null>(null);

  const [appearance, setAppearance] = useState<Appearance>({
    frontColor: '#CDAC80',
    frontColorName: 'Camelia de Faplac',
    carcassColor: '#CDAC80',
    carcassColorName: 'Camelia de Faplac',
    countertopColor: '#343a40',
    countertopColorName: 'Granito Negro',
    frontStyle: 'overlay',
  });

  const handleAppearanceChange = useCallback((newAppearance: Appearance) => {
    setAppearance(newAppearance);
    if (typeof window !== 'undefined') {
        localStorage.setItem('kitchenBuilderAppearance', JSON.stringify(newAppearance));
    }
  }, []);

  const isMobile = useIsMobile();
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [rightSheetOpen, setRightSheetOpen] = useState(false);

  // New state for AI rendering
  const [isRendering, setIsRendering] = useState(false);
  const [renderResultUrl, setRenderResultUrl] = useState<string | null>(null);
  const [isRenderDialogOpen, setIsRenderDialogOpen] = useState(false);
  const { toast } = useToast();

  const [isSaveCloudOpen, setIsSaveCloudOpen] = useState(false);
  const [isLoadCloudOpen, setIsLoadCloudOpen] = useState(false);

  const handleLoadDesign = (design: any) => {
    setPlacedCabinets(migrateCabinets(design.placedCabinets || []));
    setAppearance(design.appearance || {
      frontColor: '#CDAC80',
      frontColorName: 'Camelia de Faplac',
      carcassColor: '#CDAC80',
      carcassColorName: 'Camelia de Faplac',
      countertopColor: '#343a40',
      countertopColorName: 'Granito Negro',
      frontStyle: 'overlay',
    });
    setPrices(design.prices || {
      melaminaPlaca: 99257,
      melaminaWidth: 1830,
      melaminaHeight: 2750,
      corteMelamina: 140,
      cantosPegados: 1200,
      mdf3mmPlaca: 35000,
      mdfWidth: 1830,
      mdfHeight: 2750,
      bisagraEstandar: 1200,
      bisagraCodo9: 1500,
      bisagraEsquinero: 2500,
      correderaPar: 4500,
      tirador: 1800,
      pataMueble: 800,
      pistonGas: 2500,
      soporteEstante: 100,
      barralPlacar: 3000,
      bisagraCierreSuave0: 1500,
      bisagraCierreSuave9: 1800,
      bisagraCierreSuave15: 2500,
      correderaTelescopica300: 4000,
      correderaTelescopica350: 4500,
      correderaTelescopica400: 5000,
      correderaTelescopica450: 5500,
      correderaTelescopica500: 6000,
      pataCuadrada10cm: 800,
      perfilJ: 3500,
      tapaTornillo: 10,
      cantoPreencolado: 800,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('kitchenBuilderCabinets', JSON.stringify(design.placedCabinets || []));
      localStorage.setItem('kitchenBuilderAppearance', JSON.stringify(design.appearance));
      localStorage.setItem('kitchenBuilderPrices', JSON.stringify(design.prices));
    }
  };
  
  // Pricing state
  const [isMaterialsEditorOpen, setIsMaterialsEditorOpen] = useState(false);
  const [prices, setPrices] = useState<MaterialPrices>({
    melaminaPlaca: 99257,
    melaminaWidth: 1830,
    melaminaHeight: 2750,
    corteMelamina: 140,
    cantosPegados: 1200,
    mdf3mmPlaca: 35000,
    mdfWidth: 1830,
    mdfHeight: 2750,
    bisagraEstandar: 1200,
    bisagraCodo9: 1500,
    bisagraEsquinero: 2500,
    correderaPar: 4500,
    tirador: 1800,
    pataMueble: 800,
    pistonGas: 2500,
    soporteEstante: 100,
    barralPlacar: 3000,
    bisagraCierreSuave0: 1500,
    bisagraCierreSuave9: 1800,
    bisagraCierreSuave15: 2500,
    correderaTelescopica300: 4000,
    correderaTelescopica350: 4500,
    correderaTelescopica400: 5000,
    correderaTelescopica450: 5500,
    correderaTelescopica500: 6000,
    pataCuadrada10cm: 800,
    perfilJ: 3500,
    tapaTornillo: 10,
    cantoPreencolado: 800,
  });

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedPrices = localStorage.getItem('kitchenBuilderPrices');
        if (savedPrices) {
            try {
                setPrices((prev: MaterialPrices) => ({ ...prev, ...JSON.parse(savedPrices) }));
            } catch (e) {
                console.error('Failed to load prices', e);
            }
        }
        
        const savedApp = localStorage.getItem('kitchenBuilderAppearance');
        if (savedApp) {
            try {
                setAppearance((prev: Appearance) => ({ ...prev, ...JSON.parse(savedApp) }));
            } catch (e) {
                console.error('Failed to load appearance', e);
            }
        }

        const savedCabinets = localStorage.getItem('kitchenBuilderCabinets');
        if (savedCabinets) {
            try {
                setPlacedCabinets(migrateCabinets(JSON.parse(savedCabinets)));
            } catch (e) {
                console.error('Failed to load cabinets', e);
            }
        }
    }
  }, []);

  const handleSavePrices = (newPrices: MaterialPrices) => {
    setPrices(newPrices);
    if (typeof window !== 'undefined') {
        localStorage.setItem('kitchenBuilderPrices', JSON.stringify(newPrices));
    }
    toast({
      title: 'Precios Actualizados',
      description: 'Los nuevos precios se aplicarán a todas las cotizaciones.',
    });
  };

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
    if (id) {
        if (isMobile) {
            setRightSheetOpen(true);
        }
    } else {
        // If nothing is selected, we can't be in technical view
        if (viewMode === 'technical') {
            setViewMode('2d');
        }
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
    const cabinetWidthM = cabinetInfo.width / 1000;
    const isCorner = cabinetInfo.id === 'base-corner';
    const effectiveDepthM = (isCorner ? (cabinetInfo.width2 || cabinetInfo.width) : cabinetInfo.depth) / 1000;

    const visualWidthM = cabinetWidthM * SCALE;
    const visualDepthM = effectiveDepthM * SCALE;
    const visualHeightM = cabinetHeightM * SCALE;

    // Use a small safety gap (2mm) to ensure we never overlap with the wall volume
    const SAFETY_GAP = 0.002;

    // Calculate initial position based on existing cabinets or corner walls
    let initialX = (visualWidthM / 2) + SAFETY_GAP;
    let initialZ = (visualDepthM / 2) + SAFETY_GAP;
    const initialY = cabinetInfo.type === 'wall' 
      ? 1.5 + (visualHeightM / 2) 
      : cabinetInfo.id.startsWith('vanity-hanging')
        ? 0.57 + (visualHeightM / 2)
        : (visualHeightM / 2);

    if (placedCabinets.length > 0) {
        // Try to place it next to the last cabinet along the X axis if possible
        const last = placedCabinets[placedCabinets.length - 1];
        const lastInfo = cabinetData.find(c => c.id === last.cabinetId);
        const lastWidthM = (lastInfo?.width || 600) / 1000;
        
        // If last cabinet is also along the back wall, place this one to its right
        initialX = last.position[0] + (lastWidthM * SCALE / 2) + (visualWidthM / 2);
        initialZ = last.position[2]; // Keep same depth alignment
    }

    const newCabinet: PlacedCabinet = {
      cabinetId,
      instanceId: `cab_${Date.now()}_${Math.random()}`,
      type: cabinetInfo.type,
      position: [initialX, initialY, initialZ],
      rotation: [0, 0, 0],
      width: cabinetInfo.width,
      height: cabinetInfo.height,
      depth: cabinetInfo.depth,
      depth2: cabinetInfo.depth2,
      components: defaultComponents,
      useLegs: (cabinetInfo.type === 'base' || cabinetInfo.type === 'tall' || cabinetInfo.type === 'placar') && !cabinetId.includes('hanging'),
    };
    handlePlacedCabinetsChange([...placedCabinets, newCabinet]);
    selectInstanceAndOpenSheet(newCabinet.instanceId);
  };

  const addCustomCabinet = (customData: any) => {
    const SCALE = 1.5;

    const cabinetHeightM = customData.height / 1000;
    const cabinetWidthM = customData.width / 1000;
    const effectiveDepthM = customData.depth / 1000;

    const visualWidthM = cabinetWidthM * SCALE;
    const visualDepthM = effectiveDepthM * SCALE;
    const visualHeightM = cabinetHeightM * SCALE;

    const SAFETY_GAP = 0.002;

    let initialX = (visualWidthM / 2) + SAFETY_GAP;
    let initialZ = (visualDepthM / 2) + SAFETY_GAP;
    const initialY = customData.type === 'wall' 
      ? 1.5 + (visualHeightM / 2) 
      : (visualHeightM / 2);

    if (placedCabinets.length > 0) {
        const last = placedCabinets[placedCabinets.length - 1];
        const lastInfo = cabinetData.find(c => c.id === last.cabinetId);
        const lastWidthM = (lastInfo?.width || 600) / 1000;
        
        initialX = last.position[0] + (lastWidthM * SCALE / 2) + (visualWidthM / 2);
        initialZ = last.position[2];
    }

    const newCabinet: PlacedCabinet = {
      cabinetId: customData.cabinetId,
      instanceId: `cab_${Date.now()}_${Math.random()}`,
      type: customData.type,
      position: [initialX, initialY, initialZ],
      rotation: [0, 0, 0],
      width: customData.width,
      height: customData.height,
      depth: customData.depth,
      components: customData.components.map((c: any, i: number) => ({
         ...c,
         id: `comp_${Date.now()}_${i}`
      })),
      useLegs: customData.type === 'base' || customData.type === 'tall' || customData.type === 'placar',
    };
    handlePlacedCabinetsChange([...placedCabinets, newCabinet]);
    selectInstanceAndOpenSheet(newCabinet.instanceId);
  };
  
  const handleUpdateCabinet = (updatedCabinet: PlacedCabinet) => {
    const updated = placedCabinets.map((c) =>
        c.instanceId === updatedCabinet.instanceId ? updatedCabinet : c
    );
    handlePlacedCabinetsChange(updated);
  };

  const handleAddComponent = useCallback((instanceId: string, component: any) => {
    setPlacedCabinets(prev => {
        const updated = prev.map(cab => {
            if (cab.instanceId === instanceId) {
                return { ...cab, components: [...cab.components, component] };
            }
            return cab;
        });
        if (typeof window !== 'undefined') localStorage.setItem('kitchenBuilderCabinets', JSON.stringify(updated));
        return updated;
    });
  }, []);
  
  const handleUpdateCabinetTransform = useCallback((instanceId: string, newTransform: { position: [number, number, number], rotation: [number, number, number] }) => {
    setPlacedCabinets(prev => {
        const updated = prev.map(cab => 
            cab.instanceId === instanceId ? { ...cab, ...newTransform } : cab
        );
        if (typeof window !== 'undefined') localStorage.setItem('kitchenBuilderCabinets', JSON.stringify(updated));
        return updated;
    });
  }, []);


  const clearLayout = () => {
    handlePlacedCabinetsChange([]);
    setSelectedInstanceId(null);
  };

  const removeCabinet = useCallback((instanceId: string) => {
    setPlacedCabinets((prev) => {
        const updated = prev.filter((c) => c.instanceId !== instanceId);
        if (typeof window !== 'undefined') localStorage.setItem('kitchenBuilderCabinets', JSON.stringify(updated));
        return updated;
    });
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

  const addCustomCabinetAndCloseSheet = (customData: any) => {
    addCustomCabinet(customData);
    if (isMobile) {
        setLeftSheetOpen(false);
    }
  };


  if (isMobile) {
    return (
        <div className="flex flex-col h-screen overflow-hidden app-bg">
            <Header onOpenMaterials={() => setIsMaterialsEditorOpen(true)} onBackToMenu={onBackToMenu}>
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
                            <CabinetSelector onSelectCabinet={addCabinetAndCloseSheet} onAddCustomCabinet={addCustomCabinetAndCloseSheet} />
                        </SheetContent>
                    </Sheet>

                    <h1 className="text-lg font-bold text-foreground">
                        Constructor de Cocinas
                    </h1>

                    <div className="flex items-center gap-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="w-9 h-9">
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            <span className="sr-only">Opciones de nube</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setIsSaveCloudOpen(true)} className="gap-2 cursor-pointer">
                            <CloudUpload className="w-4 h-4" />
                            Guardar en la Nube
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsLoadCloudOpen(true)} className="gap-2 cursor-pointer">
                            <CloudDownload className="w-4 h-4" />
                            Cargar de la Nube
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsMaterialsEditorOpen(true)} className="gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            Materiales
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

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
                                onAppearanceChange={handleAppearanceChange}
                                onRemoveCabinet={removeCabinet}
                                onUpdateCabinet={handleUpdateCabinet}
                                onAddCabinet={addCabinet}
                                onAddCustomCabinet={addCustomCabinet}
                                selectedInstanceId={selectedInstanceId}
                                onSelectInstance={selectInstanceAndOpenSheet}
                                prices={prices}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                hoveredPieceName={hoveredPieceName}
                                onHoverPiece={setHoveredPieceName}
                            />
                        </SheetContent>
                      </Sheet>
                    </div>
                </div>
            </Header>

            <main className="flex-1 p-2 md:p-4 min-h-0">
                <KitchenLayout
                    placedCabinets={placedCabinets}
                    onClearLayout={clearLayout}
                    appearance={appearance}
                    selectedInstanceId={selectedInstanceId}
                    onSelectInstance={selectInstanceAndOpenSheet}
                    onUpdateTransform={handleUpdateCabinetTransform}
                    onRemoveCabinet={removeCabinet}
                    onGenerateRender={handleGenerateRender}
                    onAddComponent={handleAddComponent}
                    isRendering={isRendering}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    hoveredPieceName={hoveredPieceName}
                    onHoverPiece={setHoveredPieceName}
                />
            </main>

            <AlertDialog open={isRenderDialogOpen} onOpenChange={setIsRenderDialogOpen}>
                <AlertDialogContent className="w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
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

            <MaterialsEditor 
                isOpen={isMaterialsEditorOpen} 
                onOpenChange={setIsMaterialsEditorOpen} 
                prices={prices} 
                onSave={handleSavePrices} 
            />

            <CloudSaveDialog
                isOpen={isSaveCloudOpen}
                onOpenChange={setIsSaveCloudOpen}
                placedCabinets={placedCabinets}
                appearance={appearance}
                prices={prices}
            />
            <CloudLoadDialog
                isOpen={isLoadCloudOpen}
                onOpenChange={setIsLoadCloudOpen}
                onLoadDesign={handleLoadDesign}
            />
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden app-bg">
      <Header 
        onOpenMaterials={() => setIsMaterialsEditorOpen(true)} 
        onOpenSaveCloud={() => setIsSaveCloudOpen(true)}
        onOpenLoadCloud={() => setIsLoadCloudOpen(true)}
        onBackToMenu={onBackToMenu}
      />
      <div className="grid grid-cols-[320px_1fr_450px] gap-3 p-3 flex-1 min-h-0">
        <div className="h-full min-h-0 panel-premium">
          <CabinetSelector onSelectCabinet={addCabinet} onAddCustomCabinet={addCustomCabinet} />
        </div>
        <div className="h-full min-h-0 panel-premium">
          <KitchenLayout
              placedCabinets={placedCabinets}
              onClearLayout={clearLayout}
              appearance={appearance}
              selectedInstanceId={selectedInstanceId}
              onSelectInstance={selectInstanceAndOpenSheet}
              onUpdateTransform={handleUpdateCabinetTransform}
              onRemoveCabinet={removeCabinet}
              onGenerateRender={handleGenerateRender}
              onAddComponent={handleAddComponent}
              isRendering={isRendering}
              viewMode={viewMode}
              setViewMode={setViewMode}
              hoveredPieceName={hoveredPieceName}
              onHoverPiece={setHoveredPieceName}
          />
        </div>
        <div className="h-full min-h-0 flex flex-col overflow-hidden panel-premium">
          <EditorSidebar
              placedCabinets={placedCabinets}
              appearance={appearance}
              onAppearanceChange={handleAppearanceChange}
              onRemoveCabinet={removeCabinet}
              onUpdateCabinet={handleUpdateCabinet}
              onAddCabinet={addCabinet}
              onAddCustomCabinet={addCustomCabinet}
              selectedInstanceId={selectedInstanceId}
              onSelectInstance={selectInstanceAndOpenSheet}
              prices={prices}
              viewMode={viewMode}
              setViewMode={setViewMode}
              hoveredPieceName={hoveredPieceName}
              onHoverPiece={setHoveredPieceName}
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
      <MaterialsEditor 
        isOpen={isMaterialsEditorOpen} 
        onOpenChange={setIsMaterialsEditorOpen} 
        prices={prices} 
        onSave={handleSavePrices} 
      />
      <CloudSaveDialog
        isOpen={isSaveCloudOpen}
        onOpenChange={setIsSaveCloudOpen}
        placedCabinets={placedCabinets}
        appearance={appearance}
        prices={prices}
      />
      <CloudLoadDialog
        isOpen={isLoadCloudOpen}
        onOpenChange={setIsLoadCloudOpen}
        onLoadDesign={handleLoadDesign}
      />
    </div>
  );
}
