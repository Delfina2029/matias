'use client';

import { useState } from 'react';
import type { PlacedCabinet } from '@/lib/types';
import { CabinetSelector } from './cabinet-selector';
import { KitchenLayout } from './kitchen-layout';
import { CuttingListPanel } from './cutting-list-panel';
import { cabinetData } from '@/lib/cabinets';
import { CabinetEditor } from './cabinet-editor';

export function KitchenBuilder() {
  const [placedCabinets, setPlacedCabinets] = useState<PlacedCabinet[]>([]);
  const [editingCabinet, setEditingCabinet] = useState<PlacedCabinet | null>(null);

  const addCabinet = (cabinetId: string) => {
    const cabinetInfo = cabinetData.find((c) => c.id === cabinetId);
    if (!cabinetInfo) return;

    const newCabinet: PlacedCabinet = {
      cabinetId,
      instanceId: `cab_${Date.now()}_${Math.random()}`,
      x: 20,
      y: 20,
      width: cabinetInfo.width,
      height: cabinetInfo.height,
      depth: cabinetInfo.depth,
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
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[320px_1fr_420px] gap-4 p-4 h-[calc(100vh-4rem)]">
        <CabinetSelector onSelectCabinet={addCabinet} />
        <KitchenLayout
          placedCabinets={placedCabinets}
          onUpdateLayout={setPlacedCabinets}
          onClearLayout={clearLayout}
          onRemoveCabinet={removeCabinet}
          onSelectCabinet={handleSelectCabinet}
          selectedCabinetId={editingCabinet?.instanceId}
        />
        <CuttingListPanel placedCabinets={placedCabinets} />
      </div>
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
