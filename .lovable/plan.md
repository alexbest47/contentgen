

## Исправление: Google Docs не отображается для диагностик

### Проблема
Для диагностик ссылка на Google Doc хранится в таблице `diagnostics.doc_url`, а не в `offers.doc_url` (которое `null`). Страница «Таблица описаний» запрашивает только `offers.doc_url`, поэтому для диагностик показывает «—».

### Решение

**`src/pages/Descriptions.tsx`** — дополнить запрос джойном с `diagnostics`:
- Изменить select: добавить `diagnostics(doc_url)` через связь `offer_id`
- В рендере использовать `diagnostics.doc_url` как фоллбэк, если `offers.doc_url` пуст

Примерная логика:
```typescript
const docUrl = o.doc_url || (o.diagnostics as any)?.[0]?.doc_url;
```

Также стоит отметить: в БД есть два дубликата диагностики «Какой я родитель прямо сейчас?» — один без doc_url вообще (ни в offers, ни в diagnostics). Возможно, стоит удалить лишний через архив.

