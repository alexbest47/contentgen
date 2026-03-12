

## Plan: Rename prompts to reflect new unified format

Current names like "Текст поста Instagram: Анонс" are outdated — they imply text-only. The new names should reflect that each prompt now generates both text AND all Imagen prompts in one call.

### New names

| Current name | New name |
|---|---|
| Текст поста Instagram: Анонс | Текст поста + все Imagen-промпты: Instagram Анонс |
| Текст поста Instagram: Прогрев | Текст поста + все Imagen-промпты: Instagram Прогрев |
| Текст поста Instagram: Конверсия | Текст поста + все Imagen-промпты: Instagram Конверсия |
| Текст поста Telegram: Анонс | Текст поста + все Imagen-промпты: Telegram Анонс |
| Текст поста Telegram: Прогрев | Текст поста + все Imagen-промпты: Telegram Прогрев |
| Текст поста Telegram: Конверсия | Текст поста + все Imagen-промпты: Telegram Конверсия |
| Текст поста VK: Анонс | Текст поста + все Imagen-промпты: VK Анонс |
| Текст поста VK: Прогрев | Текст поста + все Imagen-промпты: VK Прогрев |
| Текст поста VK: Конверсия | Текст поста + все Imagen-промпты: VK Конверсия |
| Текст письма: Анонс | Текст письма + Imagen-промпт баннера: Email Анонс |
| Текст письма: Прогрев | Текст письма + Imagen-промпт баннера: Email Прогрев |
| Текст письма: Конверсия | Текст письма + Imagen-промпт баннера: Email Конверсия |

### Implementation

Single SQL migration with UPDATE statements for all 12 prompts. No code changes needed.

