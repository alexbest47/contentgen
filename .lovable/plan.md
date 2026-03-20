

## Добавить поля вебинара и переменную `{{webinar_data}}`

### 1. Миграция БД
Добавить 4 колонки в таблицу `offers`:
- `webinar_date` (timestamptz, nullable) — дата и время проведения
- `is_date_confirmed` (boolean, default false) — дата подтверждена
- `is_autowebinar` (boolean, default false) — автовебинар
- `landing_url` (text, nullable) — ссылка на лендинг

### 2. `src/pages/OfferTypeManagement.tsx`
- Добавить флаг `isWebinar = offerType === "webinar"`
- Добавить state для новых полей (create/edit): `webinarDate`, `isDateConfirmed`, `isAutowebinar`, `landingUrl`
- В `renderDefaultFields` добавить условные поля для вебинара: дата (DatePicker), чекбокс «Дата подтверждена», чекбокс «Автовебинар», input «Ссылка на лендинг»
- В create/update mutation передавать новые поля при `isWebinar`
- В `openEdit` загружать значения из оффера
- В `resetCreateForm` сбрасывать новые поля
- Добавить поле «Ссылка на лендинг» для всех контентных типов (не только вебинар)

### 3. `src/pages/PromptVariables.tsx`
- Добавить компонент `WebinarDataCard` (по аналогии с `PromoCodesCard`):
  - Запрос офферов с `offer_type = "webinar"`, `is_archived = false`
  - JSON: `{ program, title, webinar_date, is_date_confirmed, is_autowebinar, landing_url }`
  - Показывать переменную `{{webinar_data}}`
- Добавить в categories массив блок «Вебинары» с переменной `{{webinar_data}}`
- Вставить `<WebinarDataCard />` в рендер страницы

### Итого
- 1 миграция (4 колонки)
- 2 файла изменены (`OfferTypeManagement.tsx`, `PromptVariables.tsx`)

