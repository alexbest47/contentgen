import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Eye, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingDiag, setEditingDiag] = useState<{ id: string; name: string; doc_url: string } | null>(null);

  const { data: diagnostics, isLoading } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostics")
        .select("id, name, status, created_at, program_id, prompt_id, doc_url, audience_tags")
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diagnostics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      toast.success("Диагностика удалена");
    },
    onError: () => {
      toast.error("Не удалось удалить диагностику");
    },
  });

  const programMap = Object.fromEntries((programs || []).map((p) => [p.id, p.title]));

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      const { error } = await supabase.from("diagnostics").update({ name, description }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      toast.success("Диагностика обновлена");
      setEditingDiag(null);
    },
    onError: () => {
      toast.error("Не удалось обновить диагностику");
    },
  });

  const handleRegenerate = async (d: any) => {
    const { error } = await supabase
      .from("diagnostics")
      .update({ status: "generating", generation_progress: null, quiz_json: null, thank_you_json: null, card_prompt: null })
      .eq("id", d.id);
    if (error) {
      toast.error("Не удалось запустить перегенерацию");
      return;
    }
    supabase.functions.invoke("run-diagnostic-pipeline", {
      body: {
        diagnostic_id: d.id,
        program_id: d.program_id,
        name: d.name,
        description: d.description || "",
        audience_tags: d.audience_tags || [],
        prompt_id: d.prompt_id,
      },
    });
    toast.success("Перегенерация запущена");
    navigate(`/diagnostics/${d.id}`);
  };

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
                    <TableCell className="text-right space-x-1">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingDiag({ id: d.id, name: d.name, description: d.description || "" })}
                        title="Редактировать название/описание"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {(d.status === "ready" || d.status === "error") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate(d)}
                          title="Перегенерировать"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingId(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить диагностику?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Диагностика будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingId) deleteMutation.mutate(deletingId);
                setDeletingId(null);
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingDiag} onOpenChange={(open) => !open && setEditingDiag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать диагностику</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={editingDiag?.name || ""}
                onChange={(e) => setEditingDiag((prev) => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={editingDiag?.description || ""}
                onChange={(e) => setEditingDiag((prev) => prev ? { ...prev, description: e.target.value } : null)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDiag(null)}>Отмена</Button>
            <Button
              disabled={updateMutation.isPending || !editingDiag?.name.trim()}
              onClick={() => editingDiag && updateMutation.mutate(editingDiag)}
            >
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}