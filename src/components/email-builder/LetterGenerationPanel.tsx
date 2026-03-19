import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Settings2, Search, X } from "lucide-react";
import { getOfferTypeLabel } from "@/lib/offerTypes";

export interface ImagePlaceholder {
  id: string;
  type: string;
  size: string;
  prompt: string;
  image_url: string;
}

interface Props {
  // Letter data
  programId: string | null;
  offerId: string | null;
  offerType: string;
  letterThemeTitle: string;
  templateName: string;
  // Pre-generation settings
  caseId: string | null;
  onChangeCaseId: (v: string | null) => void;
  // Generation
  generatedHtml: string;
  imagePlaceholders: ImagePlaceholder[];
  generatingLetter: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onEditSettings: () => void;
  // Inline editing
  selectedBlockHtml: string | null;
  onChangeSelectedBlockHtml: (html: string) => void;
}

export default function LetterGenerationPanel({
  programId, offerId, offerType, letterThemeTitle, templateName,
  caseId, onChangeCaseId,
  generatedHtml, imagePlaceholders, generatingLetter,
  onGenerate, onRegenerate, onEditSettings,
  selectedBlockHtml, onChangeSelectedBlockHtml,
}: Props) {
  // Load cases filtered by program
  const { data: cases } = useQuery({
    queryKey: ["cases_for_letter", programId],
    queryFn: async () => {
      const { data } = await supabase
        .from("case_classifications")
        .select("id, file_name, classification_json, case_files!inner(job_id, case_jobs!inner(id))")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!programId,
  });

  // Load program name
  const { data: program } = useQuery({
    queryKey: ["program_name", programId],
    queryFn: async () => {
      if (!programId) return null;
      const { data } = await supabase.from("paid_programs").select("title").eq("id", programId).single();
      return data;
    },
    enabled: !!programId,
  });

  // Load offer name
  const { data: offer } = useQuery({
    queryKey: ["offer_name", offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const { data } = await supabase.from("offers").select("title").eq("id", offerId).single();
      return data;
    },
    enabled: !!offerId,
  });

  const isGenerated = !!generatedHtml;

  // If inline editing a block
  if (selectedBlockHtml !== null) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Редактирование блока</h3>
        <Textarea
          value={selectedBlockHtml}
          onChange={(e) => onChangeSelectedBlockHtml(e.target.value)}
          className="font-mono text-xs min-h-[300px]"
        />
        <p className="text-xs text-muted-foreground">Кликните вне блока чтобы закрыть редактор</p>
      </div>
    );
  }

  // Post-generation mode
  if (isGenerated) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm mb-3">Настройки письма</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Тема:</span>
              <span className="text-right max-w-[140px] truncate">{letterThemeTitle || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Шаблон:</span>
              <span className="text-right max-w-[140px] truncate">{templateName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Программа:</span>
              <span className="text-right max-w-[140px] truncate">{program?.title || "—"}</span>
            </div>
            {offerType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тип оффера:</span>
                <span className="text-right max-w-[140px] truncate">{getOfferTypeLabel(offerType)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Оффер:</span>
              <span className="text-right max-w-[140px] truncate">{offer?.title || "—"}</span>
            </div>
            {caseId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Кейс:</span>
                <Badge variant="secondary" className="text-xs">Выбран</Badge>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5" onClick={onEditSettings}>
            <Settings2 className="h-3.5 w-3.5" /> Изменить настройки
          </Button>
        </div>

      </div>
    );
  }

  // Pre-generation mode — search + filter case selection
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<string[]>([]);

  const videoTypes = useMemo(() => {
    if (!cases) return [];
    const set = new Set<string>();
    cases.forEach((c) => {
      const vt = (c.classification_json as any)?.video_type;
      if (vt) set.add(vt);
    });
    return Array.from(set).sort();
  }, [cases]);

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    const q = search.toLowerCase();
    return cases.filter((c) => {
      const json = c.classification_json as any;
      const vt = json?.video_type || "";
      if (activeTypes.length > 0 && !activeTypes.includes(vt)) return false;
      if (!q) return true;
      const name = (json?.student_name || "").toLowerCase();
      const file = c.file_name.toLowerCase();
      const tags: string[] = json?.tags || [];
      return name.includes(q) || file.includes(q) || tags.some((t: string) => t.toLowerCase().includes(q));
    });
  }, [cases, search, activeTypes]);

  const toggleType = (t: string) =>
    setActiveTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const selectedCase = cases?.find((c) => c.id === caseId);
  const selectedJson = selectedCase ? (selectedCase.classification_json as any) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm">Выберите кейс</h3>
        <p className="text-xs text-muted-foreground mt-1">
          История кейса — основа письма. Без кейса письмо не будет содержать реальную историю студента
        </p>
      </div>

      {/* Selected case display */}
      {caseId && selectedCase && (
        <div className="flex items-center gap-2 p-2 rounded-md border bg-accent/50">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {selectedJson?.student_name || selectedCase.file_name}
            </p>
            {selectedJson?.student_name && (
              <p className="text-xs text-muted-foreground truncate">{selectedCase.file_name}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onChangeCaseId(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, файлу или тегам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Video type filter badges */}
      {videoTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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

      {/* Scrollable case list */}
      <ScrollArea className="h-[340px] border rounded-md">
        <div className="p-1 space-y-1">
          {filteredCases.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Кейсы не найдены</p>
          )}
          {filteredCases.map((c) => {
            const json = c.classification_json as any;
            const tags: string[] = json?.tags || [];
            const isSelected = c.id === caseId;
            return (
              <button
                key={c.id}
                onClick={() => onChangeCaseId(c.id)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${isSelected ? "bg-accent ring-1 ring-primary" : ""}`}
              >
                <p className="font-medium truncate">
                  {json?.student_name || c.file_name}
                </p>
                {json?.student_name && (
                  <p className="text-xs text-muted-foreground truncate">{c.file_name}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {json?.video_type && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{json.video_type}</Badge>
                  )}
                  {tags.slice(0, 3).map((t: string) => (
                    <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
