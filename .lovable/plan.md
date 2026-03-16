

## Обновление переменной провокационного контента

Заменить текущую запись `{{provocative_post_topic}}` в карточке «Провокационный контент» на новую переменную `{{provocation_topic}}` с обновлённым описанием полей JSON-объекта.

### Файл: `src/pages/PromptVariables.tsx`

Строки 40–45: заменить содержимое карточки «Провокационный контент»:

```typescript
{
  title: "Провокационный контент",
  variables: [
    { name: "{{provocation_topic}}", description: "Полный JSON-объект выбранной темы провокационного поста (format, topic_title, topic_angle, hook, discussion_trigger, transition_to_offer)", source: "Сгенерированные данные (lead_magnets)" },
  ],
},
```

### Файл: `supabase/functions/generate-pipeline/index.ts`

Обновить подстановку переменной: заменить `{{provocative_post_topic}}` → `{{provocation_topic}}` в логике замены переменных.

### Итого: 2 файла

