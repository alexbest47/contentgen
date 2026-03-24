

## Проблема: кейс и возражения не сохраняются при возврате на страницу

### Причина

React Query при повторном заходе сначала отдаёт **стейл кеш** (данные до выбора кейса/возражений), а потом рефетчит свежие данные. 

Цепочка:
1. Пользователь выбирает кейс + возражения → данные сохраняются в БД (через `generateLetter` или `handleChangeCaseId`)
2. Пользователь уходит → компонент размонтируется
3. Пользователь возвращается → React Query возвращает **стейл кеш** (без кейса/возражений)
4. Первая гидратация (строка 141) записывает `caseId = null`, `selectedObjectionIds = []` из стейл кеша
5. `initialLoadRef.current = true` — первая загрузка помечена как завершённая
6. React Query рефетчит свежие данные (с кейсом и возражениями) → но `else if` на строке 163 проверяет только `generatedHtml`, игнорируя `case_id` и `selected_objection_ids`
7. Результат: кейс и возражения потеряны в UI

### Решение

#### 1. Расширить ре-гидратацию — синхронизировать case_id и selected_objection_ids при рефетче

В `else if` блоке (строка 163) добавить синхронизацию `case_id` и `selected_objection_ids` из БД, когда локальные значения пусты, а в БД есть данные. Это покроет как текущий баг, так и будущие похожие ситуации.

```typescript
} else if (!dirtyRef.current) {
  // Re-hydrate all fields from DB when there are no unsaved changes
  hydratingRef.current = true;
  setGeneratedHtml(dbHtml);
  setImagePlaceholders(dbPlaceholders);
  setSubject(letter.subject);
  setPreheader(letter.preheader);
  setCaseId((letter as any).case_id || null);
  setSelectedObjectionIds((letter as any).selected_objection_ids || []);
  requestAnimationFrame(() => { hydratingRef.current = false; });
}
```

#### 2. Добавить немедленное сохранение selectedObjectionIds в БД

По аналогии с `handleChangeCaseId`, который сохраняет `case_id` сразу при выборе, добавить немедленное сохранение `selected_objection_ids` при изменении:

```typescript
const handleChangeObjectionIds = useCallback(async (ids: string[]) => {
  setSelectedObjectionIds(ids);
  if (letterId) {
    await supabase.from("email_letters").update({ selected_objection_ids: ids } as any).eq("id", letterId);
  }
}, [letterId]);
```

### Файл
- `src/pages/EmailBuilder.tsx` — 2 изменения

