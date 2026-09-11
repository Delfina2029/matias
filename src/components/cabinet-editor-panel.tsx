'use client';

import { useState, useEffect, useMemo } from 'react';
import type { PlacedCabinet, CabinetComponent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Plus, ArrowLeft, ArrowUp, ArrowDown, RailSymbol, DoorOpen, HardHat, Box, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cabinetData } from '@/lib/cabinets';
import { cn } from '@/lib/utils';
import { 
  calculateComponentDimensions, 
  calculateDrawerBoxDimensions,
  MELAMINE_THICKNESS as CABINET_MELAMINE_THICKNESS,
  GENERAL_GAP
} from '@/lib/cabinet-utils';
import { generatePiecesForCabinet } from '@/lib/cutting-logic';
import { TechnicalView2D } from './technical-view-2d';


import type { Appearance } from '@/lib/types';

type CabinetEditorPanelProps = {
  cabinet: PlacedCabinet;
  appearance: Appearance;
  onUpdate: (cabinet: PlacedCabinet) => void;
  onClose: () => void;
  viewMode: 'plan' | '2d' | '3d' | 'technical';
  setViewMode: (mode: 'plan' | '2d' | '3d' | 'technical') => void;
  hoveredPieceName: string | null;
  onHoverPiece: (name: string | null) => void;
};

type ActiveTool = 'drawer' | 'shelf' | 'door' | 'hanging-rail' | 'vertical-divider';


const MELAMINE_THICKNESS = 18;
const VISUAL_EDITOR_HEIGHT_PX = 400;

const typeLabels: Record<string, string> = {
    'opening': 'Hueco',
    'shelf': 'Estante',
    'drawer': 'Cajón',
    'door': 'Puerta',
    'hanging-rail': 'Barral'
};

