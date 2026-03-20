

## Добавить генерацию изображения персонажа через Google Imagen после генерации PDF

### Суть
После получения ответа от Claude, edge function должна: взять `imagen_prompt` из результата, вызвать Google Imagen (через OpenRouter, как в `generate-pipeline-images`), загрузить изображение в Storage, сохранить публичный URL в `background_image_url`, и заменить `CHARACTER_IMAGE_URL` на реальный URL в `landing_html`.

### Изменения

**1. `supabase/functions/generate-pdf-material/index.ts`**

После парсинга JSON-ответа от Claude (строка ~185) и перед обновлением записи:

- Добавить функцию `generateImage(prompt, apiKey)` — скопировать из `generate-pipeline-images` (вызов OpenRouter с `google/gemini-3-pro-image-preview`, модальность `["image", "text"]`, декодирование base64)
- Получить `OPENROUTER_API_KEY` из env (он уже есть в секретах)
- Вызвать `generateImage(result.imagen_prompt, OPENROUTER_API_KEY)`
- Загрузить результат в бакет `generated-images` с путём `pdf-materials/{pdf_material_id}/character_{timestamp}.png`
- Получить публичный URL
- Заменить `CHARACTER_IMAGE_URL` в `result.landing_html` на реальный URL
- Сохранить URL в поле `background_image_url`

Если генерация изображения падает — не блокировать, записать лог, оставить `CHARACTER_IMAGE_URL` как есть (можно перегенерировать позже).

**2. `src/pages/PdfMaterialView.tsx`**

Обновить замену: сейчас заменяет `BACKGROUND_IMAGE_URL` → заменить на `CHARACTER_IMAGE_URL` (чтобы совпадало с промптом). Или сделать обе замены для обратной совместимости.

### Поток данных
```text
Claude → JSON с imagen_prompt + landing_html (содержит CHARACTER_IMAGE_URL)
       ↓
OpenRouter/Imagen → base64 PNG
       ↓
Storage upload → public URL
       ↓
landing_html.replace(CHARACTER_IMAGE_URL, realUrl) → сохранение в БД
```

### Итого
- 1 edge function изменена (`generate-pdf-material`)
- 1 страница изменена (`PdfMaterialView.tsx`)
- 0 миграций

