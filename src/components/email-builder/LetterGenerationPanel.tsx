import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, UserSearch, X, GripVertical } from "lucide-react";
import { getOfferTypeLabel } from "@/lib/offerTypes";
import CasePickerDialog from "./CasePickerDialog";

export interface ImagePlaceholder {
  id: string;
  type: string;
  size: string;
  prompt: string;
  image_url: string;
}

interface Props {
  programId: string | null;
  offerId: string | null;
  offerType: string;
  letterThemeTitle: string;
  templateName: string;
  caseId: string | null;
  onChangeCaseId: (v: string | null) => void;
  generatedHtml: string;
  imagePlaceholders: ImagePlaceholder[];
  generatingLetter: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onEditSettings: () => void;
  selectedBlockHtml: string | null;
  onChangeSelectedBlockHtml: (html: string) => void;
  // Objections support (for "Прямой оффер")
  selectedObjectionIds?: string[];
  onChangeObjectionIds?: (ids: string[]) => void;
  noCaseRequired?: boolean;
}

export default function LetterGenerationPanel({
  programId, offerId, offerType, letterThemeTitle, templateName,
  caseId, onChangeCaseId,
  generatedHtml, imagePlaceholders, generatingLetter,
  onGenerate, onRegenerate, onEditSettings,
  selectedBlockHtml, onChangeSelectedBlockHtml,
  selectedObjectionIds = [],
  onChangeObjectionIds,
  noCaseRequired = false,
}: Props) {
  const [casePickerOpen, setCasePickerOpen] = useState(false);

  const isDirectOffer = templateName === "Прямой оффер";

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

  // Load selected case info
  const { data: selectedCase } = useQuery({
    queryKey: ["selected_case_info", caseId],
    queryFn: async () => {
      if (!caseId) return null;
      const { data } = await supabase.from("case_classifications").select("id, file_name, classification_json").eq("id", caseId).single();
      return data as { id: string; file_name: string; classification_json: any } | null;
    },
    enabled: !!caseId,
  });

  // Load objections for the program (for direct offer)
  const { data: objections } = useQuery({
    queryKey: ["objections_for_program", programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data } = await supabase.from("objections").select("id, objection_text").eq("program_id", programId).order("created_at");
      return data ?? [];
    },
    enabled: isDirectOffer && !!programId,
  });

  const isGenerated = !!generatedHtml;
  const selectedJson = selectedCase?.classification_json;

  const toggleObjection = (id: string) => {
    if (!onChangeObjectionIds) return;
    if (selectedObjectionIds.includes(id)) {
      onChangeObjectionIds(selectedObjectionIds.filter((x) => x !== id));
    } else if (selectedObjectionIds.length < 7) {
      onChangeObjectionIds([...selectedObjectionIds, id]);
    }
  };

  const moveObjection = (idx: number, dir: "up" | "down") => {
    if (!onChangeObjectionIds) return;
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= selectedObjectionIds.length) return;
    const arr = [...selectedObjectionIds];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    onChangeObjectionIds(arr);
  };

  const canGenerate = noCaseRequired
    ? true
    : isDirectOffer
      ? !!caseId && selectedObjectionIds.length > 0
      : !!caseId;

  // Inline editing a block
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
            {!isDirectOffer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Тема:</span>
                <span className="text-right max-w-[140px] truncate">{letterThemeTitle || "—"}</span>
              </div>
            )}
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
            {isDirectOffer && selectedObjectionIds.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Возражения:</span>
                <Badge variant="secondary" className="text-xs">{selectedObjectionIds.length}</Badge>
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

  // Pre-generation mode
  return (
    <div className="space-y-4">
      {/* Block A: Case selection (hidden for no-case templates) */}
      {!noCaseRequired && (
        <>
          <div>
            <h3 className="font-semibold text-sm">Кейс студента</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isDirectOffer
                ? "Кейс студента — обязательный элемент письма"
                : "История кейса — основа письма. Без кейса письмо не будет содержать реальную историю студента"}
            </p>
          </div>

          {/* Selected case display */}
          {caseId && selectedCase ? (
            <div className="flex items-center gap-2 p-3 rounded-md border bg-accent/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedJson?.student_name || selectedCase.file_name}
                </p>
                {selectedJson?.student_name && (
                  <p className="text-xs text-muted-foreground truncate">{selectedCase.file_name}</p>
                )}
                {selectedJson?.video_type && (
                  <Badge variant="outline" className="text-[10px] mt-1">{selectedJson.video_type}</Badge>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCasePickerOpen(true)}>
                  Заменить
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChangeCaseId(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 h-10"
              onClick={() => setCasePickerOpen(true)}
            >
              <UserSearch className="h-4 w-4" />
              Выбрать кейс
            </Button>
          )}
        </>
      )}

      {/* Block B: Objections (only for direct offer) */}
      {isDirectOffer && (
        <div className="space-y-3 pt-2 border-t">
          <div>
            <h3 className="font-semibold text-sm">Возражения для отработки</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Выберите возражения для отработки (до 7)
            </p>
          </div>

          {!programId ? (
            <p className="text-xs text-muted-foreground italic">Сначала выберите программу в настройках письма</p>
          ) : objections && objections.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Нет возражений для этой программы</p>
          ) : (
            <>
              {/* Selected objections with reorder */}
              {selectedObjectionIds.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Выбранные ({selectedObjectionIds.length}/7):</p>
                  {selectedObjectionIds.map((id, idx) => {
                    const obj = objections?.find((o) => o.id === id);
                    if (!obj) return null;
                    return (
                      <div key={id} className="flex items-center gap-1.5 p-2 rounded border bg-accent/30 text-xs">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            className="p-0 h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={idx === 0}
                            onClick={() => moveObjection(idx, "up")}
                          >▲</button>
                          <button
                            className="p-0 h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={idx === selectedObjectionIds.length - 1}
                            onClick={() => moveObjection(idx, "down")}
                          >▼</button>
                        </div>
                        <span className="flex-1 line-clamp-2">{obj.objection_text}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => toggleObjection(id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Available objections */}
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                {objections?.filter((o) => !selectedObjectionIds.includes(o.id)).map((obj) => (
                  <div
                    key={obj.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                    onClick={() => toggleObjection(obj.id)}
                  >
                    <Checkbox
                      checked={selectedObjectionIds.includes(obj.id)}
                      disabled={selectedObjectionIds.length >= 7}
                      className="shrink-0"
                    />
                    <span className="text-xs line-clamp-2">{obj.objection_text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Generate button hint */}
      {noCaseRequired && !isDirectOffer && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center">
            {templateName?.startsWith("Приглашение на вебинар") ? "Данные берутся из настроек вебинара" : "ИИ самостоятельно определит структуру письма"}
          </p>
        </div>
      )}
      {isDirectOffer && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center">
            {canGenerate
              ? "Письмо будет создано целиком — от приветствия до CTA"
              : "Выберите кейс и хотя бы одно возражение для генерации"}
          </p>
        </div>
      )}

      {!noCaseRequired && (
        <CasePickerDialog
          open={casePickerOpen}
          onOpenChange={setCasePickerOpen}
          onSelect={onChangeCaseId}
          selectedCaseId={caseId}
        />
      )}
    </div>
  );
}
