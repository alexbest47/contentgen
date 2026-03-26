

## Кнопка «Перегенерировать» для сгенерированных баннеров

### Что делаем

Добавить пункт «Перегенерировать» в выпадающее меню карточки баннера (рядом с «Редактировать» и «Удалить»). Показывать только для баннеров с `source === "generated"` и непустым `generation_prompt`. По клику — отправлять тот же промпт и параметры в очередь задач, а после успешной генерации обновлять `image_url` баннера.

### Изменения

**1. `src/pages/BannerLibrary.tsx`**

- В `BannerGrid` добавить колбэк `onRegenerate` и передать его из родителя.
- В `DropdownMenuContent` добавить пункт `<DropdownMenuItem>` с иконкой `RefreshCw` — «Перегенерировать». Показывать условно: `b.source === "generated" && b.generation_prompt`.
- В родительском компоненте добавить функцию `handleRegenerate(banner)`:
  - Вызывает `enqueue` из `useTaskQueue` с `functionName: "generate-banner-image"`, передавая все поля баннера (`prompt: banner.generation_prompt`, `banner_type`, `color_scheme_id`, `title`, `category`, `program_id`, `offer_type`, `note`, `created_by`).
  - Дополнительно передать `existing_banner_id: banner.id` в payload, чтобы edge-функция обновила существующую запись вместо создания новой.
- Добавить состояние `regeneratingId` для показа спиннера на карточке.

**2. `supabase/functions/generate-banner-image/index.ts`**

- Принять опциональное поле `existing_banner_id` из payload.
- Если `existing_banner_id` передан — вместо `INSERT` делать `UPDATE` записи: обновить `image_url` и `generation_prompt`.
- Если не передан — работать как раньше (создать новую запись).

### Что уже есть
- Поле `generation_prompt` уже сохраняется в БД при генерации — дополнительных миграций не нужно.
- `useTaskQueue` уже используется в проекте.

