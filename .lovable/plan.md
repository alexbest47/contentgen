

## Удаление дублирующихся промптов

### Проблема
В БД есть дубли:
- **Instagram**: `text-instagram-diagnostics` и `text-instagram-announcement` — оба активны, оба с `content_type=instagram`
- **Лид-магниты**: `lead-magnets-default` и `lead-magnets-dignostics-copy` — оба активны, оба с `category=lead_magnets`

Edge-функции (`generate-lead-magnets`, `generate-pipeline`) берут первый попавшийся промпт без гарантии какой именно выберется.

### Решение
Удалить «диагностические» дубли через SQL-миграцию:
- Удалить `lead-magnets-dignostics-copy` (id: `9be57d6a-58d5-4116-8ef4-0351017eacd3`)
- Удалить `text-instagram-diagnostics` (id: `3f0a243d-3c7f-4a2c-aee9-ecfe65ff9b06`)

Останутся универсальные промпты:
- `lead-magnets-default` для лид-магнитов
- `text-instagram-announcement` для Instagram

Код менять не нужно — функции уже универсальны и берут единственный активный промпт.

