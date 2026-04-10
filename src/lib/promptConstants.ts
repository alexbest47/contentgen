import type { Database } from "@/integrations/supabase/types";

export type PromptCategory = Database["public"]["Enums"]["prompt_category"];

export const categoryLabels: Record<PromptCategory, string> = {
  lead_magnets: "Лид-магниты",
  reference_materials: "Справочные материалы",
  slide_structure: "Структура слайдов",
  text_instagram: "Текст Instagram",
  text_vk: "Текст VK",
  text_telegram: "Текст Telegram",
  text_email: "Текст Email",
  test_generation: "Генерация теста",
  image_carousel: "Изображения карусели",
  image_post: "Изображения поста",
  image_email: "Изображение Email",
  expert_content: "Экспертный контент",
  provocative_content: "Провокационный контент",
  list_content: "Список",
  case_analysis: "Анализ кейсов",
  testimonial_content: "Контент-отзыв",
  myth_busting: "Разбор мифа",
  objection_handling: "Отработка возражения",
  email_builder: "Конструктор email",
  bot_builder: "Конструктор ботов",
  pdf_generation: "Генерация PDF",
  landing_block_content: "Конструктор лендингов",
  landing_block_teachers: "Лендинг: преподаватели",
  landing_block_curriculum: "Лендинг: программа обучения",
  landing_block_faq: "Лендинг: часто задаваемые вопросы",
};

export const categories = Object.keys(categoryLabels) as PromptCategory[];

export const contentTypeLabels: Record<string, string> = {
  from_scratch: "С нуля",
  trust_ai: "Доверимся ИИ",
  webinar_invite: "Приглашение на вебинар",
  direct_offer: "Прямой оффер",
  multi_offer: "Мультиоффер",
  transformation_story: "История трансформации",
  webinar_invite_2: "Приглашение на вебинар — Письмо 2",
  lead_magnet: "Лидмагнит",
  reference_material: "Справочный материал",
  diagnostic: "Диагностика",
  expert_content: "Экспертный контент",
  provocative_content: "Провокационный контент",
  list_content: "Список",
  case_analysis: "Кейсы",
  testimonial_content: "Контент-отзыв",
  myth_busting: "Разбор мифа",
  objection_handling: "Отработка возражения",
  email_builder: "Конструктор email",
  pdf_material: "PDF-материал",
  landing_block_content: "Конструктор лендингов",
};

export const contentTypeKeys = Object.keys(contentTypeLabels);

export const channelLabels: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  vk: "ВКонтакте",
  email: "Email",
};

export const channelKeys = Object.keys(channelLabels);

export const deriveCategory = (contentType: string, channel?: string): PromptCategory => {
  if (contentType === "diagnostic") return "test_generation";
  if (contentType === "reference_material") return "reference_materials";
  if (contentType === "expert_content") return "expert_content";
  if (contentType === "provocative_content") return "provocative_content";
  if (contentType === "list_content") return "list_content";
  if (contentType === "case_analysis") return "case_analysis";
  if (contentType === "testimonial_content") return "testimonial_content";
  if (contentType === "myth_busting") return "myth_busting";
  if (contentType === "objection_handling") return "objection_handling";
  if (contentType === "email_builder") return "email_builder";
  if (contentType === "bot_builder") return "bot_builder";
  if (contentType === "pdf_material") return "pdf_generation";
  if (contentType === "landing_block_content") return "landing_block_content";
  if (channel) {
    const mapping: Record<string, PromptCategory> = {
      instagram: "text_instagram",
      telegram: "text_telegram",
      vk: "text_vk",
      email: "text_email",
    };
    return mapping[channel] || "lead_magnets";
  }
  return "lead_magnets";
};

export interface PromptForm {
  name: string;
  slug: string;
  description: string;
  provider: string;
  model: string;
  system_prompt: string;
  user_prompt_template: string;
  output_format_hint: string;
  is_active: boolean;
  content_type: string;
  channel: string;
  step_order: number;
}

export const emptyForm: PromptForm = {
  name: "", slug: "", description: "",
  provider: "anthropic", model: "claude-sonnet-4-20250514",
  system_prompt: "", user_prompt_template: "", output_format_hint: "", is_active: true,
  content_type: "lead_magnet", channel: "", step_order: 1,
};
