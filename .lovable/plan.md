

## Обновление карточек шаблонов на странице «Шаблоны писем»

Нужно обновить JSON `blocks` в обеих записях `email_templates` и слегка доработать рендеринг, чтобы поддерживать произвольные названия блоков и режимов.

---

### 1. Обновить данные в БД (два UPDATE)

**«История трансформации»** — заменить `blocks` на:
```json
[
  {"block_type":"hook_monologue","label":"Зачин + внутренний монолог","mode":"text_only"},
  {"block_type":"testimonial_content","label":"Кейс студента","mode":"card_text"},
  {"block_type":"instrument_schema","label":"Инструмент / схема","mode":"schema_text"},
  {"block_type":"myth_busting","label":"Разбор мифа","mode":"html_cards"},
  {"block_type":"program_description","label":"Описание программы","mode":"text_only"},
  {"block_type":"offer_cta","label":"Оффер + бонусы + CTA","mode":"accent_block"}
]
```

**«Прямой оффер»** — заменить `blocks` на:
```json
[
  {"block_type":"hook_offer_cta","label":"Крючок + оффер + первый CTA","mode":"text_button"},
  {"block_type":"testimonial_content","label":"Кейс студента","mode":"card_text"},
  {"block_type":"objection_handling","label":"Отработка возражений","mode":"qa_cards"},
  {"block_type":"final_offer_cta","label":"Финальный оффер + CTA","mode":"accent_block"}
]
```

### 2. Обновить рендеринг (`EmailTemplates.tsx`)

- Если блок содержит поле `label` — показывать его вместо `blockTypeLabels[block_type]`.
- Расширить `MODE_LABELS` новыми ключами: `card_text`, `schema_text`, `html_cards`, `accent_block`, `text_button`, `qa_cards`.

Минимальные правки: 1 файл + 2 SQL-запроса.

