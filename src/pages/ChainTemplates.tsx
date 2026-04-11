import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail } from "lucide-react";

export default function ChainTemplates() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["email_chain_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_chain_templates" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Шаблоны цепочек</h1>
        <p className="text-muted-foreground">Шаблоны автоматических email-цепочек</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : !templates?.length ? (
        <div className="py-12 text-center text-muted-foreground border rounded-lg">
          Нет шаблонов цепочек
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => (
            <Card key={t.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                <Badge variant="secondary">{t.letter_count} писем</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
