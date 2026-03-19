import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Check, X, Eye } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (caseId: string) => void;
  selectedCaseId: string | null;
}

interface CaseClassification {
  id: string;
  file_name: string;
  source_url: string | null;
  classification_json: any;
  created_at: string;
}

export default function CasePickerDialog({ open, onOpenChange, onSelect, selectedCaseId }: Props) {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [previewCase, setPreviewCase] = useState<CaseClassification | null>(null);

  const { data: classifications } = useQuery({
    queryKey: ["case-classifications-picker"],
    queryFn: async () => {
      const { data } = await supabase
        .from("case_classifications")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as CaseClassification[];
    },
    enabled: open,
  });

  const videoTypes = useMemo(() => {
    if (!classifications) return [];
    const set = new Set<string>();
    classifications.forEach((c) => {
      const vt = c.classification_json?.video_type;
      if (vt) set.add(vt);
    });
    return Array.from(set).sort();
  }, [classifications]);

  const products = useMemo(() => {
    if (!classifications) return [];
    const set = new Set<string>();
    classifications.forEach((c) => {
      const prods: string[] = c.classification_json?.products || [];
      prods.forEach((p) => set.add(p));
    });
    return Array.from(set).sort();
  }, [classifications]);

  const topTags = useMemo(() => {
    if (!classifications) return [];
    const counts = new Map<string, number>();
    classifications.forEach((c) => {
      const tags: string[] = c.classification_json?.tags || [];
      tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([tag]) => tag);
  }, [classifications]);

  const filtered = useMemo(() => {
    if (!classifications) return [];
    const q = search.toLowerCase();
    return classifications.filter((c) => {
      const j = c.classification_json || {};
      const vt = j.video_type || "";
      const tags: string[] = j.tags || [];
      const prods: string[] = j.products || [];

      if (activeType && vt !== activeType) return false;
      if (activeProduct && !prods.includes(activeProduct)) return false;
      if (activeTag && !tags.includes(activeTag)) return false;

      if (!q) return true;
      const name = (j.student_name || "").toLowerCase();
      const file = c.file_name.toLowerCase();
      return (
        name.includes(q) ||
        file.includes(q) ||
        tags.some((t: string) => t.toLowerCase().includes(q)) ||
        prods.some((p: string) => p.toLowerCase().includes(q))
      );
    });
  }, [classifications, search, activeType, activeProduct, activeTag]);

  const hasFilters = activeType || activeProduct || activeTag;

  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Выбрать кейс</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 min-h-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, файлу, тегам, продуктам..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={activeType} onValueChange={(v) => setActiveType(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {videoTypes.map((vt) => (
                    <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activeProduct} onValueChange={(v) => setActiveProduct(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue placeholder="Все продукты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все продукты</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activeTag} onValueChange={(v) => setActiveTag(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <SelectValue placeholder="Все теги" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все теги</SelectItem>
                  {topTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs gap-1"
                  onClick={() => { setActiveType(""); setActiveProduct(""); setActiveTag(""); }}
                >
                  <X className="h-3 w-3" /> Сбросить
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Найдено: {filtered.length} из {classifications?.length ?? 0}
            </p>

            <ScrollArea className="min-h-0 flex-1 border rounded-md">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Файл</TableHead>
                    <TableHead className="w-[100px]">Тип</TableHead>
                    <TableHead className="w-[140px]">Студент</TableHead>
                    <TableHead className="w-[140px]">Продукты</TableHead>
                    <TableHead className="w-[160px]">Теги</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                          <div className="max-w-[180px]">
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
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {(j.products || []).map((p: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {(j.tags || []).slice(0, 3).map((t: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                            ))}
                            {(j.tags || []).length > 3 && (
                              <span className="text-xs text-muted-foreground">+{j.tags.length - 3}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); setPreviewCase(c); }}
                              title="Просмотреть детали"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
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

      {/* Case preview dialog */}
      <Dialog open={!!previewCase} onOpenChange={(v) => !v && setPreviewCase(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewCase?.file_name}</DialogTitle>
          </DialogHeader>
          {previewCase?.classification_json && (() => {
            const j = previewCase.classification_json;
            return (
              <div className="space-y-4">
                {j.summary && (
                  <p className="text-sm text-muted-foreground">{j.summary}</p>
                )}
                {j.quote && (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-sm">
                    «{j.quote}»
                  </blockquote>
                )}
                {j.before_after && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">До</p>
                      <p className="text-sm">{j.before_after.before || "—"}</p>
                    </div>
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">После</p>
                      <p className="text-sm">{j.before_after.after || "—"}</p>
                    </div>
                  </div>
                )}
                {j.key_insights && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Ключевые инсайты</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {j.key_insights.map((insight: string, i: number) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {j.recommended_use && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Рекомендовано для</p>
                    <div className="flex flex-wrap gap-1">
                      {j.recommended_use.map((u: string, i: number) => (
                        <Badge key={i} variant="secondary">{u}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <details>
                  <summary className="text-xs text-muted-foreground cursor-pointer">Полный JSON</summary>
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed rounded-md bg-muted p-4 mt-2">
                    {JSON.stringify(j, null, 2)}
                  </pre>
                </details>
                <Button
                  className="w-full"
                  onClick={() => {
                    handleSelect(previewCase.id);
                    setPreviewCase(null);
                  }}
                >
                  Выбрать этот кейс
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
export default function CasePickerDialog({ open, onOpenChange, onSelect, selectedCaseId }: Props) {
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [activeTag, setActiveTag] = useState("");

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

  const videoTypes = useMemo(() => {
    if (!classifications) return [];
    const set = new Set<string>();
    classifications.forEach((c) => {
      const vt = c.classification_json?.video_type;
      if (vt) set.add(vt);
    });
    return Array.from(set).sort();
  }, [classifications]);

  const products = useMemo(() => {
    if (!classifications) return [];
    const set = new Set<string>();
    classifications.forEach((c) => {
      const prods: string[] = c.classification_json?.products || [];
      prods.forEach((p) => set.add(p));
    });
    return Array.from(set).sort();
  }, [classifications]);

  const topTags = useMemo(() => {
    if (!classifications) return [];
    const counts = new Map<string, number>();
    classifications.forEach((c) => {
      const tags: string[] = c.classification_json?.tags || [];
      tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([tag]) => tag);
  }, [classifications]);

  const filtered = useMemo(() => {
    if (!classifications) return [];
    const q = search.toLowerCase();
    return classifications.filter((c) => {
      const j = c.classification_json || {};
      const vt = j.video_type || "";
      const tags: string[] = j.tags || [];
      const prods: string[] = j.products || [];

      if (activeType && vt !== activeType) return false;
      if (activeProduct && !prods.includes(activeProduct)) return false;
      if (activeTag && !tags.includes(activeTag)) return false;

      if (!q) return true;
      const name = (j.student_name || "").toLowerCase();
      const file = c.file_name.toLowerCase();
      return (
        name.includes(q) ||
        file.includes(q) ||
        tags.some((t: string) => t.toLowerCase().includes(q)) ||
        prods.some((p: string) => p.toLowerCase().includes(q))
      );
    });
  }, [classifications, search, activeType, activeProduct, activeTag]);

  const hasFilters = activeType || activeProduct || activeTag;

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

          {/* Dropdown filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={activeType} onValueChange={(v) => setActiveType(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {videoTypes.map((vt) => (
                  <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeProduct} onValueChange={(v) => setActiveProduct(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="Все продукты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все продукты</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={activeTag} onValueChange={(v) => setActiveTag(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="Все теги" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все теги</SelectItem>
                {topTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs gap-1"
                onClick={() => { setActiveType(""); setActiveProduct(""); setActiveTag(""); }}
              >
                <X className="h-3 w-3" /> Сбросить
              </Button>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            Найдено: {filtered.length} из {classifications?.length ?? 0}
          </p>

          {/* Table */}
          <ScrollArea className="min-h-0 flex-1 border rounded-md">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Файл</TableHead>
                  <TableHead className="w-[100px]">Тип</TableHead>
                  <TableHead className="w-[140px]">Студент</TableHead>
                  <TableHead className="w-[140px]">Продукты</TableHead>
                  <TableHead className="w-[160px]">Теги</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                        <div className="max-w-[180px]">
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
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {(j.products || []).map((p: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {(j.tags || []).slice(0, 3).map((t: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                          {(j.tags || []).length > 3 && (
                            <span className="text-xs text-muted-foreground">+{j.tags.length - 3}</span>
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