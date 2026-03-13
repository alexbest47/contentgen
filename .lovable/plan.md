

## Возврат `max_tokens` к исходным значениям

Проблема была не в `max_tokens`, а в недостатке кредитов на OpenRouter. Сейчас кредиты пополнены — нужно убрать ограничение `max_tokens: 2048`, которое мы добавили.

### Изменения

Удалить строку `max_tokens: 2048` из 4 файлов:

1. **`supabase/functions/process-diagnostic-image/index.ts`** (строка 21)
2. **`supabase/functions/generate-pipeline-images/index.ts`** (строка 18)
3. **`supabase/functions/generate-diagnostic-images/index.ts`** (строка 20)
4. **`supabase/functions/generate-image/index.ts`** (строка 116)

Обработка ошибок 402/429 остаётся — она полезна независимо от `max_tokens`.

