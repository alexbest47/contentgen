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
};

export const categories = Object.keys(categoryLabels) as PromptCategory[];

export const contentTypeLabels: Record<string, string> = {
  lead_magnet: "Лидмагнит",
  diagnostic: "Диагностика",
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
