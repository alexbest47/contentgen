import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, Loader2, Tag } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  title: string;
  subject: string;
  preheader: string;
  colorSchemeId: string | null;
  letterThemeTitle: string;
  saveStatus: "saved" | "saving" | "unsaved";
  onChangeTitle: (v: string) => void;
  onChangeSubject: (v: string) => void;
  onChangePreheader: (v: string) => void;
  onChangeColorScheme: (v: string) => void;
  
  onExportHtml: () => void;
  onSave: () => void;
  onChangeTheme: () => void;
  onGenerateLetter: () => void;
  
  generatingLetter: boolean;
  canGenerate: boolean;
}

export default function EmailBuilderHeader({
  title, subject, preheader, colorSchemeId, letterThemeTitle, saveStatus,
  onChangeTitle, onChangeSubject, onChangePreheader, onChangeColorScheme,
  onExportHtml, onSave, onChangeTheme, onGenerateLetter,
  generatingLetter, canGenerate,
}: Props) {
  const { data: colorSchemes } = useQuery({
    queryKey: ["color_schemes_active"],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("id, name, preview_colors").eq("is_active", true).order("name");
      return data ?? [];
    },
  });

  return (
    <div className="border-b bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Конструктор письма</h1>
          {letterThemeTitle && (
            <button
              onClick={onChangeTheme}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Тема: {letterThemeTitle}</span>
            </button>
          )}
          <Badge variant={saveStatus === "saved" ? "secondary" : saveStatus === "saving" ? "outline" : "destructive"}>
            {saveStatus === "saved" ? "Сохранено" : saveStatus === "saving" ? "Сохранение..." : "Не сохранено"}
          </Badge>
          <Button variant="outline" size="sm" onClick={onSave} disabled={saveStatus === "saving"}>
            Сохранить
          </Button>
          <Button size="sm" onClick={onGenerateLetter} disabled={generatingLetter || !canGenerate} className="gap-1.5">
            {generatingLetter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Сгенерировать письмо
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportHtml} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Экспортировать HTML
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Название</Label>
          <Input value={title} onChange={(e) => onChangeTitle(e.target.value)} placeholder="Внутреннее название" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Тема письма</Label>
          <Input value={subject} onChange={(e) => onChangeSubject(e.target.value)} placeholder="40-60 символов" maxLength={80} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Прехедер</Label>
          <Input value={preheader} onChange={(e) => onChangePreheader(e.target.value)} placeholder="До 90 символов" maxLength={90} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Цветовая гамма</Label>
          <Select value={colorSchemeId || ""} onValueChange={onChangeColorScheme}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите гамму" />
            </SelectTrigger>
            <SelectContent>
              {colorSchemes?.map((cs) => (
                <SelectItem key={cs.id} value={cs.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {(cs.preview_colors ?? []).slice(0, 4).map((c: string, i: number) => (
                        <div key={i} className="w-3 h-3 rounded-full border" style={{ backgroundColor: c, marginLeft: i > 0 ? -4 : 0 }} />
                      ))}
                    </div>
                    {cs.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