export function CabinetEditorPanel({ 
    cabinet, 
    appearance,
    onUpdate, 
    onClose,
    viewMode,
    setViewMode,
    hoveredPieceName,
    onHoverPiece
}: CabinetEditorPanelProps) {
  const [dimensions, setDimensions] = useState<{
    width: number | '';
    width2: number | '';
    height: number | '';
    depth: number | '';
    depth2: number | '';
  }>({
    width: cabinet.width,
    width2: cabinet.width2 || cabinet.width,
    height: cabinet.height,
    depth: cabinet.depth,
    depth2: cabinet.depth2 || cabinet.depth,
  });

  const resolvedWidth = Number(dimensions.width) || cabinet.width;
  const resolvedWidth2 = Number(dimensions.width2) || cabinet.width2 || cabinet.width;
  const resolvedHeight = Number(dimensions.height) || cabinet.height;
  const resolvedDepth = Number(dimensions.depth) || cabinet.depth;
  const resolvedDepth2 = Number(dimensions.depth2) || cabinet.depth2 || cabinet.depth;
  const [useJProfileDiscounts, setUseJProfileDiscounts] = useState(cabinet.useJProfileDiscounts || false);
  const [useLegs, setUseLegs] = useState(cabinet.useLegs || false);
  const [hasInnerShelf, setHasInnerShelf] = useState(cabinet.hasInnerShelf || false);
  const [innerShelfHeights, setInnerShelfHeights] = useState<number[] | undefined>(cabinet.innerShelfHeights);
  const [shelfHeightsText, setShelfHeightsText] = useState(cabinet.innerShelfHeights ? cabinet.innerShelfHeights.join(', ') : '');
  const [invertSide, setInvertSide] = useState(cabinet.invertSide || false);
  const [rotation, setRotation] = useState<[number, number, number]>(cabinet.rotation || [0, 0, 0]);
  const [components, setComponents] = useState<CabinetComponent[]>(cabinet.components || []);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [selectedComponentPosition, setSelectedComponentPosition] = useState(0);
  const [positionInput, setPositionInput] = useState('');
  const [positionXInput, setPositionXInput] = useState('');
  const [activeDragTool, setActiveDragTool] = useState<ActiveTool | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
      setActiveDragTool(event.active.data.current?.type as ActiveTool);
  };

  const handleDragEnd = (event: DragEndEvent) => {
      setActiveDragTool(null);
      const { active, over } = event;
      
      if (over && over.data.current?.type === 'opening') {
          const toolType = active.data.current?.type as ActiveTool;
          const openingId = over.data.current?.id as string;
          addComponentInOpening(openingId, toolType);
          toast({ title: 'Componente Añadido', description: `Se ha añadido un ${typeLabels[toolType]} correctamente.`});
      }
  };

  const { toast } = useToast();
  const isCornerCabinet = cabinet.cabinetId === 'base-corner';
  const isPlacar = cabinet.type === 'placar';

  const cabinetInfo = useMemo(() => cabinetData.find(c => c.id === cabinet.cabinetId), [cabinet.cabinetId]);

  useEffect(() => {
    setDimensions({
        width: cabinet.width,
        width2: cabinet.width2 || cabinet.width,
        height: cabinet.height,
        depth: cabinet.depth,
        depth2: cabinet.depth2 || cabinet.depth,
    });
    setComponents(cabinet.components || []);
    setUseJProfileDiscounts(cabinet.useJProfileDiscounts || false);
    setUseLegs(cabinet.useLegs || false);
    setHasInnerShelf(cabinet.hasInnerShelf || false);
    setInnerShelfHeights(cabinet.innerShelfHeights);
    setShelfHeightsText(cabinet.innerShelfHeights ? cabinet.innerShelfHeights.join(', ') : '');
    setInvertSide(cabinet.invertSide || false);
    setRotation(cabinet.rotation || [0, 0, 0]);
    setSelectedComponentId(null);
  }, [cabinet]);

  useEffect(() => {
    if (selectedComponentId) {
      const index = components.findIndex(c => c.id === selectedComponentId);
      const isPlacarModule = cabinet.type === 'placar';
      // The base offset is the thickness of the cabinet's bottom panel.
      const baseOffset = isPlacarModule ? MELAMINE_THICKNESS : 0;
      
      if (index >= 0) {
        // Calculate position relative to the start of the component list.
        const positionInComponentList = components.slice(0, index).reduce((sum, c) => sum + c.height, 0);
        // Add the base offset to get the absolute position from the cabinet floor.
        const newPosition = positionInComponentList + baseOffset;
        setSelectedComponentPosition(newPosition);
        setPositionInput(String(Math.round(components[index].positionY !== undefined ? components[index].positionY! : newPosition)));
        setPositionXInput(String(Math.round(components[index].positionX || 0)));
      }
    } else {
        setPositionInput('');
        setPositionXInput('');
    }
  }, [selectedComponentId, components, cabinet.type]);

  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDimensions((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleHeightBlur = () => {
    const newHeight = resolvedHeight;
    const currentTotal = components.reduce((sum, c) => sum + c.height, 0);

    // Scale components to fill the new cabinet height
    if (currentTotal > 0 && Math.abs(newHeight - currentTotal) > 0.1) {
        const factor = newHeight / currentTotal;
        setComponents(prev => prev.map(c => ({
            ...c,
            height: Math.round(c.height * factor * 10) / 10
        })));
    }
  };
  
  const handleUpdateComponent = (id: string, newProps: Partial<CabinetComponent>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...newProps } : c));
  };

  const cabinetPieces = useMemo(() => {
    return generatePiecesForCabinet({ 
        ...cabinet, 
        width: resolvedWidth,
        width2: resolvedWidth2,
        height: resolvedHeight,
        depth: resolvedDepth,
        depth2: resolvedDepth2,
        components, 
        useJProfileDiscounts, 
        useLegs, 
        hasInnerShelf,
        innerShelfHeights,
        invertSide, 
        rotation 
    }, appearance);
  }, [cabinet, resolvedWidth, resolvedWidth2, resolvedHeight, resolvedDepth, resolvedDepth2, components, useJProfileDiscounts, useLegs, hasInnerShelf, innerShelfHeights, invertSide, rotation, appearance]);

  const handleSave = () => {
    onUpdate({ 
      ...cabinet, 
      width: resolvedWidth,
      width2: resolvedWidth2,
      height: resolvedHeight,
      depth: resolvedDepth,
      depth2: resolvedDepth2,
      components, 
      useJProfileDiscounts, 
      useLegs, 
      hasInnerShelf, 
      innerShelfHeights,
      invertSide, 
      rotation 
    });
    toast({
      title: 'Gabinete Actualizado',
      description: 'Los componentes del gabinete han sido guardados.',
    });
  };

  const placardGaps = useMemo(() => {
    if (!isPlacar) return [];
    
    // Get all shelves Y coordinates
    const shelves = components
      .filter(c => c.type === 'shelf')
      .map(c => Math.round(c.positionY || 0))
      .sort((a, b) => a - b);
      
    const bottomLimit = MELAMINE_THICKNESS; 
    const topLimit = resolvedHeight - MELAMINE_THICKNESS; 
    
    const boundaries = [bottomLimit, ...shelves, topLimit];
    const gaps: { start: number; end: number; height: number; name: string }[] = [];
    
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      
      const actualStart = i === 0 ? start : start + MELAMINE_THICKNESS;
      const actualEnd = end;
      const gapHeight = actualEnd - actualStart;
      
      if (gapHeight > 10) {
        let name = '';
        if (i === 0) name = 'Espacio Inferior';
        else if (i === boundaries.length - 2) name = 'Espacio Superior';
        else name = `Espacio Medio ${i}`;
        
        gaps.push({
          start: actualStart,
          end: actualEnd,
          height: gapHeight,
          name
        });
      }
    }
    
    return gaps;
  }, [components, resolvedHeight, isPlacar]);

  const handleAddDrawerInGap = (gap: { start: number; end: number; height: number }) => {
    const newComp: CabinetComponent = {
        id: Math.random().toString(36).substring(7),
        type: 'drawer',
        height: gap.height,
        positionY: gap.start,
    };
    
    const newComponents = [...components, newComp];
    setComponents(newComponents);
    onUpdate({
        ...cabinet,
        width: resolvedWidth,
        width2: resolvedWidth2,
        height: resolvedHeight,
        depth: resolvedDepth,
        depth2: resolvedDepth2,
        components: newComponents,
        useJProfileDiscounts,
        useLegs,
        hasInnerShelf,
        innerShelfHeights,
        invertSide,
        rotation
    });
    
    toast({
        title: 'Cajón Acomodado',
        description: `Se añadió un cajón de ${gap.height}mm en el espacio disponible.`,
    });
  };

  const handleAddShelfInGap = (gap: { start: number; end: number; height: number }) => {
    const shelfY = Math.round(gap.start + (gap.height / 2) - (MELAMINE_THICKNESS / 2));
    const newComp: CabinetComponent = {
        id: Math.random().toString(36).substring(7),
        type: 'shelf',
        height: MELAMINE_THICKNESS,
        positionY: shelfY,
    };
    
    const newComponents = [...components, newComp];
    setComponents(newComponents);
    onUpdate({
        ...cabinet,
        width: resolvedWidth,
        width2: resolvedWidth2,
        height: resolvedHeight,
        depth: resolvedDepth,
        depth2: resolvedDepth2,
        components: newComponents,
        useJProfileDiscounts,
        useLegs,
        hasInnerShelf,
        innerShelfHeights,
        invertSide,
        rotation
    });
    
    toast({
        title: 'Estante Añadido',
        description: `Se colocó un estante a una altura de ${shelfY}mm (mitad del hueco).`,
    });
  };

  const handleQuickAddPlacarComponent = (toolType: ActiveTool) => {
      let height = 18;
      let positionY = 400; // Default 400mm from bottom
      let positionX = undefined;

      if (toolType === 'drawer') {
          height = 200;
          positionY = 400;
      } else if (toolType === 'hanging-rail') {
          height = 30;
          positionY = resolvedHeight - 150; // Near top
      } else if (toolType === 'vertical-divider') {
          height = 400;
          positionY = 0; // Floor
          positionX = 0; // Left side default
      }

      const interiorWidth = resolvedWidth - (2 * CABINET_MELAMINE_THICKNESS);
      if (toolType === 'vertical-divider') {
          positionX = interiorWidth / 2; // Center
      }

      const newComp: CabinetComponent = {
          id: Math.random().toString(36).substring(7),
          type: toolType,
          height,
          positionY,
      };

      if (positionX !== undefined) {
          newComp.positionX = positionX;
      }

      const newComponents = [...components, newComp];
      setComponents(newComponents);
      onUpdate({ 
          ...cabinet, 
          width: resolvedWidth,
          width2: resolvedWidth2,
          height: resolvedHeight,
          depth: resolvedDepth,
          depth2: resolvedDepth2,
          components: newComponents, 
          useJProfileDiscounts, 
          useLegs, 
          hasInnerShelf, 
          innerShelfHeights,
          invertSide, 
          rotation 
      });
      
      toast({
          title: 'Componente Añadido',
          description: `Se añadió al placard. Seleccionalo en el 3D para ajustarlo.`
      });
  };

  const addComponentInOpening = (openingId: string, type: ActiveTool) => {
    const opening = components.find(c => c.id === openingId);
    if (!opening) return;

    let newCompHeight: number;
    if (type === 'shelf') {
        newCompHeight = MELAMINE_THICKNESS;
    } else if (type === 'hanging-rail') {
        newCompHeight = 80;
    } else { // drawer or door
        newCompHeight = Math.max(150, opening.height / 2);
    }
    
    if (opening.height < newCompHeight + 10) { // need at least 10mm of openings left
        toast({ variant: 'destructive', title: 'No hay suficiente espacio' });
        return;
    }

    setComponents(prev => {
        const openingIndex = prev.findIndex(c => c.id === openingId);
        if (openingIndex === -1) return prev;

        const currentOpening = prev[openingIndex];
        
        let newComp: CabinetComponent;
        const compId = `comp_${Date.now()}`;
        if (type === 'shelf') {
            newComp = { id: compId, type: 'shelf', height: MELAMINE_THICKNESS };
        } else if (type === 'hanging-rail') {
            newComp = { id: compId, type: 'hanging-rail', height: 80 };
        } else { // drawer or door
            const defaultHeight = Math.max(150, currentOpening.height / 2);
            newComp = { id: compId, type: type, height: defaultHeight };
        }

        if (currentOpening.height < newComp.height + 10) return prev;
        
        const remainingHeight = currentOpening.height - newComp.height;
        const opening1Height = remainingHeight / 2;
        const opening2Height = remainingHeight / 2;

        const newOpening1: CabinetComponent = { ...currentOpening, id: `comp_open_${Date.now()}_1`, height: opening1Height };
        const newOpening2: CabinetComponent = { ...currentOpening, id: `comp_open_${Date.now()}_2`, height: opening2Height };

        const newComponents = [...prev];
        
        newComponents.splice(openingIndex, 1, newOpening1, newComp, newOpening2);
        
        return newComponents.filter(c => c.height > 1); // Filter out tiny openings
    });
  };
  
  const handleDoorConfig = (doorCount: number) => {
    setSelectedComponentId(null);
    setActiveTool(null);
    const effectiveHeight = useLegs && cabinet.type === 'base' ? resolvedHeight - 100 : resolvedHeight;
    
    // For corner cabinets, doors always come in pairs (2 leaves forming the L shape)
    if (isCornerCabinet) {
        setComponents([{ id: `comp_${Date.now()}`, type: 'door', height: effectiveHeight, numDoors: 2 }]);
        return;
    }

    if (doorCount === 1) {
        setComponents([{ id: `comp_${Date.now()}`, type: 'door', height: effectiveHeight, numDoors: 1 }]);
    } else if (doorCount === 2) {
        if (cabinet.type === 'tall') return;
        setComponents([{ id: `comp_${Date.now()}`, type: 'door', height: effectiveHeight, numDoors: 2 }]);
    }
  };

  const handleStartWithDrawers = () => {
      setSelectedComponentId(null);
      setActiveTool(null);
      const effectiveHeight = useLegs && cabinet.type === 'base' ? resolvedHeight - 100 : resolvedHeight;
      setComponents([{ id: `comp_${Date.now()}`, type: 'opening', height: effectiveHeight }]);
      toast({ title: "Espacio Creado", description: "Ahora usa la barra de herramientas para añadir cajones."});
  };

  const handleUpdateComponentHeight = (id: string, newHeight: number) => {
    handleUpdateComponent(id, { height: newHeight });
  };

  const handleToggleJProfile = (id: string, enabled: boolean) => {
    setComponents(prev => prev.map(c => {
        if (c.id === id) {
            const { handle, ...rest } = c;
            if (enabled) {
                return { ...rest, handle: 'j-profile' as const };
            }
            return rest;
        }
        return c;
    }));
  };

  const handleRemoveComponent = (id: string) => {
    setComponents(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return prev;

        const componentToRemove = prev[index];
        const newComponents = [...prev];
        
        const prevComp = prev[index - 1];
        const nextComp = prev[index + 1];
        
        newComponents.splice(index, 1);

        // Merge adjacent openings if we removed a component
        if (prevComp?.type === 'opening' && nextComp?.type === 'opening') {
            const mergedOpeningHeight = prevComp.height + componentToRemove.height + nextComp.height;
            const mergedOpening: CabinetComponent = { ...prevComp, height: mergedOpeningHeight, id: `comp_open_${Date.now()}` };
            newComponents.splice(index - 1, 2, mergedOpening);
        } else if (prevComp?.type === 'opening') {
             const mergedOpeningHeight = prevComp.height + componentToRemove.height;
             const mergedOpening: CabinetComponent = { ...prevComp, height: mergedOpeningHeight, id: `comp_open_${Date.now()}` };
             newComponents.splice(index - 1, 1, mergedOpening);
        } else if (nextComp?.type === 'opening') {
             const mergedOpeningHeight = nextComp.height + componentToRemove.height;
             const mergedOpening: CabinetComponent = { ...nextComp, height: mergedOpeningHeight, id: `comp_open_${Date.now()}` };
             newComponents.splice(index, 1, mergedOpening);
        }

        if (newComponents.length === 0) {
            const effectiveHeight = useLegs && cabinet.type === 'base' ? resolvedHeight - 100 : resolvedHeight;
            return [{ id: `comp_open_${Date.now()}`, type: 'opening', height: effectiveHeight }];
        }

        return newComponents;
    });

    if (selectedComponentId === id) {
        setSelectedComponentId(null);
    }
  };

  const handleConvertToOpening = (id: string) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, type: 'opening' } : c));
    // Optional: merge if adjacent
    setTimeout(() => handleRemoveComponent('dummy_call_to_trigger_merging'), 0); // Not ideal but triggered by logic
    // Actually let's just do it cleanly:
    setComponents(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return prev;
        const newComps = prev.map(c => c.id === id ? { ...c, type: 'opening' as const } : c);
        
        // Merge check
        const finalComps: CabinetComponent[] = [];
        for (let i = 0; i < newComps.length; i++) {
            const current = newComps[i];
            const last = finalComps[finalComps.length - 1];
            if (last && last.type === 'opening' && current.type === 'opening') {
                last.height += current.height;
            } else {
                finalComps.push({ ...current });
            }
        }
        return finalComps;
    });
  };

  const handleMoveComponent = (index: number, direction: 'up' | 'down') => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= components.length) return;

      setComponents(prev => {
          const newComps = [...prev];
          const [moved] = newComps.splice(index, 1);
          newComps.splice(targetIndex, 0, moved);
          return newComps;
      });
  };
  
  const handleUpdateComponentPosition = (id: string, newPosition: number): boolean => {
    const index = components.findIndex(c => c.id === id);
    if (index === -1) {
      return false;
    }
  
    const isPlacarModule = cabinet.type === 'placar';
    const baseOffset = isPlacarModule ? MELAMINE_THICKNESS : 0;
    const targetPositionInComponentList = newPosition - baseOffset;
  
    if (targetPositionInComponentList < -0.1) {
      toast({
        variant: 'destructive',
        title: 'Posición no válida',
        description: 'La posición no puede ser menor que la base del mueble.',
      });
      return false;
    }
  
    if (isPlacarModule) {
        setComponents(prev => prev.map(c => c.id === id ? { ...c, positionY: newPosition } : c));
        return true;
    }

    const prevIndex = components.findIndex(c => c.id === id);
    if (prevIndex <= 0 || prevIndex >= components.length - 1) {
      return false;
    }
  
    const openingBefore = components[prevIndex - 1];
    const openingAfter = components[prevIndex + 1];
  
    if (openingBefore?.type !== 'opening' || openingAfter?.type !== 'opening') {
      toast({
        variant: 'destructive',
        title: 'Movimiento no válido',
        description: 'Se necesita espacio flexible (huecos) alrededor del componente para moverlo con precisión.',
      });
      return false;
    }
  
    const prevPositionInComponentList = components.slice(0, prevIndex).reduce((sum, c) => sum + c.height, 0);
    const targetPos = newPosition - baseOffset;
    const delta = targetPos - prevPositionInComponentList;
  
    const newBeforeHeight = openingBefore.height + delta;
    const newAfterHeight = openingAfter.height - delta;
  
    if (newBeforeHeight < 0 || newAfterHeight < 0) {
      toast({
        variant: 'destructive',
        title: 'Límite alcanzado',
        description: 'El movimiento excede el espacio disponible.',
      });
      return false;
    }
    
    setComponents(prev => {
        const newComponents = [...prev];
        const currentIndex = newComponents.findIndex(c => c.id === id);
        if (currentIndex <= 0 || currentIndex >= newComponents.length - 1) return prev;

        const currentOpeningBefore = newComponents[currentIndex - 1];
        const currentOpeningAfter = newComponents[currentIndex + 1];
        if (currentOpeningBefore?.type !== 'opening' || currentOpeningAfter?.type !== 'opening') return prev;

        const currentPrevPositionInComponentList = newComponents.slice(0, currentIndex).reduce((sum, c) => sum + c.height, 0);
        const currentTargetPos = newPosition - baseOffset;
        const currentDelta = currentTargetPos - currentPrevPositionInComponentList;
        
        const currentNewBeforeHeight = currentOpeningBefore.height + currentDelta;
        const currentNewAfterHeight = currentOpeningAfter.height - currentDelta;

        if (currentNewBeforeHeight < 0 || currentNewAfterHeight < 0) return prev;

        newComponents[currentIndex - 1] = { ...currentOpeningBefore, height: currentNewBeforeHeight };
        newComponents[currentIndex + 1] = { ...currentOpeningAfter, height: currentNewAfterHeight };

        return newComponents.filter(c => c.height > 0.1);
    });
    return true;
  };
  
  const effectiveCabinetHeight = useLegs && cabinet.type === 'base' ? resolvedHeight - 100 : resolvedHeight;
  const internalHeight = isPlacar ? effectiveCabinetHeight - (2 * CABINET_MELAMINE_THICKNESS) : effectiveCabinetHeight;
  
  const hasGlobalHorizontalDoors = cabinet.type !== 'tall' && !cabinet.cabinetId.startsWith('vanity') && components.length > 1 && components.every(c => c.type === 'door');
  
  const totalComponentsHeight = useMemo(() => {
    if (hasGlobalHorizontalDoors) {
        // For horizontal doors, they all share the same vertical space (usually full height)
        return Math.max(...components.map(c => c.height), 0);
    }
    return components.reduce((sum, c) => sum + c.height, 0);
  }, [components, hasGlobalHorizontalDoors]);

  const remainingHeight = internalHeight - totalComponentsHeight;

  const selectedComponent = components.find(c => c.id === selectedComponentId);


  const selectedDrawerPieces = useMemo(() => {
    if (!selectedComponent || selectedComponent.type !== 'drawer') {
      return [];
    }

    const width = resolvedWidth;
    const depth = resolvedDepth;
    const height = resolvedHeight;
    const pieces: { name: string, dimensions: string, quantity: number }[] = [];
    const interiorWidth = width - (2 * CABINET_MELAMINE_THICKNESS);
    const compIndex = components.findIndex(c => c.id === selectedComponent.id);

    // Use unified utility for front dimensions
    const front = calculateComponentDimensions(
        cabinet.type, 
        cabinet.cabinetId, 
        selectedComponent, 
        compIndex, 
        width,
        1,
        useJProfileDiscounts,
        useLegs,
        appearance.frontStyle,
        height
    );

    pieces.push({
      name: front.name,
      dimensions: `${front.height.toFixed(1)} x ${front.width.toFixed(1)} mm`,
      quantity: 1,
    });

    // Use unified utility for drawer box
    const box = calculateDrawerBoxDimensions(
        cabinet.type,
        cabinet.cabinetId,
        interiorWidth,
        depth,
        compIndex === 0, // Assuming index 0 is top
        useLegs
    );

    if (box.type === 'u-shape') {
        pieces.push({
            name: 'Lateral de Cajón Vanitory',
            dimensions: `${box.height.toFixed(1)} x ${box.depth.toFixed(1)} mm`,
            quantity: 4,
        });
        pieces.push({
            name: 'Frente Interno Cajón Vanitory',
            dimensions: `${box.height.toFixed(1)} x ${box.width.toFixed(1)} mm`,
            quantity: 1,
        });
        pieces.push({
            name: 'Trasero de Cajón Vanitory (Lado)',
            dimensions: `${box.height.toFixed(1)} x ${box.sideBoxInnerWidth?.toFixed(1)} mm`,
            quantity: 2,
        });
        pieces.push({
            name: 'Trasero de Cajón Vanitory (Centro)',
            dimensions: `${box.height.toFixed(1)} x ${box.plumbingGap?.toFixed(1)} mm`,
            quantity: 1,
        });
        pieces.push({
            name: 'Fondo de Cajón Vanitory',
            dimensions: `${(box.depth - CABINET_MELAMINE_THICKNESS).toFixed(1)} x ${box.sideBoxInnerWidth?.toFixed(1)} mm`,
            quantity: 2,
        });
    } else {
        pieces.push({
            name: 'Lateral de Cajón',
            dimensions: `${box.height.toFixed(1)} x ${box.depth.toFixed(1)} mm`,
            quantity: 2,
        });
        pieces.push({
            name: 'Frente/Trasero de Cajón',
            dimensions: `${box.height.toFixed(1)} x ${(box.width - (2 * CABINET_MELAMINE_THICKNESS)).toFixed(1)} mm`,
            quantity: 2,
        });
        pieces.push({
            name: 'Fondo de Cajón',
            dimensions: `${box.depth.toFixed(1)} x ${(box.width - (2 * CABINET_MELAMINE_THICKNESS)).toFixed(1)} mm`,
            quantity: 1,
        });
    }

    return pieces;
  }, [selectedComponent, resolvedWidth, resolvedDepth, resolvedHeight, cabinet.cabinetId, cabinet.type, components, useJProfileDiscounts, useLegs]);

  const DraggableTool = ({ tool, children, disabled }: {tool: ActiveTool, children: React.ReactNode, disabled?: boolean}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `tool-${tool}`,
        data: { type: tool },
        disabled
    });
    return (
        <Button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            variant={activeTool === tool ? 'secondary' : 'outline'}
            className={cn("w-full justify-start", isDragging ? "opacity-50" : "", disabled ? "cursor-not-allowed opacity-50" : "cursor-grab")}
            disabled={disabled}
            onClick={() => setActiveTool(current => current === tool ? null : tool)}
        >
            {children}
        </Button>
    );
  };

  const HTML5DraggableTool = ({ tool, children }: { tool: ActiveTool, children: React.ReactNode }) => {
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/vnd.cabinet-component', tool);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        className="w-full flex justify-start items-center cursor-grab bg-background border hover:bg-accent rounded-md px-4 py-2 text-sm font-medium transition-colors"
      >
        {children}
      </div>
    );
  };

  const DroppableOpening = ({ id, visualHeight, visualWidth, children, onClick }: any) => {
      const { isOver, setNodeRef } = useDroppable({
          id: id,
          data: { type: 'opening', id }
      });

      return (
          <div
              ref={setNodeRef}
              onClick={onClick}
              className={cn(
                  "border relative group cursor-pointer transition-all flex flex-col",
                  "bg-background hover:bg-accent border-muted-foreground/30",
                  isOver ? "bg-green-100 border-green-500 border-dashed border-2 ring-2 ring-green-500 ring-offset-2 scale-[1.01] z-20" : ""
              )}
              style={{ height: `${visualHeight}%`, width: `${visualWidth}%` }}
          >
              {children}
          </div>
      )
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
     <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Volver</span>
                </Button>
                <div>
                    <h4 className="font-semibold leading-tight">Editar {cabinetInfo?.name}</h4>
                    <p className="text-xs text-muted-foreground">{dimensions.width}x{dimensions.height}x{dimensions.depth}mm</p>
                </div>
            </div>
            <Button size="sm" onClick={handleSave}>Guardar Cambios</Button>
        </div>
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Dimensiones Generales</h4>
                        {cabinet.type === 'base' && !cabinet.cabinetId.startsWith('vanity') && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="global-j-switch" className="text-xs">Descuento Perfil J / Dedos</Label>
                                    <Switch 
                                        id="global-j-switch" 
                                        checked={useJProfileDiscounts} 
                                        onCheckedChange={setUseJProfileDiscounts}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="legs-switch" className="text-xs">Patas (10cm)</Label>
                                    <Switch 
                                        id="legs-switch" 
                                        checked={useLegs} 
                                        onCheckedChange={(checked) => {
                                            setUseLegs(checked);
                                        }}
                                    />
                                </div>
                                {(cabinet.cabinetId === 'base-1p' || cabinet.cabinetId === 'base-2p') && (
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="shelf-switch" className="text-xs">Estante Interno</Label>
                                        <Switch 
                                            id="shelf-switch" 
                                            checked={hasInnerShelf} 
                                            onCheckedChange={(checked) => {
                                                setHasInnerShelf(checked);
                                                if (checked && !innerShelfHeights) {
                                                    const defaultMiddle = Math.round((resolvedHeight - (useLegs ? 100 : 0)) / 2);
                                                    setInnerShelfHeights([defaultMiddle]);
                                                    setShelfHeightsText(String(defaultMiddle));
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                {((hasInnerShelf && (cabinet.cabinetId === 'base-1p' || cabinet.cabinetId === 'base-2p')) || cabinet.cabinetId === 'base-nicho') && (
                                    <div className="flex flex-col gap-1.5 mt-1.5 border p-2 rounded bg-muted/30">
                                        <Label htmlFor="shelf-heights" className="text-[10px] font-semibold text-muted-foreground">Alturas de Estantes desde abajo (mm)</Label>
                                        <div className="flex flex-col gap-1.5">
                                            <Input
                                                id="shelf-heights"
                                                type="text"
                                                className="h-7 text-xs font-bold w-full"
                                                placeholder="Ej: 200, 450"
                                                value={shelfHeightsText}
                                                onChange={(e) => {
                                                    const text = e.target.value;
                                                    setShelfHeightsText(text);
                                                    
                                                    // Parse values dynamically
                                                    const vals = text.split(',')
                                                        .map(s => parseInt(s.trim()))
                                                        .filter(n => !isNaN(n) && n >= 0);
                                                    
                                                    setInnerShelfHeights(vals.length > 0 ? vals : undefined);
                                                }}
                                            />
                                            <span className="text-[9px] text-muted-foreground italic leading-tight">
                                                (Medidas desde el piso interno. Separa con comas para agregar varios, ej: 200, 450)
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {cabinet.cabinetId === 'base-blind-corner' && (
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="invert-side-switch" className="text-xs">Invertir Lado (Ciego Der)</Label>
                                        <Switch 
                                            id="invert-side-switch" 
                                            checked={invertSide} 
                                            onCheckedChange={setInvertSide}
                                        />
                                    </div>
                                )}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-[10px]"
                                    onClick={() => {
                                        const newRotation: [number, number, number] = [
                                            rotation[0],
                                            rotation[1] + (Math.PI / 2),
                                            rotation[2]
                                        ];
                                        setRotation(newRotation);
                                    }}
                                >
                                    <RotateCw className="w-3 h-3 mr-1" />
                                    Girar 90°
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="grid gap-4 py-4">
                        {isCornerCabinet ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2">
                            {/* Row 1: Left Arm (Arm A) */}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-destructive font-medium mb-0.5">ancho A</span>
                                <Label htmlFor="width2" className="mb-1.5">Ancho (mm)</Label>
                                <Input id="width2" name="width2" type="number" value={dimensions.width2} onChange={handleDimensionChange} />
                            </div>
                            <div className="flex flex-col justify-end">
                                <Label htmlFor="height" className="mb-1.5">Alto (mm)</Label>
                                <Input id="height" name="height" type="number" value={dimensions.height} onChange={handleDimensionChange} onBlur={handleHeightBlur} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-destructive font-medium mb-0.5">profundidad b</span>
                                <Label htmlFor="depth2" className="mb-1.5">Profundidad (mm)</Label>
                                <Input id="depth2" name="depth2" type="number" value={dimensions.depth2} onChange={handleDimensionChange} />
                            </div>
                            
                            {/* Row 2: Top Arm (Arm B) */}
                            <div className="flex flex-col">
                                <Input id="width" name="width" type="number" value={dimensions.width} onChange={handleDimensionChange} />
                                <span className="text-[10px] text-destructive font-medium mt-1">ancho b</span>
                            </div>
                            <div className="hidden sm:block"></div> {/* Spacer for Alto */}
                            <div className="flex flex-col">
                                <Input id="depth" name="depth" type="number" value={dimensions.depth} onChange={handleDimensionChange} />
                                <span className="text-[10px] text-destructive font-medium mt-1">profundidad a</span>
                            </div>
                        </div>
                        ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="width">Ancho (mm)</Label>
                                <Input id="width" name="width" type="number" value={dimensions.width} onChange={handleDimensionChange} />
                            </div>
                            <div>
                                <Label htmlFor="height">Alto (mm)</Label>
                                <Input id="height" name="height" type="number" value={dimensions.height} onChange={handleDimensionChange} />
                            </div>
                            <div>
                                <Label htmlFor="depth">Profundidad (mm)</Label>
                                <Input id="depth" name="depth" type="number" value={dimensions.depth} onChange={handleDimensionChange} />
                            </div>
                        </div>
                        )}
                    </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                    <h4 className="font-medium text-sm text-center">Personalizar Componentes</h4>
                    <div className="flex flex-col gap-6 items-center">
                          <div className="w-full max-w-2xl grid grid-cols-1 gap-6">
                            {isPlacar ? (
                              <div className="space-y-4">
                                <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                                    <h5 className="font-semibold text-sm">Paleta de Accesorios (Arrastrar o Hacer Clic)</h5>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Hacé clic en un elemento para agregarlo rápidamente, o arrastralo y soltalo directamente sobre el interior del placard en el modelo 3D.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" className="justify-start text-xs font-semibold" onClick={() => handleQuickAddPlacarComponent('shelf')}>
                                            Estante (18mm)
                                        </Button>
                                        <Button variant="outline" className="justify-start text-xs font-semibold" onClick={() => handleQuickAddPlacarComponent('hanging-rail')}>
                                            Barral de Colgar
                                        </Button>
                                        <Button variant="outline" className="justify-start text-xs font-semibold" onClick={() => handleQuickAddPlacarComponent('drawer')}>
                                            Cajón (200mm)
                                        </Button>
                                        <Button variant="outline" className="justify-start text-xs font-semibold" onClick={() => handleQuickAddPlacarComponent('vertical-divider')}>
                                            Divisor Vertical (18mm)
                                        </Button>
                                    </div>
                                </div>

                                {/* List of currently placed items inside the Placar */}
                                {components.length > 0 && (
                                    <div className="space-y-2 p-4 bg-background border rounded-lg shadow-sm">
                                        <h6 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accesorios en el Placard:</h6>
                                        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                                            {components.map((comp) => {
                                                const isSelected = selectedComponentId === comp.id;
                                                let description = '';
                                                if (comp.type === 'vertical-divider') {
                                                    description = `Izquierda: ${Math.round(comp.positionX || 0)}mm | Alto: ${comp.height}mm`;
                                                } else {
                                                    description = `Altura: ${Math.round(comp.positionY || 0)}mm`;
                                                }
                                                
                                                return (
                                                    <div 
                                                        key={comp.id} 
                                                        className={cn(
                                                            "flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all",
                                                            isSelected ? "bg-amber-50 border-amber-500 shadow-sm" : "bg-background hover:bg-accent border-muted/50"
                                                        )}
                                                        onClick={() => setSelectedComponentId(comp.id)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground">{typeLabels[comp.type] || comp.type}</span>
                                                            <span className="text-[10px] text-muted-foreground">{description}</span>
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 text-destructive hover:bg-destructive/10" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveComponent(comp.id);
                                                            }}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic text-center mt-2">
                                            Haz clic sobre cualquier accesorio para editar su altura o posición.
                                        </p>
                                    </div>
                                )}

                                {/* Available gaps between shelves / floor / top */}
                                {placardGaps.length > 0 && (
                                    <div className="space-y-2.5 p-4 bg-[#81B29A]/10 border border-[#81B29A]/40 rounded-lg">
                                        <h6 className="text-xs font-bold text-[#81B29A] uppercase tracking-wider">Huecos Detectados (Organización Inteligente):</h6>
                                        <p className="text-[10px] text-muted-foreground leading-tight">
                                            Acomoda cajones o estantes de forma automática ajustando las medidas al espacio libre disponible.
                                        </p>
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                            {placardGaps.map((gap, idx) => (
                                                <div key={idx} className="flex flex-col gap-1.5 p-2.5 rounded-md border bg-background border-muted/50 text-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold text-foreground">{gap.name}</span>
                                                        <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">{gap.height} mm libres</span>
                                                    </div>
                                                    <div className="text-[9px] text-muted-foreground leading-none">
                                                        Rango: {gap.start}mm a {gap.end}mm
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                                                        <Button 
                                                            variant="secondary" 
                                                            size="sm" 
                                                            className="h-6 text-[10px] bg-[#E07A5F] hover:bg-[#d66c50] text-white font-semibold"
                                                            onClick={() => handleAddDrawerInGap(gap)}
                                                        >
                                                            Acomodar Cajón
                                                        </Button>
                                                        <Button 
                                                            variant="secondary" 
                                                            size="sm" 
                                                            className="h-6 text-[10px] bg-slate-600 hover:bg-slate-700 text-white font-semibold"
                                                            onClick={() => handleAddShelfInGap(gap)}
                                                        >
                                                            Acomodar Estante
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                              </div>
                            ) : (
                            <div className="space-y-4">
                                {/* Interactive 2D Layout or Technical View */}
                                <div className="flex items-center justify-between">
                                    <h5 className="font-semibold text-sm">Visualización 2D</h5>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 text-xs"
                                        onClick={() => setViewMode(viewMode === 'technical' ? '2d' : 'technical')}
                                    >
                                        {viewMode === 'technical' ? 'Ver Maqueta' : 'Ver Vista Técnica / Despiece'}
                                    </Button>
                                </div>
                                <div className="flex flex-col items-center justify-end w-full bg-secondary/10 rounded-md border p-4" style={{ height: `${VISUAL_EDITOR_HEIGHT_PX + 40}px` }}>
                                    <div className="relative w-full bg-secondary/30 rounded-md border-2 border-dashed transition-all" style={{ height: `${(effectiveCabinetHeight / resolvedHeight) * VISUAL_EDITOR_HEIGHT_PX}px` }}>
                                        <div className={cn(
                                            "absolute inset-0 flex",
                                            hasGlobalHorizontalDoors ? "flex-row" : "flex-col-reverse"
                                        )}>
                                            {components.map((comp, index) => {
                                                const visualHeight = hasGlobalHorizontalDoors ? 100 : (comp.height / internalHeight) * 100;
                                                const visualWidth = hasGlobalHorizontalDoors ? (100 / components.length) : 100;
                                                const isSelected = selectedComponentId === comp.id;
                                                const nDoors = comp.numDoors || 1;
                                                const compLabel = typeLabels[comp.type] || comp.type;

                                                const content = (
                                                    <>
                                                        {Array.from({ length: nDoors }).map((_, i) => (
                                                            <div 
                                                                key={i} 
                                                                className={cn(
                                                                    "h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground select-none overflow-hidden w-full",
                                                                    nDoors > 1 && i < nDoors - 1 ? "border-r border-dashed" : ""
                                                                )}
                                                                style={{ width: nDoors > 1 ? `${100 / nDoors}%` : '100%' }}
                                                            >
                                                                {i === 0 && (
                                                                    <div className="flex flex-col items-center text-center p-1 w-full">
                                                                        <span className="uppercase whitespace-nowrap">{compLabel}</span>
                                                                        <span>{Math.round(comp.height)}mm</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}

                                                        {isSelected && comp.type !== 'opening' && !hasGlobalHorizontalDoors && (
                                                            <div className="absolute top-1 right-1 z-30 flex items-center gap-1 bg-background/80 p-1 rounded-md shadow-sm">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === components.length -1} onClick={(e) => {e.stopPropagation(); handleMoveComponent(index, 'down')}}><ArrowUp className="h-4 w-4"/></Button>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={(e) => {e.stopPropagation(); handleMoveComponent(index, 'up')}}><ArrowDown className="h-4 w-4"/></Button>
                                                            </div>
                                                        )}
                                                    </>
                                                );

                                                const commonProps = {
                                                    onMouseEnter: () => onHoverPiece(comp.type === 'door' ? 'Puerta' : comp.type === 'drawer' ? 'Frente de Cajón' : null),
                                                    onMouseLeave: () => onHoverPiece(null),
                                                    onClick: (e: any) => {
                                                        e.stopPropagation();
                                                        if (activeTool && comp.type === 'opening') {
                                                            addComponentInOpening(comp.id, activeTool);
                                                            setActiveTool(null);
                                                        } else {
                                                            setSelectedComponentId(comp.id)
                                                        }
                                                    }
                                                };

                                                if (comp.type === 'opening') {
                                                    return (
                                                        <DroppableOpening
                                                            key={comp.id}
                                                            id={comp.id}
                                                            visualHeight={visualHeight}
                                                            visualWidth={visualWidth}
                                                            {...commonProps}
                                                        >
                                                            {content}
                                                        </DroppableOpening>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={comp.id}
                                                        {...commonProps}
                                                        className={cn(
                                                            "border relative group cursor-pointer transition-colors flex",
                                                            isSelected ? "bg-primary/20 border-primary border-2 z-10" : "bg-background hover:bg-accent border-muted-foreground/30",
                                                            nDoors > 1 ? "flex-row" : "flex-col"
                                                        )}
                                                        style={{ 
                                                            height: `${visualHeight}%`,
                                                            width: `${visualWidth}%`,
                                                        }}
                                                    >
                                                        {content}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    {useLegs && cabinet.type === 'base' && (
                                        <div className="flex justify-around w-full" style={{ height: `${(100 / resolvedHeight) * VISUAL_EDITOR_HEIGHT_PX}px` }}>
                                            <div className="w-4 bg-muted-foreground/40 rounded-b-sm" />
                                            <div className="w-4 bg-muted-foreground/40 rounded-b-sm" />
                                            <div className="w-4 bg-muted-foreground/40 rounded-b-sm" />
                                            <div className="w-4 bg-muted-foreground/40 rounded-b-sm" />
                                        </div>
                                    )}
                                </div>

                                {/* Full Piece List Table */}
                                <div className="mt-4 p-4 bg-secondary/5 border rounded-lg">
                                    <h6 className="text-sm font-semibold mb-3">Lista de Piezas (Interactiva)</h6>
                                    <Table className="text-xs">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px] font-bold">Cant.</TableHead>
                                                <TableHead className="font-bold">Pieza</TableHead>
                                                <TableHead className="text-right font-bold">Al x An (mm)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cabinetPieces.filter(p => p.material !== 'Herrajes').map((piece, idx) => {
                                                const isHighlighted = hoveredPieceName === piece.name || piece.name.includes(hoveredPieceName || '___');
                                                
                                                return (
                                                    <TableRow 
                                                        key={`${piece.name}-${idx}`}
                                                        onMouseEnter={() => onHoverPiece(piece.name)}
                                                        onMouseLeave={() => onHoverPiece(null)}
                                                        className={cn(
                                                            "transition-colors",
                                                            isHighlighted ? "bg-primary/20" : ""
                                                        )}
                                                    >
                                                        <TableCell className="font-medium p-2 text-center">{piece.quantity}</TableCell>
                                                        <TableCell className="p-2 font-medium">{piece.name}</TableCell>
                                                        <TableCell className="text-right p-2 text-muted-foreground">{`${piece.height} x ${piece.width}`}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    <p className="text-[10px] text-muted-foreground mt-4 italic text-center">
                                        Pasa el mouse sobre una pieza para verla resaltada en el dibujo superior.
                                    </p>
                                </div>
                            </div>
                            )}

                            {/* Active Tools Palette (Now available for all cabinets including Placards) */}
                            <div className="space-y-4">
                                {selectedComponent ? (
                                    <div className="space-y-4 p-3 border rounded-md bg-background animate-in fade-in-50">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-medium">Editar {typeLabels[selectedComponent.type]}</h5>
                                            <div className="flex gap-1">
                                                {selectedComponent.type !== 'opening' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-8 text-xs" 
                                                        onClick={() => handleConvertToOpening(selectedComponent.id)}
                                                        title="Convertir este componente en un espacio vacío para poner otra cosa"
                                                    >
                                                        Quitar y dejar Hueco
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveComponent(selectedComponent.id)}>
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">Borrar</span>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <Label htmlFor="comp-height">Alto del Componente (mm)</Label>
                                                <Input 
                                                    id="comp-height"
                                                    type="number"
                                                    value={selectedComponent.height}
                                                    onChange={(e) => handleUpdateComponentHeight(selectedComponent.id, Number(e.target.value))}
                                                    disabled={['shelf', 'opening', 'hanging-rail'].includes(selectedComponent.type)}
                                                />
                                            </div>

                                            {selectedComponent.type !== 'opening' && (
                                                <div className="space-y-1">
                                                    <Label htmlFor="comp-position">Posición desde Abajo (mm)</Label>
                                                    <Input 
                                                        id="comp-position"
                                                        type="number"
                                                        value={positionInput}
                                                        onChange={(e) => setPositionInput(e.target.value)}
                                                        onBlur={(e) => {
                                                            if (selectedComponent) {
                                                                const success = handleUpdateComponentPosition(selectedComponent.id, Number(e.target.value));
                                                                if (!success) {
                                                                    setPositionInput(String(Math.round(selectedComponentPosition)));
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-xs text-muted-foreground">Distancia hasta la base del componente.</p>
                                                </div>
                                            )}

                                            {selectedComponent.type === 'vertical-divider' && (
                                                <div className="space-y-1">
                                                    <Label htmlFor="comp-position-x">Posición desde Izquierda (mm)</Label>
                                                    <Input 
                                                        id="comp-position-x"
                                                        type="number"
                                                        value={positionXInput}
                                                        onChange={(e) => setPositionXInput(e.target.value)}
                                                        onBlur={(e) => {
                                                            if (selectedComponent) {
                                                                handleUpdateComponent(selectedComponent.id, { positionX: Number(e.target.value) });
                                                            }
                                                        }}
                                                    />
                                                    <p className="text-xs text-muted-foreground">Distancia desde el lado izquierdo del mueble al centro de la madera.</p>
                                                </div>
                                            )}
                                        </div>

                                        {selectedComponent.type === 'door' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between space-x-2 pt-3 border-t">
                                                    <Label htmlFor="hinge-type" className="flex flex-col space-y-1">
                                                        <span>Tipo de Apertura</span>
                                                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                                                            Apertura lateral o hacia arriba.
                                                        </span>
                                                    </Label>
                                                    <Select onValueChange={(value: 'side' | 'top') => handleUpdateComponent(selectedComponent.id, { hinge: value as 'side' | 'top' })} value={selectedComponent.hinge || 'side'}>
                                                        <SelectTrigger id="hinge-type" className="w-[140px]">
                                                            <SelectValue placeholder="Seleccionar" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="side">Lateral</SelectItem>
                                                            <SelectItem value="top">Hacia Arriba</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center justify-between space-x-2 pt-3 border-t">
                                                    <Label className="flex flex-col space-y-1">
                                                        <span>Cantidad de Puertas</span>
                                                        <span className="font-normal leading-snug text-muted-foreground text-xs">
                                                            ¿1 o 2 puertas lado a lado?
                                                        </span>
                                                    </Label>
                                                    <div className="flex border rounded-md overflow-hidden">
                                                        <Button 
                                                            variant={!selectedComponent.numDoors || selectedComponent.numDoors === 1 ? "default" : "ghost"}
                                                            size="sm"
                                                            className="rounded-none h-8 px-3"
                                                            onClick={() => handleUpdateComponent(selectedComponent.id, { numDoors: 1 })}
                                                        >
                                                            1
                                                        </Button>
                                                        <Button 
                                                            variant={selectedComponent.numDoors === 2 ? "default" : "ghost"}
                                                            size="sm"
                                                            className="rounded-none h-8 px-3 border-l"
                                                            onClick={() => handleUpdateComponent(selectedComponent.id, { numDoors: 2 })}
                                                        >
                                                            2
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {selectedComponent.type !== 'opening' && selectedComponent.type !== 'shelf' && selectedComponent.type !== 'hanging-rail' && (
                                            <div className="flex items-center justify-between space-x-2 pt-3 border-t mt-3">
                                                <Label htmlFor="j-profile-switch" className="flex flex-col space-y-1">
                                                    <span>Perfil J</span>
                                                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                                                        Tirador integrado.
                                                    </span>
                                                </Label>
                                                <Switch
                                                    id="j-profile-switch"
                                                    checked={selectedComponent.handle === 'j-profile'}
                                                    onCheckedChange={(checked) => handleToggleJProfile(selectedComponent.id, checked)}
                                                />
                                            </div>
                                        )}
                                        
                                        {selectedComponent.type === 'drawer' && selectedDrawerPieces.length > 0 && (
                                            <div className="space-y-2 pt-3 border-t mt-3">
                                            <h6 className="text-sm font-medium">Despiece del Cajón</h6>
                                            <Table className="text-xs">
                                                <TableHeader>
                                                <TableRow>
                                                    <TableHead className="h-8 px-2">Cant.</TableHead>
                                                    <TableHead className="h-8 px-2">Pieza</TableHead>
                                                    <TableHead className="h-8 px-2 text-right">Dimensiones (AlxAn)</TableHead>
                                                </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                {selectedDrawerPieces.map((piece, index) => (
                                                    <TableRow key={index}>
                                                    <TableCell className="font-medium py-1 px-2">{piece.quantity}</TableCell>
                                                    <TableCell className="py-1 px-2">{piece.name}</TableCell>
                                                    <TableCell className="text-right py-1 px-2">{piece.dimensions}</TableCell>
                                                    </TableRow>
                                                ))}
                                                </TableBody>
                                            </Table>
                                            </div>
                                        )}
                                        
                                        {selectedComponent.type === 'door' && (() => {
                                            const compIndex = components.findIndex(c => c.id === selectedComponent.id);
                                            const door = calculateComponentDimensions(
                                                cabinet.type,
                                                cabinet.cabinetId,
                                                selectedComponent,
                                                compIndex,
                                                resolvedWidth,
                                                1, // Utility will use component.numDoors internally
                                                useJProfileDiscounts,
                                                useLegs,
                                                appearance.frontStyle,
                                                resolvedHeight
                                            );

                                            return (
                                                <div className="space-y-2 pt-3 border-t mt-3">
                                                    <h6 className="text-sm font-medium">Despiece de la Puerta</h6>
                                                    <Table className="text-xs">
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="h-8 px-2">Cant.</TableHead>
                                                                <TableHead className="h-8 px-2">Pieza</TableHead>
                                                                <TableHead className="h-8 px-2 text-right">Dimensiones (AlxAn)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            <TableRow>
                                                                <TableCell className="font-medium py-1 px-2">{selectedComponent.numDoors || 1}</TableCell>
                                                                <TableCell className="py-1 px-2">{door.name}</TableCell>
                                                                <TableCell className="text-right py-1 px-2">{`${door.height.toFixed(1)} x ${door.width.toFixed(1)} mm`}</TableCell>
                                                            </TableRow>
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            );
                                        })()}

                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground p-4 flex items-center justify-center h-40 border-2 border-dashed rounded-md">
                                        <p>{activeTool ? (isPlacar ? 'Agrega accesorios haciendo clic en la paleta o arrastrando.' : `Haz clic en un hueco para añadir un ${typeLabels[activeTool] || activeTool}`) : (isPlacar ? 'Selecciona un accesorio de la lista para editar su altura o posición.' : 'Selecciona un componente para editarlo.')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeDragTool ? (
                <Button variant="secondary" className="w-[180px] justify-start shadow-xl cursor-grabbing">
                    {activeDragTool === 'shelf' && <HardHat className="mr-2 h-4 w-4" />}
                    {activeDragTool === 'drawer' && <Box className="mr-2 h-4 w-4" />}
                    {activeDragTool === 'door' && <DoorOpen className="mr-2 h-4 w-4" />}
                    {activeDragTool === 'hanging-rail' && <RailSymbol className="mr-2 h-4 w-4" />}
                    {typeLabels[activeDragTool]}
                </Button>
            ) : null}
        </DragOverlay>
    </div>
    </DndContext>
  );
}
