

## Проблема: сгенерированное изображение не появляется в письме

### Причина

Edge-функция `generate-email-letter` в режиме генерации изображения (строки 86-161):
1. Генерирует изображение через OpenRouter
2. Загружает его в storage
3. Возвращает `{ image_url }` в результате задачи
4. **НЕ обновляет массив `image_placeholders` в таблице `email_letters`**

Фронтенд при возврате на страницу читает `image_placeholders` из БД через React Query — но там `image_url` по-прежнему пустой. Изображение есть в storage, есть в результате задачи, но письмо об этом не знает.

Дополнительно: payload не содержит `letter_id`, поэтому функция даже не может найти нужную запись.

### Решение

#### 1. Передавать `letter_id` в payload генерации изображения

В `src/pages/EmailBuilder.tsx`, функция `generatePlaceholderImage` (строка 411): добавить `letter_id: letterId` в payload.

#### 2. Обновлять `image_placeholders` в БД после генерации

В `supabase/functions/generate-email-letter/index.ts` (строки 150-161): после загрузки изображения в storage, прочитать текущий массив `image_placeholders` из `email_letters`, найти элемент с нужным `placeholder_id`, записать туда `image_url`, и сохранить обновлённый массив обратно в БД.

```text
1. Читаем letter по letter_id из payload
2. Парсим image_placeholders из letter
3. Находим placeholder по id → ставим image_url
4. UPDATE email_letters SET image_placeholders = updated
```

Это гарантирует, что при следующем заходе фронтенд увидит URL изображения в массиве placeholders.

### Файлы
- `src/pages/EmailBuilder.tsx` — 1 строка (добавить `letter_id` в payload)
- `supabase/functions/generate-email-letter/index.ts` — ~10 строк (обновление БД после upload)

