

## Задача

При создании нового письма автоматически выбирать цветовую гамму «Классика».

## Изменение

### `src/pages/EmailBuilderList.tsx` (строка ~35)

При вставке нового письма сначала загрузить ID схемы «Классика» и передать его:

```typescript
const createMutation = useMutation({
  mutationFn: async () => {
    // Найти схему "Классика"
    const { data: klassika } = await supabase
      .from("color_schemes")
      .select("id")
      .eq("name", "Классика")
      .eq("is_active", true)
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from("email_letters")
      .insert({
        created_by: user!.id,
        title: "Новое письмо",
        selected_color_scheme_id: klassika?.id ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data;
  },
  ...
});
```

### Файлы
- `src/pages/EmailBuilderList.tsx` — единственное изменение

