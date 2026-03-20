

## Передать URL логотипа в edge function генерации PDF

### Суть
Извлечь URL логотипа из `email_settings` (ключ `email_header_html`) в edge function и передать его в промпт как переменную `{{logo_url}}`. Пользователь сам обновит промпт для использования этой переменной.

### Найденный URL логотипа
```
https://egunc.stripocdnplugin.email/content/8f62bb6ed3ac4c148aed02fee0339880/lib/pluginId_8f62bb6ed3ac4c148aed02fee0339880_email_mailingId/logo_talentsy.png
```

### Изменения

**`supabase/functions/generate-pdf-material/index.ts`**
- После загрузки `prompt_global_variables` — загрузить `email_settings` с ключом `email_header_html`
- Извлечь URL логотипа из HTML через regex: `src="([^"]+)"` (первый `<img>` в хедере)
- Добавить подстановку `{{logo_url}}` в `userPrompt` (строка ~112-120)

Итого: добавить ~8 строк в edge function, regex-парсинг URL из хедера.

После этого пользователь добавит `{{logo_url}}` в промпт самостоятельно.

### Итого
- 1 файл изменён (`generate-pdf-material/index.ts`)
- 0 миграций

