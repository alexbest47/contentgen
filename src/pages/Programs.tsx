import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function Programs() {
  const navigate = useNavigate();

  const { data: programs, isLoading } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("*, program_tags(tags(id, name))").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Создание контента</h1>
        <p className="text-muted-foreground">Выберите программу для создания контента</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Загрузка...</div>
      ) : programs?.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Нет программ. Создайте программу в разделе «Подготовка контента → Платные программы»</CardContent></Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {programs?.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/programs/${p.id}`)}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{p.title}</div>
                {p.description && <div className="text-sm text-muted-foreground line-clamp-1">{p.description}</div>}
                {(p as any).program_tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(p as any).program_tags.map((pt: any) => (
                      <Badge key={pt.tags?.id} variant="secondary" className="text-xs py-0 px-1.5">
                        {pt.tags?.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0 text-sm text-muted-foreground">
                {(p as any).audience_doc_url && <span>📄</span>}
                <span>{new Date(p.created_at).toLocaleDateString("ru-RU")}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
