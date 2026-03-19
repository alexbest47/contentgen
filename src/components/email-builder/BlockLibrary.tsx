import { Button } from "@/components/ui/button";
import {
  MessageSquareQuote, Type, ImageIcon, MousePointerClick, Minus,
  GraduationCap, BookOpen,
} from "lucide-react";

export type EmailBlockType =
  | "lead_magnet" | "reference_material" | "expert_content" | "provocative_content"
  | "list_content" | "testimonial_content" | "myth_busting" | "objection_handling"
  | "offer_collection"
  | "paid_programs_collection" | "free_courses_grid"
  | "text" | "image" | "cta" | "divider";

interface BlockDef {
  type: EmailBlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const generatedBlocks: BlockDef[] = [
  { type: "testimonial_content", label: "Кейс / отзыв", icon: MessageSquareQuote },
];

const userBlocks: BlockDef[] = [
  { type: "paid_programs_collection", label: "Курсы на которые идёт набор", icon: GraduationCap },
  { type: "free_courses_grid", label: "Подборка бесплатных курсов", icon: BookOpen },
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

export const blockTypeLabels: Record<string, string> = {
  testimonial_content: "Кейс / отзыв",
  paid_programs_collection: "Курсы на которые идёт набор",
  free_courses_grid: "Подборка бесплатных курсов",
  offer_collection: "Подборка офферов",
  text: "Текстовый блок",
  image: "Изображение",
  cta: "Кнопка CTA",
  divider: "Разделитель",
  // Legacy block types for backwards compatibility
  lead_magnet: "Лид-магнит",
  reference_material: "Справочный материал",
  expert_content: "Экспертный контент",
  provocative_content: "Провокационный контент",
  list_content: "Пост-список",
  myth_busting: "Разбор мифа",
  objection_handling: "Отработка возражения",
};

export const isGeneratedBlock = (type: string) =>
  ["testimonial_content", "objection_handling", "offer_collection",
   "lead_magnet", "reference_material", "expert_content", "provocative_content",
   "list_content", "myth_busting"].includes(type);

/** Blocks whose content is fully determined by the prompt — no user settings */
export const isTemplateLocked = (type: string) =>
  ["expert_content", "lead_magnet", "reference_material",
   "provocative_content", "list_content", "myth_busting",
   "objection_handling"].includes(type);
