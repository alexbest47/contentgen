import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import CreateChainWizard from "@/components/chains/CreateChainWizard";

function computeChainStatus(letters: any[]): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!letters?.length) return { label: "Пусто", variant: "secondary" };
  const hasError = letters.some((l: any) => l.status === "error");
  const allReady = letters.every((l: any) => l.status === "ready");
  const hasProcessing = letters.some((l: any) => l.status === "processing");
  const hasPending = letters.some((l: any) => l.status === "pending");

  if (allReady) return { label: "Готово", variant: "default" };
  if (hasError) return { label: "Есть ошибки", variant: "destructive" };
  if (hasProcessing) return { label: "Выполняется", variant: "outline" };
  if (hasPending) return { label: "В очереди", variant: "secondary" };
  return { label: "В процессе", variant: "outline" };
}

export default function EmailChainList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: chains, isLoading } = useQuery({
    queryKey: ["email_chains"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_chains" as any)
        .select("*, email_chain_templates(name), email_chain_letters(status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_chains" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_chains"] });
      toast.success("Цепочка удалена");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const OFFER_TYPE_LABELS: Record<string, string> = {
    mini_course: "Мини-курс", diagnostic: "Диагностика", webinar: "Вебинар",
    pre_list: "Предсписок", new_stream: "Старт потока", spot_available: "Место",
    discount: "Промокод", download_pdf: "PDF",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Конструктор цепочек</h1>
          <p className="text-muted-foreground">Автоматические серии писем</p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новая цепочка
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : !chains?.length ? (
        <div className="py-12 text-center text-muted-foreground border rounded-lg">
          Нет цепочек. Создайте первую!
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Шаблон</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chains.map((chain: any) => {
              const st = computeChainStatus(chain.email_chain_letters || []);
              return (
                <TableRow key={chain.id}>
                  <TableCell className="font-medium">{chain.title || "Без названия"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {chain.email_chain_templates?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(chain.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/email-chains/${chain.id}`)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(chain.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <CreateChainWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
