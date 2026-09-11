'use client';

import { useState } from 'react';
import { KitchenBuilder } from '@/components/kitchen-builder';
import { LoginPage } from '@/components/login-page';
import { FactoryDashboard } from '@/components/factory-dashboard';
import { useAuth } from '@/context/AuthContext';
import { Factory, Store } from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedApp, setSelectedApp] = useState<'ventas' | 'fabrica' | null>(null);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0f14',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(200,169,110,0.2)',
            borderTopColor: '#c8a96e',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isMatias = user.email === 'matias@vascohogar.com';

  if (isMatias && !selectedApp) {
    return (
      <div className="flex flex-col h-screen overflow-hidden app-bg text-white">
        <Header hideActionButtons />
        
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Selecciona un Módulo</h1>
              <p className="text-[#8a8a9a] text-lg max-w-xl mx-auto">
                Bienvenido al sistema integrado de Nidel Muebles. ¿A qué área deseas ingresar?
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
              <button
                onClick={() => setSelectedApp('fabrica')}
                className="flex-1 bg-[#1a1a2e] border border-[#2a2a4a] hover:border-[#c8a96e] transition-all p-10 rounded-3xl flex flex-col items-center gap-6 group hover:-translate-y-1"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#c8a96e] to-[#a07840] flex items-center justify-center shadow-[0_4px_20px_rgba(200,169,110,0.3)] group-hover:shadow-[0_8px_30px_rgba(200,169,110,0.5)] transition-all">
                  <Factory className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Fábrica</h2>
                  <p className="text-[#8a8a9a] text-sm leading-relaxed">
                    Gestión de producción, corte y órdenes de trabajo.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedApp('ventas')}
                className="flex-1 bg-[#1a1a2e] border border-[#2a2a4a] hover:border-[#c8a96e] transition-all p-10 rounded-3xl flex flex-col items-center gap-6 group hover:-translate-y-1"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#0f0f18] flex items-center justify-center border border-[#2a2a4a] group-hover:border-[#c8a96e] transition-colors">
                  <Store className="w-10 h-10 text-[#c8a96e]" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Ventas</h2>
                  <p className="text-[#8a8a9a] text-sm leading-relaxed">
                    Diseño de cocinas y presupuestos a medida para clientes.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isMatias && selectedApp === 'fabrica') {
    return <FactoryDashboard onBack={() => setSelectedApp(null)} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <KitchenBuilder onBackToMenu={isMatias ? () => setSelectedApp(null) : undefined} />
    </div>
  );
}
