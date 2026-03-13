

## Исправление: перенести кнопку «Сгенерировать лид-магниты» на правильную страницу

### Проблема
Кнопка была добавлена на страницу `DiagnosticDetail.tsx` (админ-раздел создания теста) и при этом на `OfferDetail.tsx` она скрыта для типа `diagnostic` условием `offerType !== "diagnostic"`.

Нужно наоборот:
- **Убрать** кнопку из `DiagnosticDetail.tsx` (там она не нужна)
- **Показать** кнопку на `OfferDetail.tsx` для диагностик тоже — убрать условие `offerType !== "diagnostic"`

### Изменения

**`src/pages/OfferDetail.tsx`** (строка ~148):
- Убрать условие `offerType !== "diagnostic"` — кнопка должна показываться для всех типов офферов, включая diagnostic

**`src/pages/DiagnosticDetail.tsx`**:
- Убрать кнопку «Сгенерировать лид-магниты», состояния `generatingProject`/`progressText` и `generateLeadMagnetsMutation` — всё что было добавлено в предыдущем шаге

