import { Badge } from "@/components/ui/badge";
import PromptStepCard from "./PromptStepCard";

interface PipelineGroupProps {
  groupKey: string;
  label: string;
  prompts: any[];
  onEdit: (prompt: any) => void;
  onToggle: (id: string, is_active: boolean) => void;
  onDuplicate: (prompt: any) => void;
}

export default function PipelineGroup({ groupKey, label, prompts, onEdit, onToggle, onDuplicate }: PipelineGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-lg font-semibold">{label}</h3>
        <Badge variant="secondary">{prompts.length} {prompts.length === 1 ? "промпт" : prompts.length < 5 ? "промпта" : "промптов"}</Badge>
      </div>
      <div className="space-y-3">
        {prompts.map((p: any) => (
          <PromptStepCard
            key={p.id}
            prompt={p}
            showStepNumber={false}
            onEdit={onEdit}
            onToggle={onToggle}
            onDuplicate={onDuplicate}
          />
        ))}
      </div>
    </div>
  );
}
