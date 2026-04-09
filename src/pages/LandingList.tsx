import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Copy, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import CreateLandingWizard from "@/components/landing-builder/CreateLandingWizard";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Черновик", variant: "secondary" },
  published: { label: "Опубликован", variant: "default" },
  archived: { label: "В архиве", variant: "outline" },
};

export default function LandingList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: landings, isLoading } = useQuery({
    queryKey: ["landings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landings")
        .select("*, landing_templates(name, slug), paid_programs(title)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (landingId: string) => {
      const original = landings?.find((l: any) => l.id === landingId);
      if (!original) throw new Error("Лендинг не найден");
      const { data: newLanding, error } = await supabase
        .from("landings")
        .insert({
          name: `${original.name} (копия)`,
          template_id: original.template_id,
          program_id: original.program_id,
          status: "draft",
          created_by: user!.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      // Copy blocks
      const { data: blocks } = await supabase
        .from("landing_blocks")
        .select("*")
        .eq("landing_id", landingId)
        .order("sort_order");
      if (blocks && blocks.length > 0) {
        const newBlocks = blocks.map((b: any) => ({
          landing_id: (newLanding as any).id,
          block_definition_id: b.block_definition_id,
          sort_order: b.sort_order,
          is_visible: b.is_visible,
          settings: b.settings,
          content_overrides: b.content_overrides,
          custom_css: b.custom_css,
        }));
        await supabase.from("landing_blocks").insert(newBlocks);
      }
      return newLanding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landings"] });
      toast.success("Лендинг дублирован");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("landings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landings"] });
      toast.success("Лендинг удалён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Конструктор лендингов</h1>
          <p className="text-muted-foreground">Визуальная сборка лендингов из готовых блоков</p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Новый лендинг
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : !landings?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">Пока нет лендингов</p>
          <Button variant="outline" onClick={() => setWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать первый лендинг
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Шаблон</TableHead>
              <TableHead>Программа</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Обновлено</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {landings.map((landing: any) => {
              const status = STATUS_MAP[landing.status] || STATUS_MAP.draft;
              return (
                <TableRow key={landing.id} className="cursor-pointer" onClick={() => navigate(`/landings/${landing.id}`)}>
                  <TableCell className="font-medium">{landing.name}</TableCell>
                  <TableCell>{landing.landing_templates?.name || "—"}</TableCell>
                  <TableCell>{landing.paid_programs?.title || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {landing.updated_at ? format(new Date(landing.updated_at), "d MMM yyyy, HH:mm", { locale: ru }) : "—"}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Предпросмотр"
                        onClick={() => navigate(`/landings/${landing.id}/preview`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Открыть в конструкторе"
                        onClick={() => navigate(`/landings/${landing.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Дублировать"
                        onClick={() => duplicateMutation.mutate(landing.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Удалить"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Удалить лендинг?")) deleteMutation.mutate(landing.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <CreateLandingWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
