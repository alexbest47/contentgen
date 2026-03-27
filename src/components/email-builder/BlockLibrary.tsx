import { Button } from "@/components/ui/button";
import {
  MessageSquareQuote, Type, ImageIcon, MousePointerClick,
  GraduationCap, BookOpen, ShieldQuestion, Square,
} from "lucide-react";

export type EmailBlockType =
  | "lead_magnet" | "reference_material" | "expert_content" | "provocative_content"
  | "list_content" | "testimonial_content" | "myth_busting" | "objection_handling"
  | "offer_collection"
  | "paid_programs_collection" | "free_courses_grid"
  | "card"
  | "text" | "image" | "cta" | "divider";

interface BlockDef {
  type: EmailBlockType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const generatedBlocksDefault: BlockDef[] = [
  { type: "testimonial_content", label: "Кейс / отзыв", icon: MessageSquareQuote },
];

const generatedBlocksDirectOffer: BlockDef[] = [
  { type: "testimonial_content", label: "Кейс / отзыв", icon: MessageSquareQuote },
  { type: "objection_handling", label: "Возражение", icon: ShieldQuestion },
];

const readyBlocks: BlockDef[] = [
  { type: "paid_programs_collection", label: "Курсы на которые идёт набор", icon: GraduationCap },
  { type: "free_courses_grid", label: "Подборка бесплатных курсов", icon: BookOpen },
];

const elementBlocks: BlockDef[] = [
  { type: "card", label: "Карточка", icon: Square },
  { type: "text", label: "Текстовый блок", icon: Type },
  { type: "image", label: "Изображение", icon: ImageIcon },
  { type: "cta", label: "Кнопка CTA", icon: MousePointerClick },
];

interface Props {
  onAddBlock: (type: EmailBlockType) => void;
  isFullLetterMode?: boolean;
  templateName?: string;
}

const NO_CASE_TEMPLATES = ["Приглашение на вебинар: письмо 1", "Приглашение на вебинар: письмо 2", "С нуля"];

export default function BlockLibrary({ onAddBlock, isFullLetterMode, templateName }: Props) {
  const isDirectOffer = templateName === "Прямой оффер";
  const isNoCaseTemplate = NO_CASE_TEMPLATES.includes(templateName || "");
  const generatedBlocks = isDirectOffer ? generatedBlocksDirectOffer : generatedBlocksDefault;

  return (
    <div className="space-y-4">
      {!isFullLetterMode && !isNoCaseTemplate && (
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
      )}

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Готовые блоки
        </h3>
        <div className="space-y-1">
          {readyBlocks.map((b) => (
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
          Добавить элемент
        </h3>
        <div className="space-y-1">
          {elementBlocks.map((b) => (
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
  objection_handling: "Возражение",
  paid_programs_collection: "Курсы на которые идёт набор",
  free_courses_grid: "Подборка бесплатных курсов",
  offer_collection: "Подборка офферов",
  card: "Карточка",
  text: "Текстовый блок",
  image: "Изображение",
  cta: "Кнопка CTA",
  divider: "Разделитель",
  // Webinar block types
  hook_situation: "Крючок + ситуация читателя",
  webinar_program: "Программа вебинара",
  speaker: "Спикер",
  offer_cta: "CTA",
  hook_question: "Интригующий вопрос + зачин",
  insights: "Инсайты по теме",
  speaker_short: "Спикер (коротко)",
  // Legacy block types for backwards compatibility
  lead_magnet: "Лид-магнит",
  reference_material: "Справочный материал",
  expert_content: "Экспертный контент",
  provocative_content: "Провокационный контент",
  list_content: "Пост-список",
  myth_busting: "Разбор мифа",
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
