import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const variables = [
  { name: "{{program_title}}", description: "Название платной программы", source: "paid_programs.title" },
  { name: "{{audience_description}}", description: "Описание целевой аудитории программы", source: "Google Docs → paid_programs.audience_description" },
  { name: "{{offer_type}}", description: "Тип оффера (мини-курс, вебинар, диагностика и т.д.)", source: "offers.offer_type" },
  { name: "{{offer_title}}", description: "Название оффера", source: "offers.title" },
  { name: "{{offer_description}}", description: "Описание оффера (загружается из Google Docs)", source: "Google Docs → offers.doc_url" },
  { name: "{{lead_magnet}}", description: "Полный контекст выбранного лид-магнита (визуальный формат, контент, ценность, переход)", source: "Сгенерированные данные (lead_magnets)" },
  { name: "{{lead_magnet_title}}", description: "Название лид-магнита", source: "lead_magnets.title" },
  { name: "{{lead_magnet_description}}", description: "Визуальный контент лид-магнита", source: "lead_magnets.visual_content" },
];

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
          <CardTitle>Доступные переменные</CardTitle>
          <CardDescription>
          Используйте эти переменные в полях «System prompt» и «User prompt template». При генерации они автоматически заменяются на актуальные данные проекта.
          Для категорий изображений (image_carousel, image_post, image_email) промпт используется как описание для генерации изображения через Google Imagen.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
