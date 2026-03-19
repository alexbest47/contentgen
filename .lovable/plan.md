

## Задача

Обновить конструктор писем: wizard 4 шага с выбором аудитории, новые блоки «Курсы на которые идёт набор» и «Подборка бесплатных курсов», убрать устаревшие генерируемые блоки, упростить правую панель.

## Изменения

### 1. Миграция БД

Добавить поле `audience_segment` в `email_letters` для хранения выбранного сегмента аудитории.

```sql
ALTER TABLE public.email_letters ADD COLUMN audience_segment text NOT NULL DEFAULT '';
```

### 2. Переменные промптов — 4 новые переменные

Создать 4 записи в `prompt_global_variables` с ключами `audience_from_scratch_personal`, `audience_from_scratch_career`, `audience_from_scratch_both`, `audience_with_diploma` — с дефолтными значениями из задания.

Миграция: `INSERT INTO prompt_global_variables (key, label, value) VALUES (...)` для каждой.

Обновить `src/pages/PromptVariables.tsx`:
- Добавить категорию «Аудитория» в справочник переменных
- Добавить 4 переменные в `GLOBAL_VARS` для редактирования

### 3. Wizard — 4 шага (`CreateLetterWizard.tsx`)

- Изменить `step` с `1 | 2 | 3` на `1 | 2 | 3 | 4`
- **Шаг 1** — без изменений (темы)
- **Шаг 2** — новый: выбор аудитории (4 карточки radio). Загружает значения из `prompt_global_variables` по ключам `audience_from_scratch_*` и `audience_with_diploma`. Сохраняет выбранный ключ в `audienceSegment`
- **Шаг 3** — выбор шаблона (бывший шаг 2)
- **Шаг 4** — настройки (бывший шаг 3)
- При создании записи: передавать `audience_segment` в insert
- Обновить заголовки: «Шаг X из 4»
- Подгрузка templates при `step >= 3`, color_schemes/programs при `step >= 4`

### 4. Передача аудитории в промпт (`generate-email-letter/index.ts`)

- Загрузить `audience_segment` из letter
- По ключу `audience_segment` найти значение в `prompt_global_variables`
- Заменить `{{audience_description}}` этим значением (вместо `program.audience_description`)

### 5. Блоки — обновить `BlockLibrary.tsx`

**Генерируемые блоки** — оставить только:
- `testimonial_content` (Кейс / отзыв)

Убрать `offer_collection` из генерируемых.

**Пользовательские блоки** — заменить на:
- `paid_programs_collection` — «Курсы на которые идёт набор» (новый тип)
- `free_courses_grid` — «Подборка бесплатных курсов» (новый тип)
- `text` — Текстовый блок
- `image` — Изображение
- `cta` — Кнопка CTA
- `divider` — Разделитель

Обновить `EmailBlockType`, `blockTypeLabels`, `isGeneratedBlock`.

### 6. Новый компонент: `PaidProgramsCollectionSettings.tsx`

Правая панель для блока «Курсы на которые идёт набор»:
- Выбор 2–5 платных программ через dropdown
- Кнопка «+ Добавить программу» (макс 5)
- Кнопка «Обновить блок» — генерирует HTML в `generated_html` блока клиентски
- HTML собирается по шаблону из задания: теги (из `program_tags`), 🎓 + название, описание, ссылка «Получить консультацию»
- Загрузка тегов программ через join `program_tags → tags`

### 7. Новый компонент: `FreeCoursesGridSettings.tsx`

Правая панель для блока «Подборка бесплатных курсов»:
- Шаг 1: выбор сетки (2×1, 2×2, 2×3) через radio с иконками
- Шаг 2: для каждой ячейки — dropdown с офферами типа `mini_course`
- Кнопка «Обновить блок» — генерирует HTML клиентски
- HTML по шаблону: квадратное изображение, название, описание, ссылка «Пройти бесплатно»

### 8. `BlockSettingsPanel.tsx` — маршрутизация

Добавить условия:
- `block_type === "paid_programs_collection"` → `PaidProgramsCollectionSettings`
- `block_type === "free_courses_grid"` → `FreeCoursesGridSettings`

### 9. Правая панель до генерации (`LetterGenerationPanel.tsx`)

Убрать секцию «Дополнительные офферы» (extra offers).
Оставить только:
- Секция «Кейс студента» с dropdown
- Кнопка «Сгенерировать письмо» (всегда активна)
- Подпись «Письмо будет создано целиком...»

### 10. `EmailBuilder.tsx` — состояние

- Добавить `audienceSegment` state, загружать из `letter.audience_segment`
- Сохранять в autosave
- Убрать `extraOfferIds` из LetterGenerationPanel (можно оставить в state для обратной совместимости)

### 11. Промпты — убрать заглушки

В `Prompts.tsx` — если есть промпты с типом `offer_collection` для «Подборка бесплатных курсов» и «Курс на который идёт набор» — они больше не нужны. Это не требует изменения кода — просто пользователь удалит их вручную или мы добавим фильтр.

### Затрагиваемые файлы

1. SQL миграция (audience_segment + prompt_global_variables)
2. `src/pages/PromptVariables.tsx` — категория «Аудитория» + 4 глобальные переменные
3. `src/components/email-builder/CreateLetterWizard.tsx` — 4 шага
4. `src/components/email-builder/BlockLibrary.tsx` — новые типы блоков
5. `src/components/email-builder/PaidProgramsCollectionSettings.tsx` — новый
6. `src/components/email-builder/FreeCoursesGridSettings.tsx` — новый
7. `src/components/email-builder/BlockSettingsPanel.tsx` — маршрутизация
8. `src/components/email-builder/LetterGenerationPanel.tsx` — упрощение
9. `src/pages/EmailBuilder.tsx` — audience_segment state
10. `supabase/functions/generate-email-letter/index.ts` — audience_segment подстановка
11. `src/components/email-builder/BlockCanvas.tsx` — рендер новых типов блоков

