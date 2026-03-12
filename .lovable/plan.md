

## План: Раздел «Таблица описаний»

### Что делаем

Новая страница `/descriptions` — сводная таблица, которая объединяет данные из `paid_programs`, `offers` и показывает всё в одном плоском виде.

### 1. Новая страница `src/pages/Descriptions.tsx`

Запрос: `offers` с join на `paid_programs` (через `program_id`) и вложенными `offer_tags → tags`.

Столбцы таблицы:
| Платная программа | Описание аудитории (ссылка) | Тип оффера | Оффер | Google Docs оффера (ссылка) |
|---|---|---|---|---|

- Платная программа — `paid_programs.title`
- Ссылка на Google Docs аудитории — `paid_programs.audience_doc_url` (кликабельная ссылка, если есть)
- Тип оффера — `offers.offer_type` через `getOfferTypeLabel()`
- Оффер — `offers.title`
- Google Docs оффера — `offers.doc_url` (кликабельная ссылка, если есть)

Используем существующие компоненты `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`. Строки группируются/сортируются по программе.

### 2. Сайдбар (`AppSidebar.tsx`)

Добавить пункт «Таблица описаний» в `mainNav` с иконкой `TableProperties` из lucide-react, URL `/descriptions`.

### 3. Роутинг (`App.tsx`)

Добавить `<Route path="/descriptions" element={<Descriptions />} />` внутри protected layout.

### Без изменений в БД — всё читается из существующих таблиц.

