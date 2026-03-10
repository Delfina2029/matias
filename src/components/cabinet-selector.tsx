import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cabinetCategories } from '@/lib/cabinets';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type CabinetSelectorProps = {
  onSelectCabinet: (cabinetId: string) => void;
};

export function CabinetSelector({ onSelectCabinet }: CabinetSelectorProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Seleccionar Gabinetes</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-3 pt-0">
        <ScrollArea className="h-full pr-3">
            <Accordion type="multiple" className="w-full">
                {cabinetCategories.map((category) => (
                    <AccordionItem value={category.name} key={category.name}>
                        <AccordionTrigger className="text-sm font-semibold py-2 hover:no-underline">
                            {category.name}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-1 pt-1">
                                {category.cabinets.map((cabinet) => (
                                    <div
                                        key={cabinet.id}
                                        className="flex items-center justify-between p-2 border rounded-lg bg-background hover:bg-secondary transition-colors"
                                    >
                                        <span className="text-sm font-medium">{cabinet.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onSelectCabinet(cabinet.id)}
                                            aria-label={`Añadir ${cabinet.name}`}
                                        >
                                            <PlusCircle className="w-5 h-5 text-accent-foreground/80 hover:text-accent-foreground" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
