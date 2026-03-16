

## Скрыть кнопку «Сгенерировать карусель» для экспертного и провокационного контента

### Проблема
На странице `ContentDetail` кнопка «Сгенерировать карусель» показывается для всех не-email каналов, но для `expert_content` и `provocative_content` промпты не возвращают `carousel_prompts` от Claude.

### Решение

**Файл: `src/pages/ContentDetail.tsx`**

1. Добавить запрос проекта для получения его `content_type`:
```typescript
const { data: project } = useQuery({
  queryKey: ["project", projectId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("content_type")
      .eq("id", projectId!)
      .single();
    if (error) throw error;
    return data;
  },
});
```

2. Определить флаг:
```typescript
const supportsCarousel = !["expert_content", "provocative_content"].includes(project?.content_type ?? "");
```

3. В блоке кнопок (не-email ветка, строки 235–260) обернуть кнопку карусели в `{supportsCarousel && (...)}`, оставив кнопку «Сгенерировать изображение» без изменений.

**Итого: 1 файл, минимальные изменения.**

