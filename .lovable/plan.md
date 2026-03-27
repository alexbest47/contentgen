

## Убрать привязку к программе для офферов «Освободилось место»

### Суть
Офферы типа `spot_available` не привязаны к конкретной программе — они универсальны и могут использоваться для любой программы. Нужно сделать `program_id` необязательным при создании и убрать колонку «Программа» из таблицы.

### Изменения

**1. `src/pages/OfferTypeManagement.tsx`**

- В форме создания: скрыть селект «Программа» когда `isSpotAvailable`.
- В мутации создания: убрать проверку `if (!createProgramId) throw new Error(...)` для `spot_available`; передавать `program_id: isSpotAvailable ? null : createProgramId`.
- В таблице: скрыть колонку «Программа» когда `isSpotAvailable` (и в `<TableHead>`, и в `<TableCell>`).

**2. Миграция БД**

- Сделать колонку `program_id` в таблице `offers` nullable (если ещё не nullable):
  ```sql
  ALTER TABLE public.offers ALTER COLUMN program_id DROP NOT NULL;
  ```

### Что НЕ трогаем
- Остальные типы офферов — для них программа по-прежнему обязательна.
- `OfferTypeDetail.tsx` — офферы `spot_available` не отображаются в контексте программ (они не content/sales offer в программе).

