import { Badge } from "@/components/ui/badge";
import { ArrowDown } from "lucide-react";
import PromptStepCard from "./PromptStepCard";

interface PipelineGroupProps {
  groupKey: string;
  label: string;
  prompts: any[];
  onEdit: (prompt: any) => void;
  onToggle: (id: string, is_active: boolean) => void;
}

export default function PipelineGroup({ groupKey, label, prompts, onEdit, onToggle }: PipelineGroupProps) {
  return (
    <div className="ml-4 border-l-2 border-muted pl-4">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-base font-semibold">{label}</h3>
        <Badge variant="secondary">{prompts.length} {prompts.length === 1 ? "шаг" : prompts.length < 5 ? "шага" : "шагов"}</Badge>
      </div>
      <div className="relative">
        {prompts.map((p: any, idx: number) => (
          <div key={p.id}>
            <PromptStepCard
              prompt={p}
              showStepNumber
              onEdit={onEdit}
              onToggle={onToggle}
            />
            {idx < prompts.length - 1 && (
              <div className="flex items-center gap-4 py-1">
                <div className="w-7 flex justify-center">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
