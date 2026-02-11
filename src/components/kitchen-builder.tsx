'use client';

import { useState } from 'react';
import type { PlacedCabinet } from '@/lib/types';
import { CabinetSelector } from './cabinet-selector';
import { KitchenLayout } from './kitchen-layout';
import { CuttingListPanel } from './cutting-list-panel';

export function KitchenBuilder() {
  const [placedCabinets, setPlacedCabinets] = useState<PlacedCabinet[]>([]);

  const addCabinet = (cabinetId: string) => {
    const newCabinet: PlacedCabinet = {
      cabinetId,
      instanceId: `cab_${Date.now()}_${Math.random()}`,
      x: 20,
      y: 20,
    };
    setPlacedCabinets((prev) => [...prev, newCabinet]);
  };

  const clearLayout = () => {
    setPlacedCabinets([]);
  };

  const removeCabinet = (instanceId: string) => {
    setPlacedCabinets((prev) => prev.filter((c) => c.instanceId !== instanceId));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[320px_1fr_420px] gap-4 p-4 h-[calc(100vh-4rem)]">
      <CabinetSelector onSelectCabinet={addCabinet} />
      <KitchenLayout
        placedCabinets={placedCabinets}
        onUpdateLayout={setPlacedCabinets}
        onClearLayout={clearLayout}
        onRemoveCabinet={removeCabinet}
      />
      <CuttingListPanel placedCabinets={placedCabinets} />
    </div>
  );
}
