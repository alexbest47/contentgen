import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Upload, Pencil, Trash2, Search, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function Objections() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [addingNew, setAddingNew] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTags, setNewTags] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTags, setEditTags] = useState("");
  const [importDialog, setImportDialog] = useState<{ data: any[]; skipped: number } | null>(null);

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn: async () => {
      const { data, error } = await supabase.from("paid_programs").select("title").eq("id", programId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: objections, isLoading } = useQuery({
    queryKey: ["objections", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objections" as any)
        .select("*")
        .eq("program_id", programId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = (objections ?? []).filter((o) =>
    o.objection_text.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!newText.trim()) throw new Error("Введите текст возражения");
      const tags = newTags.split(",").map(t => t.trim()).filter(Boolean);
      const { error } = await supabase.from("objections" as any).insert({
        program_id: programId,
        objection_text: newText.trim(),
        tags,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objections", programId] });
      setAddingNew(false);
      setNewText("");
      setNewTags("");
      toast.success("Возражение добавлено");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editText.trim()) throw new Error("Текст не может быть пустым");
      const tags = editTags.split(",").map(t => t.trim()).filter(Boolean);
      const { error } = await supabase.from("objections" as any).update({
        objection_text: editText.trim(),
        tags,
      }).eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objections", programId] });
      setEditingId(null);
      toast.success("Возражение обновлено");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("objections" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objections", programId] });
      toast.success("Возражение удалено");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("not array");
      const valid = parsed.filter((item: any) => item.objection_text && typeof item.objection_text === "string");
      const skipped = parsed.length - valid.length;
      if (valid.length === 0) {
        toast.error("Файл не содержит валидных записей");
        return;
      }
      setImportDialog({ data: valid, skipped });
    } catch {
      toast.error("Файл не распознан. Проверьте формат JSON");
    }
  };

  const doImport = async (replace: boolean) => {
    if (!importDialog) return;
    try {
      if (replace) {
        await supabase.from("objections" as any).delete().eq("program_id", programId!);
      }
      const inserts = importDialog.data.map((item: any) => ({
        program_id: programId,
        objection_text: item.objection_text.slice(0, 200),
        tags: Array.isArray(item.tags) ? item.tags : [],
        created_by: user!.id,
      }));
      const { error } = await supabase.from("objections" as any).insert(inserts);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["objections", programId] });
      if (importDialog.skipped > 0) {
        toast.warning(`Пропущено ${importDialog.skipped} записей без текста возражения`);
      }
      toast.success(`Импортировано ${importDialog.data.length} возражений`);
    } catch (err: any) {
      toast.error(err.message || "Ошибка импорта");
    }
    setImportDialog(null);
  };

  const startEdit = (obj: any) => {
    setEditingId(obj.id);
    setEditText(obj.objection_text);
    setEditTags((obj.tags || []).join(", "));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/programs/${programId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Работа с возражениями</h1>
          <p className="text-muted-foreground">{program?.title ?? "..."}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => { setAddingNew(true); setNewText(""); setNewTags(""); }}>
          <Plus className="h-4 w-4 mr-2" />Добавить возражение
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />Импорт JSON
        </Button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Поиск..."
            className="pl-9 w-[240px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Загрузка...</div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Текст возражения</TableHead>
                  <TableHead>Теги</TableHead>
                  <TableHead className="w-[120px]">Дата</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addingNew && (
                  <TableRow>
                    <TableCell>—</TableCell>
                    <TableCell>
                      <Input value={newText} onChange={(e) => setNewText(e.target.value.slice(0, 200))} placeholder="Текст возражения (до 200 символов)" autoFocus />
                    </TableCell>
                    <TableCell>
                      <Input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="Теги через запятую" />
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setAddingNew(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {paginated.length === 0 && !addingNew ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {search ? "Ничего не найдено" : "Нет возражений. Добавьте первое!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((obj, idx) => (
                    <TableRow key={obj.id}>
                      <TableCell className="text-muted-foreground">{page * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell>
                        {editingId === obj.id ? (
                          <Input value={editText} onChange={(e) => setEditText(e.target.value.slice(0, 200))} autoFocus />
                        ) : (
                          <span className="text-sm">{obj.objection_text}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === obj.id ? (
                          <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Теги через запятую" />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(obj.tags || []).map((t: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(obj.created_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingId === obj.id ? (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => startEdit(obj)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => deleteMutation.mutate(obj.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Назад</Button>
                <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Далее</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import dialog */}
      <Dialog open={!!importDialog} onOpenChange={(o) => !o && setImportDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Импорт возражений</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Найдено {importDialog?.data.length} валидных записей.
            {(importDialog?.skipped ?? 0) > 0 && ` Будет пропущено ${importDialog?.skipped} записей без текста.`}
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => doImport(false)}>Добавить к существующим</Button>
            <Button variant="destructive" onClick={() => doImport(true)}>Заменить всё</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
