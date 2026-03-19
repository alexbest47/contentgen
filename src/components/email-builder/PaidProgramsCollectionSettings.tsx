import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { type EmailBlock } from "./BlockCanvas";

interface Props {
  block: EmailBlock;
  colorSchemeId?: string | null;
  onUpdateConfig: (config: Record<string, any>) => void;
}

export default function PaidProgramsCollectionSettings({ block, colorSchemeId, onUpdateConfig }: Props) {
  const config = block.config;
  const selectedProgramIds: string[] = config.program_ids || [];

  const { data: schemeColors } = useQuery({
    queryKey: ["color_scheme_colors", colorSchemeId],
    queryFn: async () => {
      const { data } = await supabase.from("color_schemes").select("preview_colors").eq("id", colorSchemeId!).single();
      return data?.preview_colors || null;
    },
    enabled: !!colorSchemeId,
  });

  const headingColor = schemeColors?.[2] || "#1A1A2E";
  const accentColor = schemeColors?.[0] || "#7B2FBE";
  const dividerColor = "#E8E8E8";

  const { data: programs } = useQuery({
    queryKey: ["paid_programs_for_block"],
    queryFn: async () => {
      const { data } = await supabase.from("paid_programs").select("id, title, description").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: programTagsMap } = useQuery({
    queryKey: ["program_tags_map"],
    queryFn: async () => {
      const { data } = await supabase.from("program_tags").select("program_id, tag_id, tags(name)");
      const map: Record<string, string[]> = {};
      data?.forEach((row: any) => {
        if (!map[row.program_id]) map[row.program_id] = [];
        if (row.tags?.name) map[row.program_id].push(row.tags.name);
      });
      return map;
    },
  });

  const setProgramId = (index: number, value: string) => {
    const newIds = [...selectedProgramIds];
    newIds[index] = value;
    onUpdateConfig({ ...config, program_ids: newIds });
  };

  const addProgram = () => {
    if (selectedProgramIds.length >= 5) return;
    onUpdateConfig({ ...config, program_ids: [...selectedProgramIds, ""] });
  };

  const removeProgram = (index: number) => {
    const newIds = selectedProgramIds.filter((_, i) => i !== index);
    onUpdateConfig({ ...config, program_ids: newIds });
  };

  const buildHtml = () => {
    const htmlParts: string[] = [];
    for (const pid of selectedProgramIds) {
      if (!pid) continue;
      const prog = programs?.find((p) => p.id === pid);
      if (!prog) continue;
      const tags = programTagsMap?.[pid] || [];
      const tagsHtml = tags.map((t) =>
        `<span style="font-family:Arial,sans-serif;font-size:12px;color:#888888;border:1px solid #DDDDDD;border-radius:20px;padding:3px 10px;margin-right:6px;display:inline-block;">${t}</span>`
      ).join("");

      htmlParts.push(`<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
<tr><td>
  ${tagsHtml ? `<p style="margin:0 0 8px 0;">${tagsHtml}</p>` : ""}
  <p style="font-family:Arial,sans-serif;font-size:17px;font-weight:bold;color:${headingColor};margin:0 0 8px 0;">🎓 ${prog.title}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#444444;margin:0 0 12px 0;">${prog.description || ""}</p>
  <p style="margin:0 0 0 0;"><a href="#" style="font-family:Arial,sans-serif;font-size:14px;color:${accentColor};text-decoration:none;">Получить консультацию →</a></p>
</td></tr>
</table>
<hr style="border:none;border-top:1px solid ${dividerColor};margin:0 0 24px 0;">`);
    }
    return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;"><tr><td>
<p style="font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:${headingColor};margin:0 0 8px 0;">Программы, на которые открыт набор</p>
<p style="font-family:Arial,sans-serif;font-size:15px;color:#444444;margin:0 0 24px 0;line-height:1.5;">Выберите программу, которая подходит именно вам.</p>
${htmlParts.join("\n")}
</td></tr></table>`;
  };

  const handleUpdateBlock = () => {
    const html = buildHtml();
    onUpdateConfig({ ...config, program_ids: selectedProgramIds });
    // We need to update generated_html on the block - pass it through config
    // and let the parent handle it
    onUpdateConfig({ ...config, program_ids: selectedProgramIds, _generated_html: html });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {selectedProgramIds.map((pid, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Программа {i + 1}</Label>
              <Select value={pid || ""} onValueChange={(v) => setProgramId(i, v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выбрать программу" />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-5" onClick={() => removeProgram(i)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {selectedProgramIds.length < 5 && (
        <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addProgram}>
          <Plus className="h-3.5 w-3.5" /> Добавить программу
        </Button>
      )}

      <Button
        className="w-full gap-1.5"
        onClick={handleUpdateBlock}
        disabled={selectedProgramIds.filter(Boolean).length < 2}
      >
        <RefreshCw className="h-4 w-4" /> Обновить блок
      </Button>
      {selectedProgramIds.filter(Boolean).length < 2 && (
        <p className="text-xs text-muted-foreground text-center">Выберите минимум 2 программы</p>
      )}
    </div>
  );
}
