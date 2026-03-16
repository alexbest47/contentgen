

## Вкладки на странице промптов: Лидмагнит и Диагностики

### Текущее состояние
7 промптов в БД. 4 имеют `content_type` (instagram/telegram/vk/email) и отображаются в пайплайнах. 3 промпта без `content_type` попадают в «Прочие»:
- «Генерация теста» (category=test_generation) → должен быть в «Диагностики»
- «Генерация диагностической карты» (category=test_generation) → должен быть в «Диагностики»
- «Генерация лид-магнитов» (category=lead_magnets) → должен быть в «Лидмагнит»

### План

**1. Обновить данные в БД**
Присвоить `content_type` трём промптам без него:
- `lead-magnets-default` → `content_type = 'lead_magnet'`
- `test-generation-default` → `content_type = 'diagnostic'`
- `diagn-card-prompt-generation-default` → `content_type = 'diagnostic'`

**2. Обновить `src/lib/promptConstants.ts`**
- Добавить `lead_magnet` и `diagnostic` в `contentTypeLabels`
- Добавить маппинг в `deriveCategory` для новых типов

**3. Обновить `src/pages/Prompts.tsx`**
- Добавить Tabs UI (из `@/components/ui/tabs`) с двумя вкладками: «Лидмагнит» и «Диагностики»
- Вкладка «Лидмагнит» показывает промпты с `content_type = 'lead_magnet'` и пайплайны (instagram/telegram/vk/email)
- Вкладка «Диагностики» показывает промпты с `content_type = 'diagnostic'`
- Убрать секцию «Прочие промпты»

**4. Обновить `src/components/prompts/PromptFormDialog.tsx`**
- Добавить новые значения `lead_magnet` и `diagnostic` в селект «Канал (пайплайн)», переименовать в «Тип контента»

