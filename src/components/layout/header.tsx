'use client';

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { CloudUpload, CloudDownload, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

function NidelLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center rounded-xl font-black text-white select-none", className)}
      style={{
        width: 38,
        height: 38,
        background: "linear-gradient(135deg, #c8a96e, #a07840)",
        fontSize: 20,
        boxShadow: "0 2px 12px rgba(200,169,110,0.45)",
        letterSpacing: "-1px",
      }}
      aria-hidden="true"
    >
      N
    </div>
  );
}

export function Header({
  children,
  onOpenMaterials,
  onOpenSaveCloud,
  onOpenLoadCloud,
  onBackToMenu,
  hideActionButtons,
}: {
  children?: ReactNode;
  onOpenMaterials?: () => void;
  onOpenSaveCloud?: () => void;
  onOpenLoadCloud?: () => void;
  onBackToMenu?: () => void;
  hideActionButtons?: boolean;
}) {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar sesión." });
    }
  };

  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: "linear-gradient(180deg, #0f0f18 0%, #13131f 100%)",
        borderBottom: "1px solid rgba(200,169,110,0.15)",
        boxShadow: "0 2px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-[60px]">

          {/* ── Brand ── */}
          <div className="flex items-center gap-3">
            <NidelLogo />
            <div className="leading-tight">
              <p className="font-bold text-base tracking-tight" style={{ color: "#f0ece4" }}>
                Nidel Muebles
              </p>
              <p className="text-[11px] font-medium" style={{ color: "#7a7a9a" }}>
                Constructor de Cocinas
              </p>
            </div>
            {onBackToMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToMenu}
                className="ml-4 flex items-center gap-2 h-8 px-3 text-xs font-semibold rounded-lg border border-[#2a2a4a] hover:bg-[#1a1a2e]"
                style={{ color: "#a0a0c0" }}
              >
                Volver al Menú
              </Button>
            )}
          </div>

          {/* ── Mobile children slot ── */}
          {children ? (
            <div className="flex items-center gap-2 ml-auto">{children}</div>
          ) : !hideActionButtons ? (
            /* ── Desktop action buttons ── */
            <div className="flex items-center gap-2">
              <Button
                id="header-save-cloud"
                variant="ghost"
                size="sm"
                onClick={onOpenSaveCloud}
                className="hidden sm:flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-lg"
                style={{ color: "#a0a0c0" }}
                title="Guardar en la Nube"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Guardar</span>
              </Button>

              <Button
                id="header-load-cloud"
                variant="ghost"
                size="sm"
                onClick={onOpenLoadCloud}
                className="hidden sm:flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-lg"
                style={{ color: "#a0a0c0" }}
                title="Cargar de la Nube"
              >
                <CloudDownload className="w-4 h-4" />
                <span>Cargar</span>
              </Button>

              <div
                style={{
                  width: 1,
                  height: 24,
                  background: "rgba(200,169,110,0.2)",
                  margin: "0 4px",
                }}
                className="hidden sm:block"
              />

              <Button
                id="header-materials"
                variant="ghost"
                size="sm"
                onClick={onOpenMaterials}
                className="hidden sm:flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-lg"
                style={{ color: "#a0a0c0" }}
                title="Editar Materiales"
              >
                <Settings className="w-4 h-4" />
                <span>Materiales</span>
              </Button>

              <div
                style={{
                  width: 1,
                  height: 24,
                  background: "rgba(200,169,110,0.2)",
                  margin: "0 4px",
                }}
              />

              <Button
                id="header-logout"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-lg transition-all"
                style={{ color: "#c8a96e" }}
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <Button
                id="header-logout-only"
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 h-9 px-3 text-xs font-semibold rounded-lg transition-all"
                style={{ color: "#c8a96e" }}
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
