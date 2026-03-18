

## Задача

Привести код в соответствие с форматом JSON, который ожидает промпт `email-builder-full-letter`.

---

## Расхождения (промпт → код)

| Что | Промпт ожидает | Код ожидает |
|---|---|---|
| HTML тело | `letter_html` | `html` |
| Тема | `email_subject` | не парсится |
| Прехедер | `email_preheader` | не парсится |
| Массив картинок | `images` | `image_placeholders` |
| ID картинки | `placeholder_id` | `id` |
| Промпт картинки | `imagen_prompt` | `prompt` |
| Маркер в HTML | `<img src="{{image_placeholder_N}}"...>` | `<!-- IMAGE_PLACEHOLDER:id -->` |
| Переменная шаблона | `{{template_name}}` | `{{template_structure}}` (JSON блоков) |
| Переменная подборки | `{{offers_selection}}` | `{{extra_offers}}` |

---

## Изменения

### 1. Edge-функция `generate-email-letter/index.ts`

**Загрузка шаблона** — сохранять `templateName` (имя шаблона), а не JSON блоков.

**Подстановка переменных:**
- Добавить `{{template_name}}` → имя шаблона (напр. "transformation_story")
- Переименовать `{{extra_offers}}` → `{{offers_selection}}`

**Парсинг ответа AI:**
- `letter_html` вместо `html`
- `images` вместо `image_placeholders`
- Маппинг полей: `placeholder_id` → `id`, `imagen_prompt` → `prompt`
- Извлечь `email_subject` и `email_preheader` из ответа

**Сохранение в БД:**
- Сохранять `subject` и `preheader` из ответа AI (если пришли)
- `image_placeholders` сохранять в нормализованном формате (с `id`, `prompt`)

### 2. Canvas `BlockCanvas.tsx`

Изменить парсинг маркеров: вместо `<!-- IMAGE_PLACEHOLDER:id -->` искать `<img src="{{image_placeholder_N}}"` и заменять на интерактивные заглушки или реальные изображения. Маркер — это `{{image_placeholder_N}}` внутри атрибута `src` тега `<img>`.

### 3. Экспорт HTML `EmailBuilder.tsx`

В `handleExport` заменять `{{image_placeholder_N}}` в `src` на реальные URL вместо `<!-- IMAGE_PLACEHOLDER:id -->`.

### 4. `LetterGenerationPanel.tsx`

Интерфейс `ImagePlaceholder` — поля остаются `id`, `type`, `size`, `prompt`, `image_url` (нормализация происходит в edge-функции). Без изменений.

### 5. `EmailBuilder.tsx` — обработка ответа генерации

При получении ответа от edge-функции — также сохранять `subject` и `preheader` если они пришли от AI.

---

## Файлы (5)

- `supabase/functions/generate-email-letter/index.ts` — парсинг + переменные
- `src/components/email-builder/BlockCanvas.tsx` — маркеры
- `src/pages/EmailBuilder.tsx` — экспорт + обработка ответа
- `src/components/email-builder/LetterGenerationPanel.tsx` — без изменений (нормализация в edge)

Итого ~4 файла.

