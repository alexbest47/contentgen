import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deriveCategory } from "@/lib/promptConstants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CsvImportButtonProps {
  existingCount: number;
  prompts: any[];
}

const CSV_HEADERS = [
  "name","slug","content_type","step_order",
  "provider","model","description","system_prompt","user_prompt_template",
  "output_format_hint","is_active",
] as const;

const TEMPLATE_ROWS = [
  [
    "Текст поста + Imagen-промпты: Instagram","text-ig-post","instagram","1",
    "anthropic","claude-sonnet-4-20250514","Генерация текста поста для Instagram",
    "Ты — опытный копирайтер для Instagram.","Напиши пост для оффера {{offer_title}} (тип: {{offer_type}}). Целевая аудитория: {{audience_description}}.",
    "Верни JSON с текстом и промптами для изображений","true",
  ],
];

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

export default function CsvImportButton({ existingCount, prompts: currentPrompts }: CsvImportButtonProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [importing, setImporting] = useState(false);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const lines = [
      CSV_HEADERS.map(escapeCsvField).join(","),
      ...TEMPLATE_ROWS.map((row) => row.map(escapeCsvField).join(",")),
    ];
    downloadFile(lines.join("\n"), `prompts_template.csv`);
  };

  const exportCsv = () => {
    if (currentPrompts.length === 0) {
      toast.error("Нет промптов для экспорта");
      return;
    }
    const lines = [
      CSV_HEADERS.map(escapeCsvField).join(","),
      ...currentPrompts.map((p) =>
        [
          p.name, p.slug, p.content_type ?? "", String(p.step_order ?? 1),
          p.provider, p.model, p.description ?? "", p.system_prompt,
          p.user_prompt_template, p.output_format_hint ?? "", String(p.is_active),
        ].map(escapeCsvField).join(",")
      ),
    ];
    downloadFile(lines.join("\n"), `prompts_export.csv`);
    toast.success(`Экспортировано ${currentPrompts.length} промптов`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          toast.error("CSV должен содержать заголовок и хотя бы одну строку данных");
          return;
        }

        const headers = parseCsvLine(lines[0]).map((h) => h.trim());
        const missing = CSV_HEADERS.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          toast.error(`Отсутствуют колонки: ${missing.join(", ")}`);
          return;
        }

        const rows: Record<string, any>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          const row: Record<string, any> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx]?.trim() ?? "";
          });

          row.step_order = parseInt(row.step_order, 10) || 1;
          row.is_active = row.is_active?.toLowerCase() !== "false";
          row.content_type = row.content_type || null;
          row.description = row.description || null;
          row.output_format_hint = row.output_format_hint || null;
          rows.push(row);
        }

        if (rows.length === 0) {
          toast.error("Не найдено ни одной строки данных");
          return;
        }

        setParsedRows(rows);
        setConfirmOpen(true);
      } catch (err: any) {
        toast.error(`Ошибка парсинга CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const doImport = async () => {
    setImporting(true);
    try {
      // Delete all existing prompts
      const { error: delError } = await supabase
        .from("prompts")
        .delete()
        .not("id", "is", null);
      if (delError) throw delError;

      const toInsert = parsedRows.map((r) => ({
        name: r.name,
        slug: r.slug,
        category: deriveCategory(r.content_type || ""),
        content_type: r.content_type,
        sub_type: null,
        step_order: r.step_order,
        provider: r.provider,
        model: r.model,
        description: r.description,
        system_prompt: r.system_prompt,
        user_prompt_template: r.user_prompt_template,
        output_format_hint: r.output_format_hint,
        is_active: r.is_active,
      }));

      const { error: insError } = await supabase.from("prompts").insert(toInsert);
      if (insError) throw insError;

      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast.success(`Импортировано ${toInsert.length} промптов`);
    } catch (err: any) {
      toast.error(`Ошибка импорта: ${err.message}`);
    } finally {
      setImporting(false);
      setConfirmOpen(false);
      setParsedRows([]);
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
      <Button variant="outline" size="sm" onClick={exportCsv} disabled={currentPrompts.length === 0}>
        <Download className="mr-2 h-4 w-4" />Экспорт CSV
      </Button>
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <Download className="mr-2 h-4 w-4" />Шаблон CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />Импорт CSV
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение импорта</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено <strong>{existingCount}</strong> существующих промптов и создано{" "}
              <strong>{parsedRows.length}</strong> новых.
              <br />
              Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={doImport} disabled={importing}>
              {importing ? "Импорт..." : "Импортировать"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
