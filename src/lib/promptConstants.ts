import type { Database } from "@/integrations/supabase/types";

export type PromptCategory = Database["public"]["Enums"]["prompt_category"];

export const categoryLabels: Record<PromptCategory, string> = {
  lead_magnets: "Лид-магниты",
  slide_structure: "Структура слайдов",
  text_instagram: "Текст Instagram",
  text_vk: "Текст VK",
  text_telegram: "Текст Telegram",
  text_email: "Текст Email",
  test_generation: "Генерация теста",
  image_carousel: "Изображения карусели",
  image_post: "Изображения поста",
  image_email: "Изображение Email",
};

export const categories = Object.keys(categoryLabels) as PromptCategory[];

export const contentTypeLabels: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  vk: "ВКонтакте",
  email: "Email",
};

export const subTypeLabels: Record<string, string> = {
  announcement: "Анонс",
  warmup: "Прогрев",
  conversion: "Конверсия",
};

export const contentTypeKeys = Object.keys(contentTypeLabels);
export const subTypeKeys = Object.keys(subTypeLabels);

export interface PromptForm {
  name: string;
  slug: string;
  category: PromptCategory;
  description: string;
  provider: string;
  model: string;
  system_prompt: string;
  user_prompt_template: string;
  output_format_hint: string;
  is_active: boolean;
  content_type: string;
  sub_type: string;
  step_order: number;
  offer_type: string;
}

export const emptyForm: PromptForm = {
  name: "", slug: "", category: "lead_magnets", description: "",
  provider: "anthropic", model: "claude-sonnet-4-20250514",
  system_prompt: "", user_prompt_template: "", output_format_hint: "", is_active: true,
  content_type: "", sub_type: "", step_order: 1, offer_type: "mini_course",
};
