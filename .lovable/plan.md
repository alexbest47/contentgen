

## Реализация шаблона «Прямой оффер»

Большая фича, затрагивающая данные, wizard, правую панель конструктора, левую панель и edge-функцию.

---

### 1. Данные (INSERT через инструмент)

**Шаблон `email_templates`**: вставить запись «Прямой оффер» с `description` и пустым массивом `blocks: []` (блоки создаются генерацией, не шаблоном), `sort_order: 2`.

**Промпт `prompts`**: вставить запись «Прямой оффер / Генерация письма» с `slug: email-builder-direct-offer`, `content_type: email_builder`, `category: email_builder`, пустыми `system_prompt` / `user_prompt_template`.

**Глобальная переменная `prompt_global_variables`**: вставить `key: objection_data_massive`, `label: Массив возражений`, `value: []`.

---

### 2. Wizard — шаблон-зависимые шаги (`CreateLetterWizard.tsx`)

Сейчас wizard всегда идёт: Шаблон → Тема → Аудитория → Настройки (4 шага).

Для «Прямого оффера» нужно: Шаблон → Аудитория → Настройки (3 шага, без темы).

**Изменения:**
- После выбора шаблона на шаге 1 определяем `selectedTemplateName` из `templates`.
- Вводим булеву переменную `isDirectOffer = selectedTemplateName === "Прямой оффер"`.
- Если `isDirectOffer`:
  - Шаг 2 → Аудитория (вместо Темы)
  - Шаг 3 → Настройки (объединённый: название + программа + оффер + цвет)
  - Нет шага 4; кнопка «Создать» на шаге 3
  - Заголовки: «Шаг 1 из 3», «Шаг 2 из 3», «Шаг 3 из 3»
- Если не `isDirectOffer` — текущая логика 4 шагов без изменений.
- При создании письма `letter_theme_title` и `letter_theme_description` оставляем пустыми для «Прямого оффера».

---

### 3. Правая панель до генерации (`LetterGenerationPanel.tsx`)

Сейчас правая панель показывает только блок выбора кейса.

Для «Прямого оффера» нужно показывать **два блока**: кейс + возражения.

**Изменения:**
- Добавить prop `templateName: string` (уже передаётся).
- Определяем `isDirectOffer = templateName === "Прямой оффер"`.
- Добавить props: `selectedObjections: string[]`, `onChangeObjections: (ids: string[]) => void`, `programId: string | null`.
- В pre-generation режиме:
  - Блок А: «Кейс студента» — текущий код (без изменений).
  - Блок Б (только для `isDirectOffer`): «Возражения для отработки».
    - Загружаем `objections` из таблицы `objections` по `program_id`.
    - Мультиселект с чекбоксами (до 7), с drag-and-drop для порядка.
    - Подпись: «Выберите возражения для отработки (до 7)».
- Кнопка «Сгенерировать» неактивна, пока не выбраны кейс + хотя бы 1 возражение (для `isDirectOffer`).
- Подпись под кнопкой: «Письмо будет создано целиком — от приветствия до CTA».

---

### 4. Состояние в `EmailBuilder.tsx`

- Добавить `selectedObjectionIds: string[]` в state.
- Передавать в `LetterGenerationPanel`.
- В header `canGenerate`: для «Прямого оффера» — `!!caseId && selectedObjectionIds.length > 0`; для остальных — `!!caseId`.
- При генерации — сохранять `selectedObjectionIds` в поле `email_letters` (потребуется новое JSON-поле или использование существующего).

---

### 5. Новое поле в `email_letters`

Добавить миграцию: `ALTER TABLE email_letters ADD COLUMN selected_objection_ids uuid[] NOT NULL DEFAULT '{}'::uuid[]`.

---

### 6. Edge-функция `generate-email-letter/index.ts`

- Загружать `selected_objection_ids` из `letter`.
- Если есть — грузить возражения из `objections` по этим id.
- Формировать `{{objection_data_massive}}` как JSON-массив `[{id, objection}]` в том порядке, в котором они записаны.
- Подставлять в `userPrompt`.
- Выбирать промпт по `slug`:
  - Если `templateName === "Прямой оффер"` → `email-builder-direct-offer`.
  - Иначе → `email-builder-full-letter` (текущая логика).

---

### 7. Левая панель (`BlockLibrary.tsx`)

- Добавить `objection_handling` в массив `generatedBlocks`:
  ```
  { type: "objection_handling", label: "Возражение", icon: MessageSquareQuote }
  ```
- Условие показа: для «Прямого оффера» показывать `testimonial_content` + `objection_handling`; для остальных — только `testimonial_content`.
- Для этого передать `templateName` в `BlockLibrary` (или более простой флаг `showObjectionBlock`).

---

### 8. Что НЕ меняется

- Шаблон «История трансформации» — без изменений.
- Страница `/email-templates` — автоматически покажет новый шаблон.
- Страница `/prompts` — автоматически покажет новый промпт во вкладке «Конструктор email».

---

### Порядок реализации

1. Миграция: новое поле `selected_objection_ids` в `email_letters`
2. INSERT: шаблон, промпт, глобальная переменная
3. `CreateLetterWizard.tsx` — шаблон-зависимые шаги
4. `LetterGenerationPanel.tsx` — блок возражений
5. `EmailBuilder.tsx` — новый state + props
6. `BlockLibrary.tsx` — `objection_handling` в генерируемых
7. `generate-email-letter/index.ts` — выбор промпта + подстановка `{{objection_data_massive}}`

