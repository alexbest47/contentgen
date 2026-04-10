import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { Plus, Loader2, Eye, Pencil, Trash2, RefreshCw, Download } from "lucide-react";
import JSZip from "jszip";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/offer/ImageUploadField";
import { uploadOfferImage } from "@/lib/uploadOfferImage";

interface EditingDiag {
  id: string;
  name: string;
  description: string;
  doc_url: string;
  test_url: string;
  program_id: string;
  image_url: string;
}

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  generating: "Генерация...",
  quiz_generated: "Тест сгенерирован",
  ready: "Готово",
  active: "Активна",
  error: "Ошибка",
};

const statusVariant = (s: string) => {
  if (s === "ready" || s === "active") return "default" as const;
  if (s === "error") return "destructive" as const;
  return "secondary" as const;
};

export default function Diagnostics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingDiag, setEditingDiag] = useState<EditingDiag | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [exporting, setExporting] = useState(false);

  const sanitizeFolderName = (s: string) =>
    (s || "без_названия").replace(/[\\/:*?"<>|]+/g, "_").trim().slice(0, 120) || "без_названия";

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("diagnostics")
        .select("id, name, quiz_json, card_prompt, program_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rawRows = (data || []).filter((d: any) => d.quiz_json || d.card_prompt);
      const programIds = Array.from(new Set(rawRows.map((r: any) => r.program_id).filter(Boolean)));
      const programTitleById = new Map<string, string>();
      if (programIds.length > 0) {
        const { data: progs } = await supabase
          .from("paid_programs")
          .select("id, title")
          .in("id", programIds);
        (progs || []).forEach((p: any) => programTitleById.set(p.id, p.title));
      }
      const rows = rawRows.map((r: any) => ({
        ...r,
        _programTitle: programTitleById.get(r.program_id) || "Без программы",
      }));
      if (rows.length === 0) {
        toast.error("Нет диагностик для выгрузки");
        return;
      }
      const zip = new JSZip();
      const usedNames = new Map<string, number>();
      for (const d of rows as any[]) {
        const programTitle = d._programTitle || "Без программы";
        let folderBase = sanitizeFolderName(programTitle);
        // If multiple diagnostics share the same program, suffix with diagnostic name
        const existing = rows.filter((r: any) => (r._programTitle || "Без программы") === programTitle);
        if (existing.length > 1) {
          folderBase = `${folderBase}/${sanitizeFolderName(d.name || d.id)}`;
        }
        const count = (usedNames.get(folderBase) || 0) + 1;
        usedNames.set(folderBase, count);
        const folderName = count > 1 ? `${folderBase} (${count})` : folderBase;
        const folder = zip.folder(folderName)!;
        if (d.quiz_json) {
          folder.file("тест.json", JSON.stringify(d.quiz_json, null, 2));
        }
        if (d.card_prompt) {
          // card_prompt may already be JSON text or plain; wrap minimal JSON
          let cardContent: string;
          try {
            JSON.parse(d.card_prompt);
            cardContent = d.card_prompt;
          } catch {
            cardContent = JSON.stringify({ card_prompt: d.card_prompt }, null, 2);
          }
          folder.file("карта.json", cardContent);
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagnostics-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Выгружено диагностик: ${rows.length}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Ошибка выгрузки");
    } finally {
      setExporting(false);
    }
  };

  const { data: diagnostics, isLoading } = useQuery({
    queryKey: ["diagnostics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostics")
        .select("id, name, description, status, created_at, program_id, prompt_id, doc_url, test_url, image_url, audience_tags")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allPrograms } = useQuery({
    queryKey: ["paid_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("id, title").order("title");
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
    mutationFn: async ({ diag, imageFile }: { diag: EditingDiag; imageFile: File | null }) => {
      let imageUrl = diag.image_url || null;
      if (imageFile && user) {
        imageUrl = await uploadOfferImage(imageFile, user.id);
      }
      const { error } = await supabase
        .from("diagnostics")
        .update({
          name: diag.name,
          description: diag.description || null,
          doc_url: diag.doc_url || null,
          test_url: diag.test_url || null,
          program_id: diag.program_id,
          image_url: imageUrl,
        } as any)
        .eq("id", diag.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diagnostics"] });
      toast.success("Диагностика обновлена");
      setEditingDiag(null);
      setEditImageFile(null);
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
    await supabase.functions.invoke("enqueue-task", {
      body: {
        function_name: "run-diagnostic-pipeline",
        payload: {
          diagnostic_id: d.id,
          program_id: d.program_id,
          name: d.name,
          description: d.description || "",
          audience_tags: d.audience_tags || [],
          prompt_id: d.prompt_id,
        },
        display_title: `Перегенерация диагностики: ${d.name}`,
        lane: "claude",
        target_url: `/diagnostics/${d.id}`,
      },
    });
    toast.success("Задача добавлена в очередь");
    navigate(`/diagnostics/${d.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Диагностики</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportAll} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Выгрузить все (ZIP)
          </Button>
          <Button onClick={() => navigate("/create-diagnostic")}>
            <Plus className="h-4 w-4 mr-2" />
            Создать диагностику
          </Button>
        </div>
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
                        onClick={() => {
                          setEditImageFile(null);
                          setEditingDiag({
                            id: d.id,
                            name: d.name,
                            description: (d as any).description || "",
                            doc_url: (d as any).doc_url || "",
                            test_url: (d as any).test_url || "",
                            program_id: d.program_id,
                            image_url: (d as any).image_url || "",
                          });
                        }}
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {(d.status === "ready" || d.status === "active" || d.status === "error") && (
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

      <Dialog open={!!editingDiag} onOpenChange={(open) => { if (!open) { setEditingDiag(null); setEditImageFile(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать диагностику</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Программа</Label>
              <Select
                value={editingDiag?.program_id || ""}
                onValueChange={(val) => setEditingDiag((prev) => prev ? { ...prev, program_id: val } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите программу" />
                </SelectTrigger>
                <SelectContent>
                  {allPrograms?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                placeholder="Описание диагностики"
                rows={3}
              />
            </div>
            <ImageUploadField
              imageFile={editImageFile}
              setImageFile={setEditImageFile}
              existingUrl={editingDiag?.image_url || null}
            />
            <div className="space-y-2">
              <Label>Ссылка на описание</Label>
              <Input
                value={editingDiag?.doc_url || ""}
                onChange={(e) => setEditingDiag((prev) => prev ? { ...prev, doc_url: e.target.value } : null)}
                placeholder="Google Doc или Talentsy KB ссылка"
              />
              <p className="text-xs text-muted-foreground">Поддерживаются ссылки на Google Docs и Talentsy KB (talentsy-kb.vercel.app/share/tk_...)</p>
            </div>
            <div className="space-y-2">
              <Label>Ссылка на тест</Label>
              <Input
                value={editingDiag?.test_url || ""}
                onChange={(e) => setEditingDiag((prev) => prev ? { ...prev, test_url: e.target.value } : null)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingDiag(null); setEditImageFile(null); }}>Отмена</Button>
            <Button
              disabled={updateMutation.isPending || !editingDiag?.name.trim() || !editingDiag?.program_id}
              onClick={() => editingDiag && updateMutation.mutate({ diag: editingDiag, imageFile: editImageFile })}
            >
              {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}