import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cabinetCategories } from '@/lib/cabinets';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type CabinetSelectorProps = {
  onSelectCabinet: (cabinetId: string) => void;
};

export function CabinetSelector({ onSelectCabinet }: CabinetSelectorProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Seleccionar Gabinetes</CardTitle>
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
                                        className="flex items-center justify-between py-1.5 px-2 border rounded-md bg-background hover:bg-secondary transition-colors"
                                    >
                                        <span className="text-sm">{cabinet.name}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => onSelectCabinet(cabinet.id)}
                                            aria-label={`Añadir ${cabinet.name}`}
                                        >
                                            Añadir
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
