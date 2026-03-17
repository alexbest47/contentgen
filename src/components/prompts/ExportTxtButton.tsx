import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { contentTypeLabels } from "@/lib/promptConstants";

interface ExportTxtButtonProps {
  prompts: any[];
  contentType?: string;
}

const CONTENT_TYPE_ORDER = [
  "lead_magnet",
  "reference_material",
  "expert_content",
  "provocative_content",
  "list_content",
  "case_analysis",
  "testimonial_content",
];

export default function ExportTxtButton({ prompts }: ExportTxtButtonProps) {
  const exportTxt = () => {
    if (prompts.length === 0) {
      toast.error("Нет промптов для экспорта");
      return;
    }

    // Group by content_type
    const groups: Record<string, any[]> = {};
    for (const p of prompts) {
      const ct = p.content_type || "other";
      if (!groups[ct]) groups[ct] = [];
      groups[ct].push(p);
    }

    // Sort each group by step_order
    for (const key of Object.keys(groups)) {
      groups[key].sort((a: any, b: any) => (a.step_order ?? 1) - (b.step_order ?? 1));
    }

    // Build ordered keys: known order first, then any remaining
    const knownKeys = CONTENT_TYPE_ORDER.filter((k) => groups[k]);
    const extraKeys = Object.keys(groups).filter((k) => !CONTENT_TYPE_ORDER.includes(k));
    const orderedKeys = [...knownKeys, ...extraKeys];

    const sections: string[] = [];

    for (const ct of orderedKeys) {
      const label = contentTypeLabels[ct] || ct;
      sections.push(`=== Тип контента: ${label} ===`);
      sections.push("");

      for (const p of groups[ct]) {
        sections.push(`--- ${p.name} ---`);
        sections.push("[System Prompt]");
        sections.push(p.system_prompt || "");
        sections.push("");
        sections.push("[User Prompt Template]");
        sections.push(p.user_prompt_template || "");
        sections.push("");
      }
    }

    const text = sections.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompts_export.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Экспортировано ${prompts.length} промптов`);
  };

  return (
    <Button variant="outline" size="sm" onClick={exportTxt} disabled={prompts.length === 0}>
      <Download className="mr-2 h-4 w-4" />
      Экспорт TXT
    </Button>
  );
}
