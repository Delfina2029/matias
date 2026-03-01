'use client';

import { useState } from 'react';
import type { PlacedCabinet, CabinetComponent, Appearance } from '@/lib/types';
import { CabinetSelector } from './cabinet-selector';
import { KitchenLayout } from './kitchen-layout';
import { CuttingListPanel } from './cutting-list-panel';
import { cabinetData } from '@/lib/cabinets';
import { CabinetEditor } from './cabinet-editor';

export function KitchenBuilder() {
  const [placedCabinets, setPlacedCabinets] = useState<PlacedCabinet[]>([]);
  const [editingCabinet, setEditingCabinet] = useState<PlacedCabinet | null>(null);

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
      // Infer default components from pieces
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
      x: 20, // x/y no longer used for positioning but kept for data structure
      y: 20,
      width: cabinetInfo.width,
      height: cabinetInfo.height,
      depth: cabinetInfo.depth,
      depth2: cabinetInfo.depth2,
      components: defaultComponents,
    };
    setPlacedCabinets((prev) => [...prev, newCabinet]);
  };

  const handleSelectCabinet = (instanceId: string | null) => {
    if (!instanceId) {
      setEditingCabinet(null);
      return;
    }
    const cabinet = placedCabinets.find((c) => c.instanceId === instanceId);
    setEditingCabinet(cabinet || null);
  };

  const handleUpdateCabinet = (updatedCabinet: PlacedCabinet) => {
    setPlacedCabinets((prev) =>
      prev.map((c) =>
        c.instanceId === updatedCabinet.instanceId ? updatedCabinet : c
      )
    );
    setEditingCabinet(null);
  };

  const clearLayout = () => {
    setPlacedCabinets([]);
  };

  const removeCabinet = (instanceId: string) => {
    setPlacedCabinets((prev) => prev.filter((c) => c.instanceId !== instanceId));
  };

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
                />
            </div>
            {/* Sección Inferior: Paneles de Control (Lista de corte, etc.) */}
            <div className="flex-[2] min-h-0">
                <CuttingListPanel 
                    placedCabinets={placedCabinets}
                    appearance={appearance}
                    onAppearanceChange={setAppearance}
                    onRemoveCabinet={removeCabinet}
                    onSelectCabinet={handleSelectCabinet}
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
