

## Проблема: генерация баннера не сохраняет его в библиотеку

Edge-функция `generate-banner-image` генерирует изображение и загружает его в storage, но **не создаёт запись в таблице `banners`**. Запись создаётся только при нажатии «Сохранить в библиотеку» в диалоге. Если пользователь закрыл диалог или перешёл на другую страницу — баннер потерян. Задача в очереди показывает «Завершено», но библиотека пуста.

---

### Решение

**1. Edge-функция `generate-banner-image/index.ts`** — после загрузки изображения в storage, вставлять строку в таблицу `banners` прямо на бэкенде. Все метаданные (title, category, program_id, offer_type, color_scheme_id, note, created_by, generation_prompt) передавать в payload.

**2. `AddBannerDialog.tsx`** — при вызове `enqueue` передавать полный набор метаданных в payload. После завершения задачи (polling) — инвалидировать `["banners"]` и закрывать диалог. Убрать промежуточный шаг «Сохранить в библиотеку» для сгенерированных баннеров — они сохраняются автоматически.

**3. `TaskQueue.tsx`** — при клике на ссылку задачи с target_url `/banner-library` инвалидировать кэш `["banners"]`.

### Файлы
- `supabase/functions/generate-banner-image/index.ts` — добавить insert в `banners`
- `src/components/banners/AddBannerDialog.tsx` — передавать метаданные, автосохранение
- `src/pages/TaskQueue.tsx` — инвалидация кэша для banner-library

