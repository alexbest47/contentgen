

## Задача

Разделить карточки типов офферов на две визуальные группы с подзаголовками: «Контентные офферы» и «Продающие офферы».

## Изменения

### 1. `src/lib/offerTypes.ts` — добавить группировку

Добавить два экспортируемых массива:

```ts
export const CONTENT_OFFER_KEYS = ["mini_course", "diagnostic", "webinar", "download_pdf"];
export const SALES_OFFER_KEYS = ["pre_list", "new_stream", "spot_available", "sale", "discount"];
```

### 2. `src/pages/ProgramDetail.tsx` — рендерить две секции

Заменить единый `grid` (строки 189-204) на две секции с заголовками:

```
Контентные офферы
[grid из 4 карточек]

Продающие офферы
[grid из 5 карточек]
```

Фильтровать `OFFER_TYPES` по ключам из `CONTENT_OFFER_KEYS` / `SALES_OFFER_KEYS`.

---

2 файла, ~15 строк.

