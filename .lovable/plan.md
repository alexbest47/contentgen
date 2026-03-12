

## План: Генерация изображений через OpenRouter + Google Imagen

### Архитектура

Категории `image_carousel`, `image_post`, `image_email` будут обрабатываться отдельной edge-функцией, которая вызывает OpenRouter API с моделью Google Imagen, получает base64-изображение, загружает его в storage и сохраняет URL в `content_pieces`.

### Изменения

**1. Секрет `OPENROUTER_API_KEY`**
Запросить у пользователя ключ через add_secret.

**2. Storage bucket `generated-images`**
Создать публичный bucket через SQL-миграцию с RLS-политикой на чтение для всех и запись для authenticated.

**3. Новая edge-функция `generate-image/index.ts`**
- Принимает `{ project_id, category }` (только image_carousel / image_post / image_email)
- Загружает проект, оффер, программу, лид-магнит (как в generate-content)
- Загружает активный промпт для данной категории
- Подставляет переменные в user_prompt_template
- Вызывает OpenRouter API (`https://openrouter.ai/api/v1/images/generations`) с моделью `google/imagen-4` 
- Получает base64, загружает в bucket `generated-images/{project_id}/{category}/{timestamp}.png`
- Получает публичный URL
- Сохраняет URL в `content_pieces` (поле `content` = URL изображения)
- Записывает `generation_runs`

**4. `supabase/config.toml`** — добавить `[functions.generate-image]` с `verify_jwt = false`.

**5. `src/pages/ProjectDetail.tsx`**
- Добавить категории изображений в `contentCategories`
- Для image-категорий: вызывать `generate-image` вместо `generate-content`
- Отображать результат как `<img>` вместо текстового блока
- Добавить кнопку скачивания

**6. `src/pages/PromptVariables.tsx`** — добавить примечание, что для image-категорий промпт используется как описание для генерации изображения.

### Порядок реализации
1. Запросить OPENROUTER_API_KEY
2. Создать storage bucket (миграция)
3. Создать edge-функцию generate-image
4. Обновить ProjectDetail для отображения изображений
5. Обновить config.toml

