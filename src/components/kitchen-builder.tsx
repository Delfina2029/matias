'use client';

import { useState, useCallback, useRef } from 'react';
import type { PlacedCabinet, CabinetComponent, Appearance } from '@/lib/types';
import { CabinetSelector } from './cabinet-selector';
import { KitchenLayout } from './kitchen-layout';
import { CuttingListPanel } from './cutting-list-panel';
import { cabinetData } from '@/lib/cabinets';
import { CabinetEditor } from './cabinet-editor';

export function KitchenBuilder() {
  const [placedCabinets, setPlacedCabinets] = useState<PlacedCabinet[]>([]);
  const [editingCabinet, setEditingCabinet] = useState<PlacedCabinet | null>(null); // For the modal editor
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null); // For 3D manipulation

  const cabinetsRef = useRef(placedCabinets);
  cabinetsRef.current = placedCabinets;

  const [appearance, setAppearance] = useState<Appearance>({
    frontColor: '#f8f9fa',
    carcassColor: '#e9ecef',
    countertopColor: '#343a40',
  });

  const addCabinet = (cabinetId: string) => {
    const cabinetInfo = cabinetData.find((c) => c.id === cabinetId);
    if (!cabinetInfo) return;

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
    
    if (defaultComponents.length === 0 && cabinetId !== 'base-corner-900') {
        defaultComponents.push({
            id: `comp_${Date.now()}_${Math.random()}`,
            type: 'door',
            height: cabinetInfo.height
        });
    }

    const newCabinet: PlacedCabinet = {
      cabinetId,
      instanceId: `cab_${Date.now()}_${Math.random()}`,
      type: cabinetInfo.type,
      position: [0, cabinetInfo.type === 'wall' ? 1.5 : (cabinetInfo.height / 1000) / 2, 0],
      rotation: [0, 0, 0],
      width: cabinetInfo.width,
      height: cabinetInfo.height,
      depth: cabinetInfo.depth,
      depth2: cabinetInfo.depth2,
      components: defaultComponents,
    };
    setPlacedCabinets((prev) => [...prev, newCabinet]);
  };

  const handleOpenEditor = useCallback((instanceId: string | null) => {
    if (!instanceId) {
      setEditingCabinet(null);
      return;
    }
    const cabinet = cabinetsRef.current.find((c) => c.instanceId === instanceId);
    setEditingCabinet(cabinet || null);
  }, []);
  
  const handleUpdateCabinet = (updatedCabinet: PlacedCabinet) => {
    setPlacedCabinets((prev) =>
      prev.map((c) =>
        c.instanceId === updatedCabinet.instanceId ? updatedCabinet : c
      )
    );
    setEditingCabinet(null);
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

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 p-6 h-[calc(100vh-4rem)]">
        {/* Columna Izquierda: Selector de Gabinetes */}
        <CabinetSelector onSelectCabinet={addCabinet} />

        {/* Columna Derecha: Vista Previa y Controles */}
        <div className="flex flex-col gap-6 h-full min-h-0">
            {/* Sección Superior: Vista Previa */}
            <div className="flex-[3] min-h-0">
                <KitchenLayout
                    placedCabinets={placedCabinets}
                    onClearLayout={clearLayout}
                    appearance={appearance}
                    selectedInstanceId={selectedInstanceId}
                    onSelectInstance={setSelectedInstanceId}
                    onUpdateTransform={handleUpdateCabinetTransform}
                    onOpenEditor={handleOpenEditor}
                />
            </div>
            {/* Sección Inferior: Paneles de Control (Lista de corte, etc.) */}
            <div className="flex-[2] min-h-0">
                <CuttingListPanel 
                    placedCabinets={placedCabinets}
                    appearance={appearance}
                    onAppearanceChange={setAppearance}
                    onRemoveCabinet={removeCabinet}
                    onSelectCabinet={handleOpenEditor}
                    selectedCabinetId={editingCabinet?.instanceId}
                />
            </div>
        </div>
      </div>
      
      {/* Editor Modal */}
      {editingCabinet && (
        <CabinetEditor
          cabinet={editingCabinet}
          onUpdate={handleUpdateCabinet}
          onClose={() => setEditingCabinet(null)}
        />
      )}
    </>
  );
}
