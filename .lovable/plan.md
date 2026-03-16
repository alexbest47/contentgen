

## Добавление типа контента к проектам

### Проблема
Таблица `projects` не хранит `content_type`. После генерации невозможно определить, был ли проект создан как лид-магнит или справочный материал.

### План

**1. Миграция БД** — добавить колонку `content_type` в таблицу `projects`:
```sql
ALTER TABLE public.projects 
ADD COLUMN content_type text NOT NULL DEFAULT 'lead_magnet';
```

**2. `src/pages/OfferDetail.tsx`** — при создании проекта сохранять `content_type`:
```typescript
.insert({ offer_id: offerId!, title: nameData.name, created_by: user!.id, content_type: contentType })
```

В списке проектов — показывать бейдж рядом с названием:
```tsx
<Badge variant="outline">{p.content_type === "reference_material" ? "Справочный материал" : "Лид-магнит"}</Badge>
```

**3. `src/pages/OfferTypeDetail.tsx`** — аналогичные изменения (если этот файл тоже используется для создания/отображения проектов).

Итого: 1 миграция + обновление 1-2 страниц.

