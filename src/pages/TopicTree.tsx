import { useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Plus, Search, Upload, ChevronRight, ChevronDown,
  Pencil, Trash2, Check, X, Loader2,
} from "lucide-react";

interface TopicRow {
  id: string;
  parent_id: string | null;
  title: string;
  description: string;
  tags: string[];
  sort_order: number;
  created_by: string;
}

interface TreeNode extends TopicRow {
  children: TreeNode[];
}

function buildTree(rows: TopicRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);
  return roots;
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  const filter = (ns: TreeNode[]): TreeNode[] =>
    ns
      .map((n) => {
        const childrenFiltered = filter(n.children);
        if (n.title.toLowerCase().includes(q) || childrenFiltered.length > 0) {
          return { ...n, children: childrenFiltered };
        }
        return null;
      })
      .filter(Boolean) as TreeNode[];
  return filter(nodes);
}

function TopicNode({
  node,
  onAdd,
  onEdit,
  onDelete,
  depth = 0,
}: {
  node: TreeNode;
  onAdd: (parentId: string) => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (id: string) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="group flex items-start gap-1.5 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button className="mt-0.5 p-0.5 rounded hover:bg-muted">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{node.title}</span>
              {node.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">
                  {t}
                </Badge>
              ))}
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{node.description}</p>
            )}
          </div>
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAdd(node.id)}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(node)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(node.id)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            {node.children.map((child) => (
              <TopicNode
                key={child.id}
                node={child}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export default function TopicTree() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editNode, setEditNode] = useState<Partial<TopicRow> | null>(null);
  const [importDialog, setImportDialog] = useState(false);
  const [importData, setImportData] = useState<any[] | null>(null);
  const [importing, setImporting] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["topic_tree"],
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_tree").select("*").order("sort_order");
      if (error) throw error;
      return data as TopicRow[];
    },
  });

  const tree = useMemo(() => buildTree(rows ?? []), [rows]);
  const filtered = useMemo(() => filterTree(tree, search), [tree, search]);

  const openAdd = (parentId: string | null) => {
    setEditNode({ parent_id: parentId, title: "", description: "", tags: [] });
    setEditDialog(true);
  };

  const openEdit = (node: TreeNode) => {
    setEditNode({ ...node });
    setEditDialog(true);
  };

  const saveNode = async () => {
    if (!editNode?.title?.trim()) return;
    try {
      if (editNode.id) {
        await supabase.from("topic_tree").update({
          title: editNode.title,
          description: editNode.description || "",
          tags: editNode.tags || [],
        }).eq("id", editNode.id);
      } else {
        const maxOrder = (rows ?? []).filter((r) => r.parent_id === (editNode.parent_id || null)).length;
        await supabase.from("topic_tree").insert({
          parent_id: editNode.parent_id || null,
          title: editNode.title,
          description: editNode.description || "",
          tags: editNode.tags || [],
          sort_order: maxOrder,
          created_by: user!.id,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["topic_tree"] });
      setEditDialog(false);
      toast.success(editNode.id ? "Тема обновлена" : "Тема добавлена");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteNode = async (id: string) => {
    await supabase.from("topic_tree").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["topic_tree"] });
    toast.success("Тема удалена");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error("Ожидается массив");
        setImportData(parsed);
        setImportDialog(true);
      } catch (err: any) {
        toast.error("Ошибка парсинга JSON: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const getChildren = (item: any): any[] =>
    item.children || item.subtopics || item.topics || item.sub_topics || item.items || [];

  const doImport = async (mode: "append" | "replace") => {
    if (!importData) return;
    setImporting(true);
    try {
      if (mode === "replace") {
        const ids = (rows ?? []).map((r) => r.id);
        if (ids.length) await supabase.from("topic_tree").delete().in("id", ids);
      }

      let count = 0;
      const insertRecursive = async (items: any[], parentId: string | null, startOrder: number) => {
        if (!items.length) return;
        const toInsert = items.map((item, i) => ({
          parent_id: parentId,
          title: item.title,
          description: item.description || "",
          tags: item.tags || [],
          sort_order: startOrder + i,
          created_by: user!.id,
        }));
        const { data, error } = await supabase
          .from("topic_tree")
          .insert(toInsert)
          .select("id");
        if (error) throw error;
        count += data.length;
        for (let i = 0; i < items.length; i++) {
          const kids = getChildren(items[i]);
          if (kids.length) {
            await insertRecursive(kids, data[i].id, 0);
          }
        }
      };

      const startOrder = mode === "append" ? (rows ?? []).filter((r) => !r.parent_id).length : 0;
      await insertRecursive(importData, null, startOrder);

      queryClient.invalidateQueries({ queryKey: ["topic_tree"] });
      setImportDialog(false);
      setImportData(null);
      toast.success(`Импортировано ${count} тем`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Дерево тем</h1>
          <p className="text-muted-foreground">Темы для писем и контента</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
            <Upload className="h-4 w-4" /> Импорт JSON
          </Button>
          <Button onClick={() => openAdd(null)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Добавить тему
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground border rounded-lg border-dashed">
          {search ? "Ничего не найдено" : "Нет тем. Добавьте первую или импортируйте JSON!"}
        </div>
      ) : (
        <div className="border rounded-lg p-3">
          {filtered.map((node) => (
            <TopicNode
              key={node.id}
              node={node}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={deleteNode}
            />
          ))}
        </div>
      )}

      {/* Edit/Add dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editNode?.id ? "Редактирование темы" : "Новая тема"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Название</label>
              <Input
                value={editNode?.title || ""}
                onChange={(e) => setEditNode((n) => n ? { ...n, title: e.target.value } : n)}
                placeholder="Например: Выгорание"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Описание</label>
              <Textarea
                value={editNode?.description || ""}
                onChange={(e) => setEditNode((n) => n ? { ...n, description: e.target.value } : n)}
                placeholder="2-4 предложения о теме"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Теги (через запятую)</label>
              <Input
                value={(editNode?.tags || []).join(", ")}
                onChange={(e) =>
                  setEditNode((n) =>
                    n ? { ...n, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) } : n
                  )
                }
                placeholder="боль, страх, барьер"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Отмена</Button>
            <Button onClick={saveNode} disabled={!editNode?.title?.trim()}>
              {editNode?.id ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Импорт тем из JSON</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Найдено {importData?.length || 0} тем верхнего уровня. Как загрузить?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)} disabled={importing}>
              Отмена
            </Button>
            <Button variant="secondary" onClick={() => doImport("append")} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Добавить к существующим
            </Button>
            <Button variant="destructive" onClick={() => doImport("replace")} disabled={importing}>
              Заменить всё
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
