import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Check, Plus, Pencil, Trash2 } from "lucide-react";

const GLOBAL_VARS = [
  { key: "offer_rules", name: "{{offer_rules}}", description: "Адаптация под тип оффера" },
  { key: "antiAI_rules", name: "{{antiAI_rules}}", description: "Требования к тексту — антиAI" },
  { key: "brand_voice", name: "{{brand_voice}}", description: "Голос бренда Talentsy" },
];

const AUDIENCE_VARS = [
  { key: "audience_from_scratch_personal", name: "{{audience_from_scratch_personal}}", description: "С нуля — для себя" },
  { key: "audience_from_scratch_career", name: "{{audience_from_scratch_career}}", description: "С нуля — новая профессия" },
  { key: "audience_from_scratch_both", name: "{{audience_from_scratch_both}}", description: "С нуля — для себя и, возможно, профессия" },
  { key: "audience_with_diploma", name: "{{audience_with_diploma}}", description: "Есть образование — повышение квалификации" },
];

const categories = [
  {
    title: "Платная программа",
    variables: [
      { name: "{{program_title}}", description: "Название платной программы", source: "paid_programs.title" },
      { name: "{{program_description}}", description: "Краткое описание платной программы (введённое вручную)", source: "paid_programs.description" },
      { name: "{{audience_description}}", description: "Описание целевой аудитории программы", source: "Google Docs → paid_programs.audience_description" },
      { name: "{{program_doc_description}}", description: "Полное описание программы (загружается из Google Docs)", source: "Google Docs → paid_programs.program_doc_url" },
      { name: "{{program_tags}}", description: "Теги аудитории платной программы (через запятую)", source: "program_tags → tags.name" },
    ],
  },
  {
    title: "Оффер",
    variables: [
      { name: "{{offer_type}}", description: "Тип оффера (мини-курс, вебинар, диагностика и т.д.)", source: "offers.offer_type" },
      { name: "{{offer_title}}", description: "Название оффера", source: "offers.title" },
      { name: "{{offer_value}}", description: "Короткое описание оффера (ценностное предложение)", source: "offers.description" },
      { name: "{{offer_description}}", description: "Полное описание оффера из Google Docs", source: "offers.doc_url → Google Docs export" },
      { name: "{{offer_image}}", description: "URL изображения оффера (квадрат)", source: "offers.image_url" },
      { name: "{{brand_style}}", description: "Фирменный стиль (описание выбранной цветовой гаммы)", source: "Выбранная цветовая гамма (color_schemes.description)" },
      { name: "{{image_style}}", description: "Визуальный стиль для imagen-промптов в письмах", source: "image_styles (выбранный стиль)" },

    ],
  },
  {
    title: "Тема от пользователя",
    variables: [
      { name: "{{content_theme}}", description: "Тема/направление, заданное пользователем вручную перед генерацией (пустая строка, если выбран автоматический режим)", source: "Ввод пользователя (диалог выбора темы)" },
    ],
  },
  {
    title: "Лид-магниты",
    variables: [
      { name: "{{lead_magnet}}", description: "Полный контекст выбранного лид-магнита (визуальный формат, контент, ценность, переход)", source: "Сгенерированные данные (lead_magnets)" },
    ],
  },
  {
    title: "Справочные материалы",
    variables: [
      { name: "{{reference_material}}", description: "Полный контекст выбранного справочного материала (визуальный формат, контент, ценность, переход)", source: "Сгенерированные данные (lead_magnets)" },
    ],
  },
  {
    title: "Экспертный контент",
    variables: [
      { name: "{{expert_post_topic}}", description: "Полный контекст выбранной темы экспертного поста (категория, угол подачи, крючок, переход к офферу)", source: "Сгенерированные данные (lead_magnets)" },
    ],
  },
  {
    title: "Провокационный контент",
    variables: [
      { name: "{{provocation_topic}}", description: "Полный JSON-объект выбранной темы провокационного поста (format, topic_title, topic_angle, hook, discussion_trigger, transition_to_offer)", source: "Сгенерированные данные (lead_magnets)" },
    ],
  },
  {
    title: "Список",
    variables: [
      { name: "{{list_topic}}", description: "Полный JSON-объект выбранной темы списка (id, subtype, list_title, hook, items, transition_to_offer)", source: "Сгенерированные данные (lead_magnets)" },
    ],
  },
  {
    title: "Диагностики",
    variables: [
      { name: "{{USER_ANSWERS}}", description: "JSON с ответами пользователя (для диагностик / тестов)", source: "Сгенерированные данные (quiz_json)" },
    ],
  },
  {
    title: "Контент-отзыв",
    variables: [
      { name: "{{case_data}}", description: "Полный JSON классификации выбранного кейса (тип видео, студент, цитаты, инсайты, ДО/ПОСЛЕ, теги)", source: "case_classifications.classification_json" },
      { name: "{{case_angle}}", description: "Полный JSON выбранного угла подачи кейса (angle_type, angle_title, hook, key_quote, story_arc, what_reader_feels, transition_to_offer)", source: "Выбранный lead_magnet для testimonial_content" },
    ],
  },
  {
    title: "Разбор мифа",
    variables: [
      { name: "{{myth_topic}}", description: "Полный контекст выбранной темы разбора мифа (категория, угол подачи, крючок, переход к офферу)", source: "Сгенерированные данные (lead_magnets)" },
    ],
  },
  {
    title: "Отработка возражения",
    variables: [
      { name: "{{objection_data}}", description: "JSON выбранного возражения (id, objection_text, tags)", source: "objections" },
      { name: "{{objection_angle}}", description: "JSON выбранного угла подачи (angle_type, angle_title, description, hook, transition_to_offer)", source: "Выбранный lead_magnet для objection_handling" },
      { name: "{{objection_data_massive}}", description: "Массив возражений (до 7). Подтягивается из раздела «Управление возражениями»", source: "objections (выбранные в конструкторе писем)" },
    ],
  },
  {
    title: "Конструктор email",
    variables: [
      { name: "{{letter_theme}}", description: "Тема письма (название + описание из дерева тем или введённое вручную)", source: "email_letters.letter_theme_title + letter_theme_description" },
      { name: "{{template_name}}", description: "Название выбранного шаблона письма", source: "email_templates.name" },
      { name: "{{letter_blocks_summary}}", description: "JSON-сводка всех блоков письма (типы, офферы, темы) — заполняется автоматически при генерации темы", source: "Системная переменная (email_letter_blocks)" },
    ],
  },
  {
    title: "Промо-коды",
    variables: [
      { name: "{{promo_codes_data}}", description: "JSON-данные выбранного промокода (код, дата истечения)", source: "Выбирается пользователем при генерации" },
    ],
  },
  {
    title: "Старт нового потока",
    variables: [
      { name: "{{new_stream_data}}", description: "JSON-данные выбранного оффера «Старт нового потока» (дата старта)", source: "Выбирается пользователем при генерации" },
    ],
  },
  {
    title: "Вебинары",
    variables: [
      { name: "{{webinar_data}}", description: "JSON-данные выбранного вебинара (дата, автовебинар, ссылка на лендинг)", source: "Выбирается пользователем при генерации" },
    ],
  },
];

