

## Диагноз

Архитектура self-chaining работает корректно — все 8 изображений были обработаны последовательно. Проблема в другом:

**OpenRouter возвращает 402** на каждый запрос:
```
"This request requires more credits, or fewer max_tokens. You requested up to 32768 tokens, but can only afford 29838"
```

Две причины:
1. **Завышенный `max_tokens`**: OpenRouter по умолчанию выставляет 32768 токенов для модели `gemini-3-pro-image-preview`. Для генерации изображений текстовый ответ минимален — достаточно 1024-2048 токенов.
2. **Недостаток кредитов на OpenRouter**: даже с пониженным `max_tokens`, если кредитов мало, запросы будут падать.

Сравнение с `generate-pipeline-images`: та же проблема — я протестировал вызов и получил тот же `402`. Просто раньше кредитов хватало.

## План (быстрый фикс)

### 1. `supabase/functions/process-diagnostic-image/index.ts`

- Добавить `max_tokens: 2048` в тело запроса к OpenRouter (функция `generateImage`)
- При получении 402 — **остановить цепочку** (не продолжать бессмысленные вызовы), установить статус `error` с понятным сообщением "Недостаточно кредитов OpenRouter"
- При получении 429 — добавить паузу 5 секунд и retry один раз

### 2. `supabase/functions/generate-pipeline-images/index.ts`

- Добавить `max_tokens: 2048` в `generateImage`
- Аналогичная обработка 402/429

### 3. `supabase/functions/generate-image/index.ts`

- Добавить `max_tokens: 2048`
- Обработка 402/429

### 4. `supabase/functions/generate-diagnostic-images/index.ts`

- Добавить `max_tokens: 2048`
- Обработка 402/429

### 5. UI: `src/pages/DiagnosticDetail.tsx`

- При `generation_progress.error` содержащем "кредит" — показывать понятное сообщение пользователю о необходимости пополнить баланс OpenRouter

Все изменения минимальны: одна строка `max_tokens` + обработка 402 в каждой функции.

