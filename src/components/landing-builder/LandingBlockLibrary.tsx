import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  onAddBlock: (blockDefinitionId: string) => void;
}

export default function LandingBlockLibrary({ onAddBlock }: Props) {
  const { data: definitions, isLoading } = useQuery({
    queryKey: ["landing_block_definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_block_definitions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  // Group by category
  const grouped = (definitions || []).reduce<Record<string, any[]>>((acc, def) => {
    const cat = def.category || "Прочее";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(def);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">Библиотека блоков</h3>
        <p className="text-xs text-muted-foreground mt-1">Нажмите +, чтобы добавить блок</p>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={categories} className="px-2">
            {categories.map((category) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider py-2">
                  {category}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {grouped[category].map((def: any) => (
                      <div
                        key={def.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent group cursor-pointer text-sm"
                        onClick={() => onAddBlock(def.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{def.name}</p>
                          {def.description && (
                            <p className="text-xs text-muted-foreground truncate">{def.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddBlock(def.id);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  );
}
