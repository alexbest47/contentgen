

## Задача

Заменить inline-селектор кейсов в правой панели на кнопку «Выбрать кейс», которая открывает модальное окно с таблицей классификаций (как в CaseManagement), с фильтрами по продуктам и тегам.

## Изменения

### 1. Новый компонент `src/components/email-builder/CasePickerDialog.tsx`

Модальное окно (`Dialog`, `max-w-5xl`) с:
- **Поиск** — `<Input>` по имени студента, файлу, тегам
- **Фильтр по продуктам** — Badge-кнопки из уникальных `classification_json.products`
- **Фильтр по тегам** — Badge-кнопки из наиболее частых тегов (топ-15)
- **Таблица** — копия таблицы из CaseManagement (Файл, Тип, Студент, Продукты, Тон, Качество, Теги, Дата) + кнопка «Выбрать» в каждой строке
- Данные загружаются из `case_classifications` (все, без привязки к программе)
- Клик «Выбрать» → `onSelect(id)` → закрытие диалога

Props: `open`, `onOpenChange`, `onSelect: (caseId: string) => void`, `selectedCaseId: string | null`

### 2. `src/components/email-builder/LetterGenerationPanel.tsx`

- Удалить весь inline-селектор кейсов (search, badge-фильтры, ScrollArea со списком — строки 182-275)
- Удалить состояния `search`, `activeTypes`, `videoTypes`, `filteredCases` и связанные memo
- Удалить запрос `cases_for_letter`
- Добавить состояние `casePickerOpen`
- В pre-generation режиме показывать:
  - Выбранный кейс (имя + файл) или кнопку «Выбрать кейс»
  - `<CasePickerDialog>` с привязкой к `casePickerOpen`

---

2 файла: 1 новый (~150 строк), 1 упрощённый.

