

## Новый раздел «Кейсы» в управлении промптами + промпт классификации

### Что нужно сделать

1. **Миграция: добавить `case_analysis` в enum `prompt_category`**
   - `ALTER TYPE public.prompt_category ADD VALUE 'case_analysis';`

2. **Обновить `src/lib/promptConstants.ts`**
   - Добавить `case_analysis: "Анализ кейсов"` в `categoryLabels`
   - Добавить `case_analysis: "Кейсы"` в `contentTypeLabels`
   - Добавить `case_analysis` в `contentTypeKeys`
   - Добавить маппинг `if (contentType === "case_analysis") return "case_analysis"` в `deriveCategory`

3. **Обновить `src/pages/Prompts.tsx`**
   - Добавить фильтр `caseAnalysisPrompts` по `content_type === "case_analysis"`
   - Добавить `renderCaseAnalysisTab()` (простой список без каналов, как у диагностик)
   - Добавить вкладку «Кейсы» в `TabsList` и `TabsContent`

4. **Обновить `src/components/prompts/PromptFormDialog.tsx`**
   - content_type `case_analysis` не требует выбора канала — добавить его в условие скрытия поля «Канал»

5. **Миграция: вставить промпт**
   - INSERT в таблицу `prompts` с текстом из запроса пользователя:
     - `name`: «Классификация кейсов и отзывов»
     - `slug`: `case-classification`
     - `content_type`: `case_analysis`
     - `category`: `case_analysis`
     - `system_prompt`: полный текст промпта из запроса
     - `step_order`: 1
     - `provider`: `anthropic`, `model`: `claude-sonnet-4-20250514`

### Файлы
- Миграция SQL (enum + insert)
- `src/lib/promptConstants.ts`
- `src/pages/Prompts.tsx`
- `src/components/prompts/PromptFormDialog.tsx`

