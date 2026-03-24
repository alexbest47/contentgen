

## Переключение generate-project-name на Anthropic Claude API

### Проблема
Функция `generate-project-name` — единственная, использующая Lovable AI Gateway. Остальные функции уже работают через Anthropic Claude API. Ошибка 402 вызвана лимитом кредитов Lovable AI, а не OpenRouter/Anthropic.

### Решение
Переписать `supabase/functions/generate-project-name/index.ts`: заменить вызов Lovable AI Gateway на Anthropic Messages API (`https://api.anthropic.com/v1/messages`), используя `ANTHROPIC_API_KEY` (уже настроен в секретах).

### Изменения
**Файл:** `supabase/functions/generate-project-name/index.ts`
- Заменить `LOVABLE_API_KEY` → `ANTHROPIC_API_KEY`
- Заменить URL `ai.gateway.lovable.dev` → `api.anthropic.com/v1/messages`
- Использовать формат Anthropic Messages API (заголовки `x-api-key`, `anthropic-version`, тело с `system` + `messages`, `max_tokens`)
- Модель: `claude-sonnet-4-20250514` (как в остальных функциях)
- Парсинг ответа: `data.content[0].text` вместо `data.choices[0].message.content`

