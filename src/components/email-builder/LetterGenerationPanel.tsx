import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Settings2 } from "lucide-react";
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
  // Load cases for the selected program
  const { data: cases } = useQuery({
    queryKey: ["cases_for_letter"],
    queryFn: async () => {
      const { data } = await supabase.from("case_classifications").select("id, file_name, classification_json");
      return data ?? [];
    },
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

  // Pre-generation mode — only case selection + generate button
  return (
    <div className="space-y-5">
      {/* Section 1: Case */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Кейс студента</h3>
        <p className="text-xs text-muted-foreground">
          Выберите кейс чтобы включить его в письмо
        </p>
        <Select value={caseId || "none"} onValueChange={(v) => onChangeCaseId(v === "none" ? null : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Без кейса" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без кейса</SelectItem>
            {cases?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.file_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Section 2: Generate */}
      <div className="space-y-2 border-t pt-4">
        <Button
          className="w-full gap-1.5"
          size="lg"
          onClick={onGenerate}
          disabled={generatingLetter}
        >
          {generatingLetter ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Генерирую письмо…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Сгенерировать письмо</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Письмо будет создано целиком — от приветствия до кнопки CTA
        </p>
      </div>
    </div>
  );
}
