

## Убрать дублирование переменных между system_prompt и user_prompt

### Проблема
Одни и те же крупные тексты подставляются дважды — и в `system_prompt`, и в `user_prompt_template`. Это удваивает расход токенов и вызывает ошибку context overflow (210K при лимите 200K).

Дублирующиеся «тяжёлые» переменные по шаблонам:

| Шаблон | Дублируются |
|--------|-------------|
| direct-offer | `audience_description`, `program_doc_description`, `case_data`, `objection_data_massive`, `offer_rules`, `offer_type`, `offer_title`, `brand_style` |
| full-letter | `audience_description`, `program_doc_description`, `case_data`, `objection_data_massive`, `offer_rules`, `brand_style` |
| free-form | `content_theme`, `audience_description`, `audience_segment`, `brand_style`, `image_style` |
| webinar 1/2 | только `audience_segment` (маленький, не критично) |

### Решение
Оставить крупные данные **только в `user_prompt_template`**, убрать их из `system_prompt`.

Логика: `system_prompt` содержит инструкции и правила для модели. `user_prompt_template` передаёт конкретные данные. Это стандартная практика — system для роли и формата, user для контекста.

### Что сделать

**Миграция SQL** — обновить 3 промпта в таблице `prompts`:

1. **`email-builder-direct-offer`** (`system_prompt`): убрать блоки с `{{audience_description}}`, `{{program_doc_description}}`, `{{case_data}}`, `{{objection_data_massive}}`, `{{offer_rules}}`, `{{offer_type}}`, `{{offer_title}}`, `{{brand_style}}`. Оставить только инструкции, где эти переменные упоминаются как «данные будут в сообщении пользователя».

2. **`email-builder-full-letter`** (`system_prompt`): аналогично — убрать дублированные данные, оставив ссылки вида «используй данные из сообщения».

3. **`email-builder-free-form`** (`system_prompt`): убрать `{{content_theme}}`, `{{audience_description}}`, `{{audience_segment}}`, `{{brand_style}}`, `{{image_style}}` из system_prompt. Эти переменные уже есть в user_prompt.

Для webinar 1/2 — не трогать, дублируется только `audience_segment` (несколько слов).

### Важно
Я **не буду** менять сами тексты промптов целиком. Я только уберу конкретные `{{переменные}}` из `system_prompt`, заменив их на указание «данные переданы в сообщении пользователя». Это сохранит все инструкции и правила.

### Дополнительная защита
В edge functions (`generate-email-letter/index.ts`) добавить обрезку длинных текстов:
```ts
const truncate = (text: string, max = 30000) =>
  text.length > max ? text.substring(0, max) + "\n...[обрезано]" : text;
```

Применить к `programDocDescription`, `audienceDescription`, `offerDesc`, `caseContext` перед подстановкой.

### Файлы
- Миграция SQL — обновление `system_prompt` для 3 промптов
- `supabase/functions/generate-email-letter/index.ts` — truncate для крупных переменных
- `supabase/functions/generate-email-block/index.ts` — аналогичный truncate

