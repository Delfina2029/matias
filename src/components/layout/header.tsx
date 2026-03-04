import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-8 h-8 text-primary", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18" />
      <path d="M3 10h18" />
      <path d="M4 10v11" />
      <path d="M20 10v11" />
      <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
      <path d="M4 10V3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v7" />
    </svg>
  );
}


export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {children ? children : (
            <div className="flex items-center gap-2">
              <Logo />
              <h1 className="text-xl font-bold font-headline text-foreground">
                Constructor de Cocinas
              </h1>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
