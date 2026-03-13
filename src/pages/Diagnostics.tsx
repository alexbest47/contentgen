import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Loader2, Eye, Pencil } from "lucide-react";

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  generating: "Генерация...",
  quiz_generated: "Тест сгенерирован",
  ready: "Готово",
  error: "Ошибка",
};

const statusVariant = (s: string) => {
  if (s === "ready") return "default" as const;
  if (s === "error") return "destructive" as const;
  return "secondary" as const;
};

export default function Diagnostics() {
  const navigate = useNavigate();

  const { data: diagnostics, isLoading } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostics")
        .select("id, name, status, created_at, program_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const programIds = [...new Set((diagnostics || []).map((d) => d.program_id))];

  const { data: programs } = useQuery({
    queryKey: ["programs_for_diagnostics", programIds],
    queryFn: async () => {
      if (programIds.length === 0) return [];
      const { data, error } = await supabase
        .from("paid_programs")
        .select("id, title")
        .in("id", programIds);
      if (error) throw error;
      return data;
    },
    enabled: programIds.length > 0,
  });

  const programMap = Object.fromEntries((programs || []).map((p) => [p.id, p.title]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Диагностики</h1>
        <Button onClick={() => navigate("/create-diagnostic")}>
          <Plus className="h-4 w-4 mr-2" />
          Создать диагностику
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !diagnostics?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Нет диагностик. Создайте первую!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Программа</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnostics.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {programMap[d.program_id] || "—"}
                    </TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(d.status)}>
                        {statusLabels[d.status] || d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/diagnostics/${d.id}`)}
                      >
                        {d.status === "draft" ? (
                          <>
                            <Pencil className="h-4 w-4 mr-1" />
                            Редактировать
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Открыть
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
