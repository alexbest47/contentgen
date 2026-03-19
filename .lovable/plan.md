

## Задача

Убедиться, что перед вызовом генерации письма все поля из wizard (тема, аудитория, программа, оффер, цветовая гамма, кейс) сохранены в БД, потому что edge-функция читает их оттуда.

## Текущая проблема

В `generateLetter` (строки 321-325) перед вызовом edge-функции сохраняются только 3 поля: `case_id`, `extra_offer_ids`, `audience_segment`. Остальные поля (`program_id`, `offer_id`, `offer_type`, `selected_color_scheme_id`, `letter_theme_title`, `letter_theme_description`) **не сохраняются** перед генерацией.

Если пользователь, например, сменил цветовую гамму в хедере и сразу нажал «Сгенерировать» — edge-функция получит старое значение из БД.

Wizard сохраняет эти поля при создании, но auto-save (каждые 30 сек) может не успеть.

## Edge-функция: маппинг переменных (уже корректный)

| Переменная промпта | Откуда берётся | Статус |
|---|---|---|
| `{{letter_theme}}` | `letter.letter_theme_title` + `letter.letter_theme_description` | ✓ |
| `{{audience_description}}` | `letter.audience_segment` → global var value | ✓ |
| `{{program_doc_description}}` | `program.program_doc_url` → Google Doc | ✓ |
| `{{offer_type}}` | `offer.offer_type` → русский лейбл | ✓ |
| `{{offer_title}}` | `offer.title` | ✓ |
| `{{offer_description}}` | `offer.doc_url` → Google Doc | ✓ |
| `{{case_data}}` | `case_classifications.classification_json` | ✓ |
| `{{offer_rules}}` | `prompt_global_variables.offer_rules` | ✓ |
| `{{antiAI_rules}}` | `prompt_global_variables.antiAI_rules` | ✓ |
| `{{brand_voice}}` | `prompt_global_variables.brand_voice` | ✓ |
| `{{brand_style}}` | `color_schemes.description` по `selected_color_scheme_id` | ✓ |
| `{{template_name}}` | `email_templates.name` по `template_id` | ✓ |

## Изменение

### `src/pages/EmailBuilder.tsx` — `generateLetter` (строки 320-325)

Расширить pre-save перед вызовом edge-функции, чтобы гарантированно сохранить **все** поля, которые edge-функция читает:

```ts
await supabase.from("email_letters").update({
  title,
  subject,
  preheader,
  selected_color_scheme_id: colorSchemeId,
  letter_theme_title: letterThemeTitle,
  letter_theme_description: letterThemeDescription,
  program_id: programId,
  offer_type: offerType,
  offer_id: offerId,
  case_id: caseId,
  extra_offer_ids: extraOfferIds,
  audience_segment: audienceSegment,
} as any).eq("id", letterId);
```

Это единственное изменение. Edge-функция уже корректно подставляет все переменные.

