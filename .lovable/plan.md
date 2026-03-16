

## Универсальные промпты: удаление offer_type из промптов

### Суть изменений

Промпты становятся универсальными — один набор на 5 пайплайнов (Instagram, Telegram, VK, Email, лид-магниты) для всех типов офферов. `offer_type` больше не является фильтром промптов. Переменная `{{offer_type}}` остаётся доступной в шаблонах для подстановки. Диагностика-специфичные переменные удаляются.

### Файлы и изменения

**1. `src/pages/PromptVariables.tsx`** — обновить справочник:
- Удалить всю категорию «Диагностика»
- Переименовать `{{result_types_json}}` → `{{USER_ANSWERS}}` (если он остаётся) — по контексту, его нет в категории «Оффер», поэтому просто удалить блок «Диагностика» целиком
- Убедиться, что в категории «Оффер» есть `{{offer_type}}`

**2. `src/pages/Prompts.tsx`** — убрать табы по offer_type:
- Убрать группировку по `offer_type` (табы `offerTypesWithPrompts`)
- Показывать все промпты как единый список, сгруппированный по `content_type` (пайплайнам)
- Убрать `CsvImportButton` привязку к `activeTab`
- Убрать `activeTab` state

**3. `src/components/prompts/PromptFormDialog.tsx`** — убрать поле «Тип оффера»:
- Удалить Select для `offer_type`
- Убрать импорт `OFFER_TYPES`

**4. `src/lib/promptConstants.ts`** — убрать `offer_type` из `PromptForm` и `emptyForm`

**5. `src/pages/Prompts.tsx` (saveMutation)** — не отправлять `offer_type` при сохранении

**6. Edge functions — убрать фильтрацию по `offer_type`:**

- **`generate-lead-magnets/index.ts`**: убрать `.eq("offer_type", offer.offer_type)` (строка 115), убрать загрузку diagnostic data (строки 36-45), убрать замены `{{test_name}}`, `{{test_description}}`
- **`generate-pipeline/index.ts`**: убрать `.eq("offer_type", offer.offer_type)` (строка 88)
- **`generate-image/index.ts`**: проверить, есть ли фильтр по offer_type — нужно убрать если есть
- **`generate-content/index.ts`**: нет фильтра по offer_type (фильтрует по category) — оставить как есть

**7. `src/hooks/usePromptInfo.ts`** — убрать фильтрацию по `offer_type`

**8. `src/pages/ProjectDetail.tsx`** — убрать передачу `offer_type` в `usePromptInfo`, обновить отображение промпта (убрать `getOfferTypeLabel`)

**9. `src/pages/ContentDetail.tsx`** — убрать `offer_type` из `usePromptInfo`

**10. `run-diagnostic-pipeline/index.ts`** — переименовать `{{test_name}}` → `{{offer_title}}`, `{{test_description}}` → `{{offer_description}}`, `{{audience_tags}}` → удалить, `{{result_types_json}}` → `{{USER_ANSWERS}}` в templateVars

### Миграция БД

Обнулить `offer_type` у всех существующих промптов не требуется — поле nullable, edge functions просто перестанут по нему фильтровать. Поле останется в таблице, но не будет использоваться.

