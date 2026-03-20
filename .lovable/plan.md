

## Кастомная форма для «Освободилось место» + переменная промптов

### Суть
Тип оффера `spot_available` — упрощённая форма: только программа и название. Без тегов, без Google Doc. Название записывается в переменную `{{spot_available_data}}`, отображаемую в отдельном блоке на странице переменных промптов.

### Изменения

**1. `src/pages/OfferTypeManagement.tsx`**
- Добавить `const isSpotAvailable = offerType === "spot_available"`
- Создать `renderSpotAvailableFields(mode)` — только поле «Название» (обязательное)
- В create/edit диалоге: при `isSpotAvailable` рендерить `renderSpotAvailableFields` вместо `renderDefaultFields`
- В таблице для `spot_available`: только колонки «Программа», «Название», «Действия» (как сейчас для non-discount, но без кнопки «Открыть» — аналогично discount)
- В мутациях: для `spot_available` не записывать `doc_url`, не привязывать теги

**2. `src/pages/PromptVariables.tsx`**
- Добавить компонент `SpotAvailableCard` — загружает не-архивные офферы типа `spot_available` с join на `paid_programs`
- Отображает read-only JSON массив `[{ program, title }]`
- Переменная `{{spot_available_data}}`
- Разместить после `PromoCodesCard`
- Добавить в `categories` справочную запись

### Итого
- 0 миграций
- 2 файла изменены

