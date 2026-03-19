import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  caseId: string | null;
  onChangeCaseId: (id: string | null) => void;
}

export default function TestimonialCaseSelector({ caseId, onChangeCaseId }: Props) {
  const { data: cases } = useQuery({
    queryKey: ["case_classifications_all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("case_classifications")
        .select("id, file_name, classification_json")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-sm">Кейс / отзыв</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Выберите кейс студента. Данные кейса будут использованы при генерации письма
        </p>
      </div>

      <Select value={caseId || ""} onValueChange={(v) => onChangeCaseId(v || null)}>
        <SelectTrigger>
          <SelectValue placeholder="Выберите кейс…" />
        </SelectTrigger>
        <SelectContent>
          {cases?.map((c) => {
            const json = c.classification_json as any;
            const label = json?.student_name
              ? `${json.student_name} — ${c.file_name}`
              : c.file_name;
            return (
              <SelectItem key={c.id} value={c.id}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
