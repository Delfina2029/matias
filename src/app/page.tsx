import { KitchenBuilder } from '@/components/kitchen-builder';

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      <KitchenBuilder />
    </div>
  );
}
