import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles, Download, Loader2, Tag, Send, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_REFINE_SYSTEM_PROMPT = `Ты — редактор email-писем. Тебе присылают уже сверстанный HTML письма (без хедера и футера — они добавляются отдельно) и комментарии пользователя с правками.

ТВОЯ ЗАДАЧА:
- Внести только те правки, о которых просит пользователь.
- СОХРАНИТЬ принципы вёрстки: таблицы, inline-стили, ширины, цветовые токены, структуру блоков, отступы, шрифты, скругления, кнопки, табличную email-совместимую разметку. Ничего лишнего не трогай.
- НЕ менять общую структуру письма без явной просьбы.
- НЕ добавлять новые <html>, <head>, <body>, <style> блоки. Возвращай только тот же фрагмент, что прислали (без хедера/футера).
- НЕ трогать теги <img> с src в виде {{placeholder_id}} — они подставляются системой.
- Любые добавляемые кнопки/ссылки оформляй в том же стиле, что уже используется в письме (такие же цвета, радиусы, отступы, шрифт).
- Если пользователь просит добавить ссылку — вставляй href аккуратно в соответствующий текст/кнопку.
- Тон текста и голос бренда сохраняй как в исходнике.

ФОРМАТ ОТВЕТА:
Верни СТРОГО JSON вида {"letter_html": "...обновлённый HTML..."} — без пояснений, без markdown-блоков, без текста вокруг JSON.`;
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  onRefineLetter: (userInstructions: string, systemPrompt: string) => Promise<void> | void;
  onTestEmail: (email: string) => void;

  generatingLetter: boolean;
  refiningLetter: boolean;
  canGenerate: boolean;
  canRefine: boolean;
  testingEmail: boolean;
}

export default function EmailBuilderHeader({
  title, subject, preheader, colorSchemeId, letterThemeTitle, saveStatus,
  onChangeTitle, onChangeSubject, onChangePreheader, onChangeColorScheme,
  onExportHtml, onSave, onChangeTheme, onGenerateLetter, onRefineLetter, onTestEmail,
  generatingLetter, refiningLetter, canGenerate, canRefine, testingEmail,
}: Props) {
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [confirmExportOpen, setConfirmExportOpen] = useState(false);
  const [refineDialogOpen, setRefineDialogOpen] = useState(false);
  const [refineSystemPrompt, setRefineSystemPrompt] = useState(DEFAULT_REFINE_SYSTEM_PROMPT);
  const [refineInstructions, setRefineInstructions] = useState("");
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setRefineDialogOpen(true)}
            disabled={refiningLetter || !canRefine}
            className="gap-1.5"
          >
            {refiningLetter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Сделать правки
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setTestDialogOpen(true)} className="gap-1.5">
            {testingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Проверить письмо
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmExportOpen(true)} className="gap-1.5">
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

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Отправить тестовое письмо</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Email получателя</Label>
            <Input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (testEmail) {
                  onTestEmail(testEmail);
                  setTestDialogOpen(false);
                }
              }}
              disabled={!testEmail || testingEmail}
              className="gap-1.5"
            >
              {testingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refineDialogOpen} onOpenChange={setRefineDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Сделать правки в письме</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">
                Системный промпт (можно дополнить — правила, которые должен соблюдать редактор)
              </Label>
              <Textarea
                value={refineSystemPrompt}
                onChange={(e) => setRefineSystemPrompt(e.target.value)}
                rows={10}
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Что именно нужно поправить? Опишите правки своими словами
              </Label>
              <Textarea
                value={refineInstructions}
                onChange={(e) => setRefineInstructions(e.target.value)}
                rows={5}
                placeholder={'Например: "Добавь ссылку на программу в первый абзац", "Сделай дополнительную CTA-кнопку "Узнать подробнее" под первым блоком", "Замени заголовок на более короткий"'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRefineSystemPrompt(DEFAULT_REFINE_SYSTEM_PROMPT);
              }}
            >
              Сбросить промпт
            </Button>
            <Button
              onClick={async () => {
                if (!refineInstructions.trim()) return;
                await onRefineLetter(refineInstructions.trim(), refineSystemPrompt);
                setRefineDialogOpen(false);
                setRefineInstructions("");
              }}
              disabled={!refineInstructions.trim() || refiningLetter}
              className="gap-1.5"
            >
              {refiningLetter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              Применить правки
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmExportOpen} onOpenChange={setConfirmExportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены, что добавили в письма все необходимые ссылки?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Вернуться к письму</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onExportHtml(); setConfirmExportOpen(false); }}>Да</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
