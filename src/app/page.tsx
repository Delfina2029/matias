import { Header } from '@/components/layout/header';
import { KitchenBuilder } from '@/components/kitchen-builder';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <KitchenBuilder />
      </main>
    </div>
  );
}
