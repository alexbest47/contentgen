

## Кликабельные задачи в очереди

### Подход

Добавить поле `target_url` в `task_queue`. При постановке задачи фронтенд передаёт URL страницы, куда ведёт результат. В таблице очереди название задачи становится ссылкой.

### Изменения

#### 1. Миграция — колонка `target_url`

```sql
ALTER TABLE task_queue ADD COLUMN target_url text;
```

#### 2. `enqueue-task/index.ts` — принять и сохранить `target_url`

Добавить `target_url` из body в INSERT.

#### 3. `useTaskQueue.ts` — расширить интерфейс

```typescript
interface EnqueueOptions {
  // ...existing fields
  targetUrl?: string;
}
```

#### 4. Все точки вызова — передать `targetUrl`

| Файл | Функция | targetUrl |
|------|---------|-----------|
| `EmailBuilder.tsx` | generate-email-letter, generate-email-block | `/email-builder/${letterId}` |
| `ProjectDetail.tsx` | generate-lead-magnets, generate-pipeline | текущий URL (проект) |
| `ContentDetail.tsx` | generate-pipeline, generate-pipeline-images | текущий URL (контент) |
| `OfferDetail.tsx` | generate-lead-magnets | текущий URL (оффер) |
| `DiagnosticDetail.tsx` | run-diagnostic-pipeline | `/diagnostics/${diagnosticId}` |
| `Diagnostics.tsx` | run-diagnostic-pipeline | `/diagnostics/${id}` |
| `PdfMaterialView.tsx` | generate-pdf-material | `/pdf-materials/${id}` |
| `CreatePdfWizard.tsx` | generate-pdf-material | `/pdf-materials/${id}` |
| `GeneratedBlockSettings.tsx` | generate-lead-magnets | текущий URL |
| `RefinePromptDialog.tsx` | refine-prompt | `/prompts` |

#### 5. `TaskQueue.tsx` — название-ссылка

Обернуть `display_title` в `<Link>` (react-router), если `target_url` задан. Стилизация: подчёркивание при наведении, курсор pointer.

### Итого
- 1 миграция (1 колонка)
- 1 edge-функция обновлена
- 1 хук обновлён
- ~10 файлов — добавить `targetUrl`
- 1 файл UI — ссылка в таблице