function VariableTable({ variables }: { variables: typeof categories[0]["variables"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[240px]">Переменная</TableHead>
          <TableHead>Описание</TableHead>
          <TableHead className="w-[300px]">Источник данных</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {variables.map((v) => (
          <TableRow key={v.name}>
            <TableCell>
              <Badge variant="secondary" className="font-mono text-xs">
                {v.name}
              </Badge>
            </TableCell>
            <TableCell>{v.description}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{v.source}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function GlobalVariablesCard() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("prompt_global_variables")
        .select("key, value")
        .in("key", GLOBAL_VARS.map((v) => v.key));
      if (error) {
        toast.error("Ошибка загрузки переменных");
        setLoading(false);
        return;
      }
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      setValues(map);
      setLoading(false);
    })();
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    const { error } = await supabase
      .from("prompt_global_variables")
      .update({ value: values[key] ?? "" })
      .eq("key", key);
    setSaving(null);
    if (error) {
      toast.error("Не удалось сохранить: " + error.message);
    } else {
      setSaved(key);
      toast.success("Сохранено");
      setTimeout(() => setSaved(null), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Общее</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Общее</CardTitle>
        <CardDescription>
          Глобальные переменные с фиксированным значением. Редактируйте текст и сохраняйте — он будет подставляться в промпты.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {GLOBAL_VARS.map((v) => (
          <div key={v.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">{v.name}</Badge>
                <span className="text-sm text-muted-foreground">{v.description}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSave(v.key)}
                disabled={saving === v.key}
              >
                {saving === v.key ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : saved === v.key ? (
                  <Check className="mr-1 h-4 w-4" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                Сохранить
              </Button>
            </div>
            <Textarea
              className="min-h-[120px] font-mono text-sm"
              value={values[v.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [v.key]: e.target.value }))}
              placeholder={`Введите значение для ${v.name}…`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AudienceVariablesCard() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("prompt_global_variables")
        .select("key, value")
        .in("key", AUDIENCE_VARS.map((v) => v.key));
      if (error) {
        toast.error("Ошибка загрузки переменных аудитории");
        setLoading(false);
        return;
      }
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      setValues(map);
      setLoading(false);
    })();
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    const { error } = await supabase
      .from("prompt_global_variables")
      .update({ value: values[key] ?? "" })
      .eq("key", key);
    setSaving(null);
    if (error) {
      toast.error("Не удалось сохранить: " + error.message);
    } else {
      setSaved(key);
      toast.success("Сохранено");
      setTimeout(() => setSaved(null), 2000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Аудитория</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Аудитория</CardTitle>
        <CardDescription>
          Описания сегментов аудитории для подстановки в промпты
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {AUDIENCE_VARS.map((v) => (
          <div key={v.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">{v.name}</Badge>
                <span className="text-sm text-muted-foreground">{v.description}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSave(v.key)}
                disabled={saving === v.key}
              >
                {saving === v.key ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : saved === v.key ? (
                  <Check className="mr-1 h-4 w-4" />
                ) : (
                  <Save className="mr-1 h-4 w-4" />
                )}
                Сохранить
              </Button>
            </div>
            <Textarea
              className="min-h-[120px] font-mono text-sm"
              value={values[v.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [v.key]: e.target.value }))}
              placeholder={`Введите значение для ${v.name}…`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface ColorScheme {
  id: string;
  name: string;
  description: string;
  preview_colors: string[];
  is_active: boolean;
}

function ColorPreview({ colors, height = 20 }: { colors: string[]; height?: number }) {
  return (
    <div className="flex gap-1">
      {colors.map((color, i) => (
        <div
          key={i}
          className="rounded-sm border border-border"
          style={{ backgroundColor: color, width: height, height }}
        />
      ))}
    </div>
  );
}

function ColorSchemesCard() {
  const [schemes, setSchemes] = useState<ColorScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ColorScheme | null>(null);
  const [form, setForm] = useState({ name: "", description: "", colorsText: "", is_active: true });
  const [saving, setSaving] = useState(false);

  const fetchSchemes = async () => {
    const { data, error } = await supabase.from("color_schemes").select("*").order("created_at");
    if (error) { toast.error("Ошибка загрузки гамм"); return; }
    setSchemes((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchSchemes(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", colorsText: "", is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (s: ColorScheme) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description, colorsText: s.preview_colors.join(", "), is_active: s.is_active });
    setDialogOpen(true);
  };

  const parseColors = (text: string): string[] =>
    text.split(",").map(c => c.trim()).filter(c => /^#[0-9a-fA-F]{3,8}$/.test(c));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название"); return; }
    setSaving(true);
    const colors = parseColors(form.colorsText);
    const payload = { name: form.name.trim(), description: form.description, preview_colors: colors, is_active: form.is_active };

    if (editing) {
      const { error } = await supabase.from("color_schemes").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("color_schemes").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setDialogOpen(false);
    toast.success("Сохранено");
    fetchSchemes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить цветовую гамму?")) return;
    const { error } = await supabase.from("color_schemes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Удалено");
    fetchSchemes();
  };

  const previewColors = parseColors(form.colorsText);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Цветовые гаммы</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Цветовые гаммы</CardTitle>
              <CardDescription>Управляйте цветовыми гаммами для переменной <Badge variant="secondary" className="font-mono text-xs">{"{{brand_style}}"}</Badge></CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Добавить</Button>
          </div>
        </CardHeader>
        <CardContent>
          {schemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет цветовых гамм</p>
          ) : (
            <div className="space-y-2">
              {schemes.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-md border p-3">
                  <ColorPreview colors={s.preview_colors} />
                  <span className="font-medium flex-1">{s.name}</span>
                  <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "активна" : "неактивна"}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать гамму" : "Новая цветовая гамма"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название гаммы</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Классика" />
            </div>
            <div className="space-y-2">
              <Label>Цвета превью (hex, через запятую)</Label>
              <Input value={form.colorsText} onChange={(e) => setForm(f => ({ ...f, colorsText: e.target.value }))} placeholder="#7B2FBE, #F0EDF7, #1A1A2E, #FFFFFF" />
              {previewColors.length > 0 && <ColorPreview colors={previewColors} height={24} />}
            </div>
            <div className="space-y-2">
              <Label>Описание гаммы (значение {"{{brand_style}}"})</Label>
              <Textarea className="min-h-[160px] font-mono text-sm" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Стиль: КЛАССИКА&#10;Фон изображения: градиент..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Активна</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PromoCodesCard() {
  const example = {
    promo_code: "PROMO2025",
    expires_at: "2025-12-31",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Промо-коды
          <Badge variant="secondary">{"{{promo_codes_data}}"}</Badge>
        </CardTitle>
        <CardDescription>
          Данные конкретного промокода, выбранного пользователем при генерации. Пример формата:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
          {JSON.stringify(example, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

function NewStreamCard() {
  const example = {
    stream_start_date: "2025-09-01",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Старт нового потока
          <Badge variant="secondary">{"{{new_stream_data}}"}</Badge>
        </CardTitle>
        <CardDescription>
          Данные конкретного оффера «Старт нового потока», выбранного пользователем при генерации. Пример формата:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
          {JSON.stringify(example, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

function WebinarDataCard() {
  const example = {
    webinar_date: "2025-10-15T18:00:00",
    is_autowebinar: "нет",
    landing_url: "https://example.com/webinar",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Вебинары
          <Badge variant="secondary">{"{{webinar_data}}"}</Badge>
        </CardTitle>
        <CardDescription>
          Данные конкретного вебинара, выбранного пользователем при генерации. Пример формата:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted rounded-md p-4 text-sm font-mono overflow-x-auto">
          {JSON.stringify(example, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

export default function PromptVariables() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Переменные промптов</h1>
        <p className="text-muted-foreground mt-1">
          Справочник шаблонных переменных, доступных для использования в промптах
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>
            Используйте эти переменные в полях «System prompt» и «User prompt template». При генерации они автоматически заменяются на актуальные данные проекта.
            Для категорий изображений (image_carousel, image_post, image_email) промпт используется как описание для генерации изображения через Google Imagen.
          </CardDescription>
        </CardHeader>
      </Card>

      <GlobalVariablesCard />
      <AudienceVariablesCard />
      <ColorSchemesCard />
      <ImageStylesCard />
      <PromoCodesCard />
      <NewStreamCard />
      <WebinarDataCard />

      {categories.map((cat) => (
        <Card key={cat.title}>
          <CardHeader>
            <CardTitle>{cat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <VariableTable variables={cat.variables} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
