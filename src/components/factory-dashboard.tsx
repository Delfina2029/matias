'use client';

import React from 'react';
import { Header } from '@/components/layout/header';

export function FactoryDashboard({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden app-bg text-white">
      <Header onBackToMenu={onBack} hideActionButtons />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-2">Panel de Fábrica</h1>
            <p className="text-[#8a8a9a]">Gestión de producción, corte y órdenes de trabajo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder cards for future factory features */}
            {[
              { title: 'Órdenes Pendientes', value: '12', color: '#c8a96e' },
              { title: 'En Producción', value: '5', color: '#4CAF50' },
              { title: 'Listas para Entregar', value: '3', color: '#2196F3' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-6">
                <h3 className="text-[#8a8a9a] font-medium mb-4">{stat.title}</h3>
                <p className="text-4xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-[#1a1a2e] border border-[#2a2a4a] rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
             <div className="w-16 h-16 rounded-full bg-[#0f0f18] flex items-center justify-center border border-[#2a2a4a] mb-4">
               <svg viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" width="24" height="24">
                 <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
               </svg>
             </div>
             <h2 className="text-xl font-bold mb-2">Módulo en Desarrollo</h2>
             <p className="text-[#8a8a9a] max-w-md">
               Próximamente podrás gestionar aquí los despieces automáticos, optimización de tableros y estados de producción.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}
