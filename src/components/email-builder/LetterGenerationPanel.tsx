import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings2, UserSearch, X } from "lucide-react";
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
}

export default function LetterGenerationPanel({
  programId, offerId, offerType, letterThemeTitle, templateName,
  caseId, onChangeCaseId,
  generatedHtml, imagePlaceholders, generatingLetter,
  onGenerate, onRegenerate, onEditSettings,
  selectedBlockHtml, onChangeSelectedBlockHtml,
}: Props) {
  const [casePickerOpen, setCasePickerOpen] = useState(false);

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

  const isGenerated = !!generatedHtml;
  const selectedJson = selectedCase?.classification_json;

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

  // Pre-generation mode — case selection via dialog
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm">Кейс для письма</h3>
        <p className="text-xs text-muted-foreground mt-1">
          История кейса — основа письма. Без кейса письмо не будет содержать реальную историю студента
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

      <CasePickerDialog
        open={casePickerOpen}
        onOpenChange={setCasePickerOpen}
        onSelect={onChangeCaseId}
        selectedCaseId={caseId}
      />
    </div>
  );
}
