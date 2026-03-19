import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Check, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (caseId: string) => void;
  selectedCaseId: string | null;
}

export default function CasePickerDialog({ open, onOpenChange, onSelect, selectedCaseId }: Props) {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const { data: classifications } = useQuery({
    queryKey: ["case-classifications-picker"],
    queryFn: async () => {
      const { data } = await supabase
        .from("case_classifications")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as Array<{
        id: string;
        file_name: string;
        source_url: string | null;
        classification_json: any;
        created_at: string;
      }>;
    },
    enabled: open,
  });

  // Extract unique video types
  const videoTypes = useMemo(() => {
    if (!classifications) return [];
    const set = new Set<string>();
    classifications.forEach((c) => {
      const vt = c.classification_json?.video_type;
      if (vt) set.add(vt);
    });
    return Array.from(set).sort();
  }, [classifications]);

  // Extract top-15 most frequent tags
  const topTags = useMemo(() => {
    if (!classifications) return [];
    const counts = new Map<string, number>();
    classifications.forEach((c) => {
      const tags: string[] = c.classification_json?.tags || [];
      tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);
  }, [classifications]);

  // Filter
  const filtered = useMemo(() => {
    if (!classifications) return [];
    const q = search.toLowerCase();
    return classifications.filter((c) => {
      const j = c.classification_json || {};
      const vt = j.video_type || "";
      const tags: string[] = j.tags || [];

      if (activeTypes.length > 0 && !activeTypes.includes(vt)) return false;
      if (activeTags.length > 0 && !activeTags.some((at) => tags.includes(at))) return false;

      if (!q) return true;
      const name = (j.student_name || "").toLowerCase();
      const file = c.file_name.toLowerCase();
      const products: string[] = j.products || [];
      return (
        name.includes(q) ||
        file.includes(q) ||
        tags.some((t: string) => t.toLowerCase().includes(q)) ||
        products.some((p: string) => p.toLowerCase().includes(q))
      );
    });
  }, [classifications, search, activeTypes, activeTags]);

  const toggleType = (t: string) =>
    setActiveTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const toggleTag = (t: string) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Выбрать кейс</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, файлу, тегам, продуктам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2">
            {videoTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-muted-foreground mr-1">Тип:</span>
                {videoTypes.map((vt) => (
                  <Badge
                    key={vt}
                    variant={activeTypes.includes(vt) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleType(vt)}
                  >
                    {vt}
                  </Badge>
                ))}
              </div>
            )}
            {topTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-muted-foreground mr-1">Теги:</span>
                {topTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={activeTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {(activeTypes.length > 0 || activeTags.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start h-7 text-xs gap-1"
                onClick={() => { setActiveTypes([]); setActiveTags([]); }}
              >
                <X className="h-3 w-3" /> Сбросить фильтры
              </Button>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            Найдено: {filtered.length} из {classifications?.length ?? 0}
          </p>

          {/* Table */}
          <ScrollArea className="min-h-0 flex-1 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Файл</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Студент</TableHead>
                  <TableHead>Продукты</TableHead>
                  <TableHead>Тон</TableHead>
                  <TableHead>Качество</TableHead>
                  <TableHead>Теги</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Кейсы не найдены
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c) => {
                  const j = c.classification_json || {};
                  const isSelected = c.id === selectedCaseId;
                  return (
                    <TableRow
                      key={c.id}
                      className={isSelected ? "bg-accent" : "cursor-pointer hover:bg-accent/50"}
                      onClick={() => handleSelect(c.id)}
                    >
                      <TableCell>
                        <div className="max-w-[200px]">
                          <span className="text-sm font-medium truncate block">{c.file_name}</span>
                          {j.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{j.summary}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {j.video_type && <Badge variant="outline">{j.video_type}</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {j.student_name || "—"}
                          {j.student_age && <span className="text-muted-foreground">, {j.student_age}</span>}
                        </div>
                        {j.student_background && (
                          <p className="text-xs text-muted-foreground">{j.student_background}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(j.products || []).map((p: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{j.emotional_tone || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{j.content_quality || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(j.tags || []).slice(0, 5).map((t: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                          {(j.tags || []).length > 5 && (
                            <span className="text-xs text-muted-foreground">+{j.tags.length - 5}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" /> Выбран
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleSelect(c.id); }}>
                            Выбрать
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
