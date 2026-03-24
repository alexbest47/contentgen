

## Исправление: контент письма пропадает при быстром входе/выходе

### Корневая причина

Проблема в гонке между React Query кешем и логикой сохранения:

1. React Query возвращает **устаревший кеш** (с пустым `generated_html` — из момента до генерации), гидратируя state пустым значением
2. Загрузка блоков (`dbBlocks`) ставит `dirtyRef.current = true`, потому что `hydratingRef` к этому моменту уже `false`  
3. Пользователь быстро уходит → unmount-save сохраняет пустой `generatedHtml` в базу → контент потерян
4. При следующем визите React Query кеш обновился рефетчем → показывает контент → но новый save может снова затереть его

Это объясняет чередование: кеш то стал (пустой), то свежий (с контентом).

### План исправления

#### 1. Защита в `save()` от перезаписи контента пустым значением

В функции `save()` (строки 198-235): если в базе `status = "ready"` а локальный `generatedHtmlRef.current` пустой — не отправлять пустой `generated_html` в update. Это главная страховка.

```typescript
// В save():
const updatePayload: any = {
  title, subject, preheader, ...
};
// Только записывать generated_html если он не пустой, 
// ИЛИ если status ещё не ready (пользователь ещё не генерировал)
if (generatedHtmlRef.current || letter?.status !== "ready") {
  updatePayload.generated_html = generatedHtmlRef.current;
  updatePayload.image_placeholders = imagePlaceholdersRef.current;
}
```

#### 2. Включить блоки в зону гидратации

Обернуть загрузку блоков в `hydratingRef = true`, чтобы она не ставила `dirtyRef`:

```typescript
useEffect(() => {
  if (dbBlocks && !blocksLoadedRef.current) {
    hydratingRef.current = true;
    setBlocks(dbBlocks.map(...));
    blocksLoadedRef.current = true;
    requestAnimationFrame(() => { hydratingRef.current = false; });
  }
}, [dbBlocks]);
```

#### 3. Разрешить ре-гидратацию при рефетче (даже если dirty)

Изменить else-if (строка 163) — убрать проверку `!dirtyRef.current` и проверять только что `generatedHtmlRef.current` пуст, а в базе есть контент:

```typescript
} else if (dbHtml && !generatedHtmlRef.current) {
  // DB has content but local is empty — always accept DB version
  hydratingRef.current = true;
  dirtyRef.current = false; // reset dirty since we're accepting DB state
  setGeneratedHtml(dbHtml);
  setImagePlaceholders(dbPlaceholders);
  setSubject(letter.subject);
  setPreheader(letter.preheader);
  requestAnimationFrame(() => { hydratingRef.current = false; });
}
```

### Файлы
- `src/pages/EmailBuilder.tsx` — 3 точечных изменения

### Результат
- Пустой state больше не перезаписывает сгенерированный контент в базе
- Загрузка блоков не триггерит ложный dirty
- Рефетч с контентом всегда применяется к пустому локальному state

