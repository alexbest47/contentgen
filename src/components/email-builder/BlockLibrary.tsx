import { Button } from "@/components/ui/button";
import {
  Magnet, BookOpen, BrainCircuit, Flame, List, MessageSquareQuote,
  Ghost, ShieldQuestion, Type, ImageIcon, MousePointerClick, Minus,
} from "lucide-react";

export type EmailBlockType =
  | "lead_magnet" | "reference_material" | "expert_content" | "provocative_content"
  | "list_content" | "testimonial_content" | "myth_busting" | "objection_handling"
  | "text" | "image" | "cta" | "divider";

interface BlockDef {
  type: EmailBlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const generatedBlocks: BlockDef[] = [
  { type: "lead_magnet", label: "Лид-магнит", icon: Magnet },
  { type: "reference_material", label: "Справочный материал", icon: BookOpen },
  { type: "expert_content", label: "Экспертный контент", icon: BrainCircuit },
  { type: "provocative_content", label: "Провокационный контент", icon: Flame },
  { type: "list_content", label: "Пост-список", icon: List },
  { type: "testimonial_content", label: "Кейс / отзыв", icon: MessageSquareQuote },
  { type: "myth_busting", label: "Разбор мифа", icon: Ghost },
  { type: "objection_handling", label: "Отработка возражения", icon: ShieldQuestion },
];

const userBlocks: BlockDef[] = [
  { type: "text", label: "Текстовый блок", icon: Type },
  { type: "image", label: "Изображение", icon: ImageIcon },
  { type: "cta", label: "Кнопка CTA", icon: MousePointerClick },
  { type: "divider", label: "Разделитель", icon: Minus },
];

interface Props {
  onAddBlock: (type: EmailBlockType) => void;
}

export default function BlockLibrary({ onAddBlock }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Генерируемые
        </h3>
        <div className="space-y-1">
          {generatedBlocks.map((b) => (
            <Button
              key={b.type}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sm h-9"
              onClick={() => onAddBlock(b.type)}
            >
              <b.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{b.label}</span>
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Пользовательские
        </h3>
        <div className="space-y-1">
          {userBlocks.map((b) => (
            <Button
              key={b.type}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sm h-9"
              onClick={() => onAddBlock(b.type)}
            >
              <b.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{b.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const blockTypeLabels: Record<EmailBlockType, string> = {
  lead_magnet: "Лид-магнит",
  reference_material: "Справочный материал",
  expert_content: "Экспертный контент",
  provocative_content: "Провокационный контент",
  list_content: "Пост-список",
  testimonial_content: "Кейс / отзыв",
  myth_busting: "Разбор мифа",
  objection_handling: "Отработка возражения",
  text: "Текстовый блок",
  image: "Изображение",
  cta: "Кнопка CTA",
  divider: "Разделитель",
};

export const isGeneratedBlock = (type: string) =>
  ["lead_magnet", "reference_material", "expert_content", "provocative_content",
   "list_content", "testimonial_content", "myth_busting", "objection_handling"].includes(type);
