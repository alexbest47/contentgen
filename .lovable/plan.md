

## Создание полного пайплайна генерации диагностики

### Обзор
Превращаем страницу «Создать диагностику» из простой формы создания оффера в полноценный генератор квизов: Claude генерирует JSON → парсим плейсхолдеры изображений → генерируем через OpenRouter (Gemini) → собираем финальный JSON → сохраняем и показываем результат.

**Важное уточнение**: в проекте нет Google Imagen API и соответствующего ключа. Для генерации изображений используется OpenRouter + `google/gemini-3-pro-image-preview` (уже работает в `generate-pipeline-images`). План использует эту же модель.

---

### 1. Новая таблица `diagnostics`

```sql
CREATE TABLE public.diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  offer_id uuid,
  name text NOT NULL,
  description text,
  audience_tags text[] DEFAULT '{}',
  prompt_id uuid,
  quiz_json jsonb,
  status text NOT NULL DEFAULT 'generating',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view diagnostics" ON public.diagnostics
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner or admin can insert diagnostics" ON public.diagnostics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update diagnostics" ON public.diagnostics
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin can delete diagnostics" ON public.diagnostics
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));
```

### 2. Storage bucket `quiz-images`

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('quiz-images', 'quiz-images', true);

CREATE POLICY "Anyone can read quiz-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'quiz-images');
CREATE POLICY "Authenticated can upload quiz-images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quiz-images');
```

### 3. Edge-функция `generate-diagnostic`

Один endpoint, три фазы:

**Вход**: `{ program_id, name, description, audience_tags, prompt_id, image_prompt_id? }`

**Фаза 1** — Генерация JSON квиза:
- Загрузить промпт из `prompts` по `prompt_id`
- Подставить переменные `{{program_title}}`, `{{quiz_name}}`, `{{quiz_description}}`, `{{audience_tags}}`
- Если есть `output_format_hint` — добавить в конец user prompt
- Вызвать Claude API (модель из промпта)
- Распарсить JSON из ответа (извлечь из ` ```json ``` ` если обёрнут)

**Фаза 2** — Генерация изображений:
- Найти все `{{IMAGE:...}}` в JSON-строке
- Если есть `image_prompt_id` — загрузить промпт для изображений и использовать его `user_prompt_template` с `{{IMAGE_DESCRIPTION}}`
- Для каждого плейсхолдера: вызвать OpenRouter (gemini-3-pro-image-preview), загрузить в `quiz-images`, получить URL
- Если генерация не удалась — подставить `null`

**Фаза 3** — Сборка:
- Заменить каждый `{{IMAGE:...}}` на URL
- Сохранить в `diagnostics` со статусом `ready`
- Вернуть `{ diagnostic_id, quiz_json, failed_images: number }`

**Прогресс**: Функция возвращает результат по завершении, но фронтенд делает polling статуса.

Альтернативный подход (лучше для UX): Разделить на два вызова:
1. `generate-diagnostic` — Шаг 1 (Claude) → сохраняет diagnostic со статусом `quiz_generated`
2. `generate-diagnostic-images` — Шаг 2 (изображения) → вызывается с фронта последовательно для каждого плейсхолдера, обновляет JSON, в конце ставит `ready`

Это позволяет показывать прогресс по каждому изображению (как уже сделано в pipeline).

**Выбираю вариант с двумя вызовами** — он соответствует существующему паттерну прогрессивной генерации.

### 4. Регистрация в config.toml

```toml
[functions.generate-diagnostic]
verify_jwt = false

[functions.generate-diagnostic-images]
verify_jwt = false
```

### 5. Переработка `CreateDiagnostic.tsx`

Состояния UI:
- **form** — показана форма с полями + dropdown промптов
- **generating** — пошаговый прогресс
- **result** — финальный JSON + кнопки

**Форма** (добавить):
- Select «Промпт для генерации» — `prompts` где `category = 'test_generation'` и `is_active = true`; по умолчанию первый
- Опционально: Select «Промпт для изображений» — промпт с категорией для Imagen-шаблона (если есть)

**Логика при нажатии «Создать»**:
1. Создать запись в `diagnostics` со статусом `generating`
2. Создать оффер в `offers` (как сейчас)
3. Вызвать `generate-diagnostic` → получить quiz JSON с плейсхолдерами
4. Распарсить плейсхолдеры на фронте
5. Последовательно вызвать `generate-diagnostic-images` для каждого плейсхолдера
6. Обновить `diagnostics` финальным JSON и статусом `ready`

**Прогресс-UI**:
```
⏳ Шаг 1 из 4 — Генерация структуры теста...
⏳ Шаг 2 из 4 — Создание изображений (3 из 5)...
⏳ Шаг 3 из 4 — Сборка финального файла...
✅ Шаг 4 из 4 — Готово!
```

**Результат**:
- «Скопировать JSON» — копирует в буфер
- «Скачать JSON» — скачивает файл
- «Создать ещё» — сброс формы

### 6. Маршрутизация

- `/create-diagnostic` — текущая страница (уже есть, переписываем)
- Страницу просмотра диагностики можно добавить позже

### Порядок реализации

1. Миграция: таблица `diagnostics` + bucket `quiz-images` + RLS
2. Edge-функция `generate-diagnostic` (Claude → JSON)
3. Edge-функция `generate-diagnostic-images` (OpenRouter → изображения → storage)
4. Переработка `CreateDiagnostic.tsx` (форма + прогресс + результат)
5. Регистрация функций в config.toml

