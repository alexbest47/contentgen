import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Check } from "lucide-react";

const GLOBAL_VARS = [
  { key: "offer_rules", name: "{{offer_rules}}", description: "Адаптация под тип оффера" },
  { key: "antiAI_rules", name: "{{antiAI_rules}}", description: "Требования к тексту — антиAI" },
  { key: "brand_voice", name: "{{brand_voice}}", description: "Голос бренда Talentsy" },
];

const categories = [
  {
    title: "Платная программа",
    variables: [
      { name: "{{program_title}}", description: "Название платной программы", source: "paid_programs.title" },
      { name: "{{audience_description}}", description: "Описание целевой аудитории программы", source: "Google Docs → paid_programs.audience_description" },
      { name: "{{program_doc_description}}", description: "Полное описание программы (загружается из Google Docs)", source: "Google Docs → paid_programs.program_doc_url" },
    ],
  },
  {
    title: "Оффер",
    variables: [
      { name: "{{offer_type}}", description: "Тип оффера (мини-курс, вебинар, диагностика и т.д.)", source: "offers.offer_type" },
      { name: "{{offer_title}}", description: "Название оффера", source: "offers.title" },
      { name: "{{offer_description}}", description: "Описание оффера (загружается из Google Docs)", source: "Google Docs → offers.doc_url" },
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
