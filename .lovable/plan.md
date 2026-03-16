

## Убрать поле «Описание» из формы редактирования оффера

**`src/pages/OfferTypeDetail.tsx`**:
- Удалить поле `description` / `setDescription` из интерфейса `OfferFormProps` и компонента `OfferForm` (строки 22-23, 35, 42-45)
- Убрать `description` из всех мест вызова `OfferForm` (создание и редактирование)
- Оставить поле `description` в мутациях insert/update как пустую строку или null, чтобы не ломать БД

