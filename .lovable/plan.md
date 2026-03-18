

## Задача

Переработать архитектуру конструктора писем: от модели «блоки собираются вручную» к модели «одна кнопка генерирует всё письмо целиком».

---

## 1. База данных — 1 миграция

Добавить в `email_letters` поля для хранения настроек генерации и результата:

```sql
ALTER TABLE public.email_letters
  ADD COLUMN program_id uuid REFERENCES public.paid_programs(id),
  ADD COLUMN offer_type text NOT NULL DEFAULT '',
  ADD COLUMN offer_id uuid REFERENCES public.offers(id),
  ADD COLUMN case_id uuid REFERENCES public.case_classifications(id),
  ADD COLUMN extra_offer_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN generated_html text NOT NULL DEFAULT '',
  ADD COLUMN image_placeholders jsonb NOT NULL DEFAULT '[]';
```

`image_placeholders` — массив JSON-объектов вида `{ id, type, size, prompt, image_url }` для управления заглушками изображений.

---

## 2. Wizard — шаг 3 расширяется

**Файл:** `src/components/email-builder/CreateLetterWizard.tsx`

Добавить на шаг 3 (после «Название письма» и «Цветовая гамма»):
- Платная программа (Select из `paid_programs`)
- Тип оффера (Select из `OFFER_TYPES`, зависит от программы)
- Конкретный оффер (Select из `offers`, зависит от программы + типа)

При создании письма — сохранять `program_id`, `offer_type`, `offer_id` в `email_letters`. Блоки из шаблона по-прежнему вставляются (для обратной совместимости), но генерация НЕ запускается.

---

## 3. Левая панель — упрощение

**Файл:** `src/components/email-builder/BlockLibrary.tsx`

Из `generatedBlocks` убрать: `lead_magnet`, `reference_material`, `expert_content`, `provocative_content`, `list_content`, `myth_busting`, `objection_handling`.

Оставить:
- `testimonial_content` (Кейс / отзыв)
- `offer_collection` (Подборка офферов)

Раздел «Пользовательские» — без изменений.

---

## 4. Правая панель — два режима

**Новый файл:** `src/components/email-builder/LetterGenerationPanel.tsx`

Панель с двумя режимами: «до генерации» и «после генерации».

**До генерации:**
- Секция «Кейс студента»: dropdown кейсов (`case_classifications`) для выбранной программы. Необязательно.
- Секция «Дополнительные офферы»: мультиселект офферов из всех программ (до 3). Необязательно.
- Кнопка «Сгенерировать письмо» (всегда активна). Подпись: «Письмо будет создано целиком — от приветствия до кнопки CTA».

**После генерации:**
- Верхний блок — readonly-сводка настроек (тема, шаблон, программа, оффер, кейс, подборка). Кнопка «Изменить настройки» → переключает в режим «до генерации».
- Нижний блок — кнопка «Перегенерировать письмо».

При клике на текстовый блок в canvas — правая панель показывает inline-редактор (textarea с HTML этого блока).

**Файл:** `src/pages/EmailBuilder.tsx`
- Заменить правую панель: если письмо не сгенерировано → `LetterGenerationPanel` (до генерации). Если сгенерировано и нет выбранного блока → `LetterGenerationPanel` (после генерации). Если выбран пользовательский блок → `BlockSettingsPanel` (для text/image/cta/divider) или `OfferCollectionSettings`/`GeneratedBlockSettings` (для testimonial/offer_collection).
- Добавить state: `generatedHtml`, `imagePlaceholders`, `selectedCase`, `extraOffers`, `generatingLetter`.
- Новый handler `generateLetter()`: вызывает edge-функцию `generate-email-letter`, получает HTML + image_placeholders, сохраняет в `email_letters`, рендерит в canvas.
- Загрузить `program_id`, `offer_id`, `offer_type`, `case_id`, `extra_offer_ids` из `email_letters`.

---

## 5. Canvas — рендеринг полного HTML

**Файл:** `src/components/email-builder/BlockCanvas.tsx`

Добавить новый режим рендеринга: если `generatedHtml` передан (не пустой), рендерить его целиком через `dangerouslySetInnerHTML` вместо списка блоков.

Заглушки изображений: в сгенерированном HTML вместо реальных `<img>` будут маркеры `<!-- IMAGE_PLACEHOLDER:id -->`. Canvas заменяет их на серые блоки с подписью типа/размера и кнопкой «Сгенерировать изображение». После генерации — заменяет на реальный `<img>`.

Добавить пропсы: `generatedHtml`, `imagePlaceholders`, `onGenerateImage(placeholderId)`, `generatingImageId`.

---

## 6. Edge-функция `generate-email-letter`

**Новый файл:** `supabase/functions/generate-email-letter/index.ts`

Принимает: `letter_id`.

Логика:
1. Загрузить `email_letters` (тема, шаблон, программа, оффер, кейс, подборка, цветовая гамма)
2. Загрузить программу, оффер, audience/program docs (как в generate-email-block)
3. Загрузить кейс (case_classifications → classification_json) если выбран
4. Загрузить доп. офферы по `extra_offer_ids`
5. Загрузить шаблон (email_templates → blocks) для структуры
6. Загрузить промпт «Генерация письма» (`slug: email-builder-full-letter`)
7. Загрузить глобальные переменные, цветовую схему
8. Подставить все переменные в промпт
9. Вызвать Anthropic
10. Распарсить JSON: `{ html, image_placeholders: [{ id, type, size, prompt }] }`
11. Сохранить `generated_html` и `image_placeholders` в `email_letters`
12. Вернуть результат

Генерация изображений: тот же механизм что в `generate-email-block` (image mode) — принимает `generate_image: true, placeholder_id, prompt`.

**Файл:** `supabase/config.toml` — НЕ трогаем (auto).

---

## 7. Header — упрощение

**Файл:** `src/components/email-builder/EmailBuilderHeader.tsx`

Убрать кнопку «Сгенерировать всё» (теперь генерация идет из правой панели). Оставить: название, тему/прехедер с генерацией, цветовую гамму, экспорт, сохранение, тему контента.

---

## 8. Экспорт HTML

**Файл:** `src/pages/EmailBuilder.tsx` → `handleExport`

Если `generatedHtml` не пуст — экспортировать `header + generatedHtml (с подставленными image URLs) + footer` вместо сборки из блоков. Заменить маркеры `<!-- IMAGE_PLACEHOLDER:id -->` на реальные `<img>` из `imagePlaceholders`.

---

## Файлы (итого ~8)

**Новые:** `LetterGenerationPanel.tsx`, `generate-email-letter/index.ts`
**Изменяемые:** `CreateLetterWizard.tsx`, `BlockLibrary.tsx`, `BlockCanvas.tsx`, `EmailBuilderHeader.tsx`, `EmailBuilder.tsx`, `EmailBuilderList.tsx`
**Миграция:** 1

