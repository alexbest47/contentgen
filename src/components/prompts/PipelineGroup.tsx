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
          />
        ))}
      </div>
    </div>
  );
}
