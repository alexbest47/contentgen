

## Исправление: дубликат диагностики + отсутствие Google Docs ссылки

### Причины

1. **Дубликат**: в таблице `offers` две записи «Какой я родитель прямо сейчас?» типа diagnostic. Одна (`374efc26`) — сиротская, без привязанной диагностики. Вторая (`72825da6`) — корректная, с привязанной диагностикой.

2. **Google Docs не отображается**: колонка `diagnostics.offer_id` не имеет FK-constraint, поэтому PostgREST не может разрешить embedded join `diagnostics(doc_url)` — возвращает пустой массив.

### Изменения

**1. Миграция БД** — добавить FK на `diagnostics.offer_id`:
```sql
ALTER TABLE public.diagnostics
  ADD CONSTRAINT diagnostics_offer_id_fkey
  FOREIGN KEY (offer_id) REFERENCES public.offers(id)
  ON DELETE SET NULL;
```

**2. Архивировать сиротский оффер** (через insert tool):
```sql
UPDATE offers SET is_archived = true WHERE id = '374efc26-efed-4b64-bc16-93e372f4bf50';
```

**3. `src/pages/Descriptions.tsx`** — никаких изменений в коде не нужно. После добавления FK текущий запрос `diagnostics(doc_url)` заработает корректно.

