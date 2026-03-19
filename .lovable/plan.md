

## Удаление промпта «Тема и прехедер письма» и edge-функции `generate-email-subject`

Согласно memory, тема и прехедер теперь генерируются в рамках основного промпта `email-builder-full-letter`. Отдельная функция и промпт больше не нужны.

### Изменения

**1. Удалить файл** `supabase/functions/generate-email-subject/index.ts`

**2. Удалить конфигурацию** из `supabase/config.toml` (секция `[functions.generate-email-subject]`)

**3. Удалить промпт из БД:**
```sql
DELETE FROM prompts WHERE slug = 'email-builder-subject';
```

**4. Удалить кнопку генерации темы из UI:**

- **`src/components/email-builder/EmailBuilderHeader.tsx`** — убрать props `onGenerateSubject`, `generatingSubject` и кнопку со Sparkles рядом с полем «Тема письма»
- **`src/pages/EmailBuilder.tsx`** — убрать функцию `generateSubjectHandler`, state `generatingSubject`, и передачу этих props в `EmailBuilderHeader`

5 точек правки: 1 удаление файла, 1 config, 1 SQL, 2 файла кода.

