

## Добавление нового типа контента «Справочный материал»

### Обзор
Добавить новый тип контента `reference_material` наравне с `lead_magnet` и `diagnostic`. Включает: новую категорию в БД, новую вкладку в управлении промптами, кнопку генерации на странице оффера, и 5 предустановленных пустых промптов.

### Изменения

**1. Миграция БД — новая категория enum + 5 промптов**
- Добавить значение `reference_materials` в enum `prompt_category`
- Вставить 5 пустых промптов с `content_type = 'reference_material'`:
  1. «Генерация справочных материалов» (без channel, category = `reference_materials`)
  2. «Текст поста + Imagen-промпты: Instagram» (channel = `instagram`)
  3. «Текст поста + Imagen-промпты: Telegram» (channel = `telegram`)  
  4. «Текст поста + Imagen-промпты: VK» (channel = `vk`)
  5. «Текст письма + Imagen-промпт баннера: Email» (channel = `email`)

**2. `src/lib/promptConstants.ts`**
- Добавить `reference_materials` в `categoryLabels`
- Добавить `reference_material: "Справочный материал"` в `contentTypeLabels`
- Обновить `deriveCategory()` для обработки `reference_material`

**3. `src/pages/Prompts.tsx`**
- Добавить фильтр `referenceMaterialPrompts` по `content_type === "reference_material"`
- Добавить вкладку «Справочный материал» в TabsList
- Добавить рендер `renderReferenceMaterialTab()` аналогично lead magnet (общий + по каналам)

**4. `src/pages/OfferDetail.tsx`** — изменить расположение кнопок
- Убрать кнопку «Сгенерировать лид-магниты» из шапки
- Разместить две кнопки под списком проектов (или над ним) рядом: «Сгенерировать лид-магниты» и «Сгенерировать справочный материал»
- Кнопка «Справочный материал» вызывает edge-функцию `generate-lead-magnets` с параметром, указывающим на другую категорию промптов

**5. `src/pages/OfferTypeDetail.tsx`** — аналогично обновить кнопку генерации в списке офферов

**6. Edge-функция `generate-lead-magnets/index.ts`**
- Принимать опциональный параметр `content_type` (по умолчанию `"lead_magnet"`)
- Если `content_type === "reference_material"`, искать промпт по `category = 'reference_materials'` вместо `'lead_magnets'`
- Сохранять результат в ту же таблицу `lead_magnets` или в `content_pieces` в зависимости от типа (нужно уточнить — скорее всего в `content_pieces` с category `reference_material`)

**7. `src/pages/ProjectDetail.tsx`**
- Не требует изменений на данном этапе (справочный материал — отдельная генерация на уровне оффера, не проекта)

### Вопрос для уточнения
Справочный материал генерируется для оффера (не создаёт проект), или он тоже создаёт проект с лид-магнитами? Судя по скриншоту, обе кнопки находятся на странице оффера рядом, что предполагает два разных процесса генерации для одного оффера.

