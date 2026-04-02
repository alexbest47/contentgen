import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { blockTypeLabels } from "@/components/email-builder/BlockLibrary";
import { Loader2 } from "lucide-react";

interface TemplateBlock {
  block_type: string;
  label?: string;
  mode: string;
}

const MODE_LABELS: Record<string, string> = {
  text_only: "Только текст",
  header_image: "Заголовок + текст",
  schema_image: "Текст + схема",
  card_text: "Карточка + текст",
  schema_text: "Схема + текст",
  html_cards: "HTML-карточки",
  accent_block: "Акцентный блок",
  text_button: "Текст + кнопка",
  qa_cards: "Карточки Q&A",
};

const CATEGORY_LABELS: Record<string, string> = {
  paid_programs: "Платные программы",
  webinar: "Вебинары",
};

const ALL_CATEGORIES = ["paid_programs", "webinar"];

export default function EmailTemplates() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["email_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const grouped = ALL_CATEGORIES.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    items: templates?.filter((t: any) => t.category === cat) || [],
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Шаблоны писем</h1>
        <p className="text-muted-foreground">Предустановленные структуры для конструктора писем</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.category} className="space-y-4">
            <h2 className="text-lg font-semibold">{group.label}</h2>
            {group.items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Шаблоны пока не добавлены</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((tpl: any) => {
                  const blocks = (tpl.blocks as unknown as TemplateBlock[]) || [];
                  return (
                    <Card key={tpl.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{tpl.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{tpl.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {blocks.map((b, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between gap-2 text-sm border rounded-md px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                                <span>{b.label || blockTypeLabels[b.block_type as keyof typeof blockTypeLabels] || b.block_type}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {MODE_LABELS[b.mode] || b.mode}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
