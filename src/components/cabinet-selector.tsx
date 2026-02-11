import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cabinetData } from '@/lib/cabinets';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type CabinetSelectorProps = {
  onSelectCabinet: (cabinetId: string) => void;
};

export function CabinetSelector({ onSelectCabinet }: CabinetSelectorProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Select Cabinets</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-3">
            {cabinetData.map((cabinet) => (
              <div
                key={cabinet.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <cabinet.icon className="w-8 h-8 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">{cabinet.name}</span>
                    <span className="text-xs text-muted-foreground">{`${cabinet.width}x${cabinet.height}x${cabinet.depth}mm`}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectCabinet(cabinet.id)}
                  aria-label={`Add ${cabinet.name}`}
                >
                  <PlusCircle className="w-5 h-5 text-accent-foreground/80 hover:text-accent-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
