

## «Старт нового потока» — кастомная форма + переменная промптов

### Суть
Тип оффера `new_stream` — упрощённая форма: программа, название и дата старта потока. Без тегов и Google Doc. Дата старта отображается в разделе «Переменные промптов» как `{{new_stream_data}}`.

### Изменения

**1. Миграция БД** — добавить колонку в `offers`:
- `stream_start_date date` — дата старта потока

**2. `src/pages/OfferTypeManagement.tsx`**
- Добавить `isNewStream = offerType === "new_stream"`
- Добавить state: `createStreamStartDate`, `editStreamStartDate`
- Создать `renderNewStreamFields(mode)` — поля «Название» и «Дата старта потока» (календарь-попап, аналогично промо-кодам)
- В create/edit диалоге при `isNewStream` рендерить кастомные поля
- В мутациях: записывать `stream_start_date`, не записывать `doc_url`, не привязывать теги
- В таблице для `new_stream`: колонки «Программа», «Название», «Дата старта», «Действия»

**3. `src/pages/PromptVariables.tsx`**
- Добавить компонент `NewStreamCard` — загружает не-архивные офферы типа `new_stream` с join на `paid_programs`
- JSON-массив `[{ program, title, stream_start_date }]`
- Переменная `{{new_stream_data}}`
- Разместить после `SpotAvailableCard`
- Добавить в `categories` справочную запись

### Итого
- 1 миграция (1 колонка)
- 2 файла изменены

