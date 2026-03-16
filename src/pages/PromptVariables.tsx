import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    title: "Диагностики",
    variables: [
      { name: "{{USER_ANSWERS}}", description: "JSON с ответами пользователя (для диагностик / тестов)", source: "Сгенерированные данные (quiz_json)" },
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
