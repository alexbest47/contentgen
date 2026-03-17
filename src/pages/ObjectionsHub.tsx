import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldQuestion, ChevronRight } from "lucide-react";

export default function ObjectionsHub() {
  const navigate = useNavigate();

  const { data: programs, isLoading } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paid_programs")
        .select("id, title")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Работа с возражениями</h1>
        <p className="text-muted-foreground">Выберите программу для управления возражениями</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />Загрузка...
        </div>
      ) : !programs?.length ? (
        <p className="text-muted-foreground">Нет платных программ</p>
      ) : (
        <div className="grid gap-3">
          {programs.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/programs/${p.id}/objections`)}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <ShieldQuestion className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 font-medium">{p.title}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
