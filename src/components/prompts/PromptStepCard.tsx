import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { categoryLabels } from "@/pages/Prompts";
import type { Database } from "@/integrations/supabase/types";

type PromptCategory = Database["public"]["Enums"]["prompt_category"];

interface PromptStepCardProps {
  prompt: any;
  showStepNumber?: boolean;
  onEdit: (prompt: any) => void;
  onToggle: (id: string, is_active: boolean) => void;
}

export default function PromptStepCard({ prompt: p, showStepNumber = true, onEdit, onToggle }: PromptStepCardProps) {
  return (
    <div className="flex items-start gap-4">
      {showStepNumber && (
        <div className="flex flex-col items-center pt-4">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
            {p.step_order ?? 1}
          </div>
        </div>
      )}
      <Card className="flex-1 border-l-4" style={{ borderLeftColor: p.is_active ? "hsl(var(--primary))" : "hsl(var(--muted))" }}>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-base">{p.name}</CardTitle>
            <Badge variant="outline">{categoryLabels[p.category as PromptCategory] ?? p.category}</Badge>
            <span className="text-xs text-muted-foreground">{p.provider} / {p.model}</span>
            <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Активен" : "Выключен"}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={p.is_active}
              onCheckedChange={(v) => onToggle(p.id, v)}
            />
            <Button variant="ghost" size="icon" onClick={() => onEdit(p)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {p.description && (
          <CardContent className="pt-0 text-sm text-muted-foreground">{p.description}</CardContent>
        )}
      </Card>
    </div>
  );
}
