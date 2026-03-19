import {
  BookOpen, Stethoscope, Video, ListChecks,
  Rocket, UserCheck, ShoppingCart, Percent, FileDown,
} from "lucide-react";

export const OFFER_TYPES = [
  { key: "mini_course", label: "Мини-курс", icon: BookOpen },
  { key: "diagnostic", label: "Диагностика", icon: Stethoscope },
  { key: "webinar", label: "Вебинар", icon: Video },
  { key: "pre_list", label: "Предсписок", icon: ListChecks },
  { key: "new_stream", label: "Старт нового потока", icon: Rocket },
  { key: "spot_available", label: "Освободилось место", icon: UserCheck },
  { key: "sale", label: "Распродажа", icon: ShoppingCart },
  { key: "discount", label: "Скидка", icon: Percent },
  { key: "download_pdf", label: "Скачай PDF", icon: FileDown },
] as const;

export type OfferTypeKey = typeof OFFER_TYPES[number]["key"];

export const CONTENT_OFFER_KEYS: OfferTypeKey[] = ["mini_course", "diagnostic", "webinar", "download_pdf"];
export const SALES_OFFER_KEYS: OfferTypeKey[] = ["pre_list", "new_stream", "spot_available", "sale", "discount"];

export function getOfferTypeLabel(key: string): string {
  return OFFER_TYPES.find((t) => t.key === key)?.label ?? key;
}
