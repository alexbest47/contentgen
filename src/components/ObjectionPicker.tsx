import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ObjectionRow {
  id: string;
  objection_text: string;
  tags: string[] | null;
}

interface Props {
  programId: string;
  mode: "single" | "multi";
  value: string[];
  onChange: (ids: string[]) => void;
}

export default function ObjectionPicker({ programId, mode, value, onChange }: Props) {
  const { data: objections, isLoading } = useQuery({
    queryKey: ["objections_picker", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objections")
        .select("id, objection_text, tags")
        .eq("program_id", programId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ObjectionRow[];
    },
    enabled: !!programId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Загрузка возражений...
      </div>
    );
  }

  if (!objections || objections.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-4 text-center border rounded-md">
        Для этой программы пока нет возражений. Добавьте их в разделе «Работа с возражениями».
      </div>
    );
  }

  const toggle = (id: string) => {
    if (mode === "single") {
      onChange([id]);
    } else {
      onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
    }
  };

  if (mode === "single") {
    return (
      <RadioGroup value={value[0] || ""} onValueChange={(v) => onChange([v])} className="gap-2 max-h-[320px] overflow-y-auto pr-1">
        {objections.map((o) => (
          <label
            key={o.id}
            htmlFor={`obj-${o.id}`}
            className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
          >
            <RadioGroupItem value={o.id} id={`obj-${o.id}`} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm">{o.objection_text}</div>
              {o.tags && o.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {o.tags.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          </label>
        ))}
      </RadioGroup>
    );
  }

  return (
    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
      {objections.map((o) => {
        const checked = value.includes(o.id);
        return (
          <label
            key={o.id}
            className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
          >
            <Checkbox checked={checked} onCheckedChange={() => toggle(o.id)} className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm">{o.objection_text}</div>
              {o.tags && o.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {o.tags.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          </label>
        );
      })}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">Выбрано: {value.length}</p>
      )}
    </div>
  );
}
