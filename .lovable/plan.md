

## Версионность промптов

Создать таблицу `prompt_versions` для хранения истории версий. При каждом сохранении промпта (редактирование, доработка AI, импорт) — текущее состояние копируется в `prompt_versions`, затем обновляется основная запись в `prompts`. Активная версия — всегда та, что в таблице `prompts`. Из UI можно просмотреть историю и откатиться к любой версии.

### Что увидит пользователь

- На карточке промпта появится кнопка «История» (иконка часов).
- Клик открывает диалог со списком версий (дата, номер версии, краткая метка — «ручное редактирование» / «доработка AI» / «импорт TXT»).
- Каждую версию можно раскрыть и увидеть system_prompt + user_prompt_template.
- Кнопка «Откатиться к этой версии» — копирует содержимое версии обратно в `prompts` (и создаёт новую запись в истории с меткой «откат к версии N»).

### Технические детали

**1. Миграция: таблица `prompt_versions`**
```sql
CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  output_format_hint TEXT,
  model TEXT,
  provider TEXT,
  change_type TEXT NOT NULL DEFAULT 'manual', -- manual | ai_refine | import | rollback
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage prompt versions"
  ON public.prompt_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_prompt_versions_prompt_id ON public.prompt_versions(prompt_id, version_number DESC);
```

**2. `src/components/prompts/PromptVersionsDialog.tsx`** (новый)
- Props: `promptId`, `promptName`, `open`, `onOpenChange`.
- Загружает `prompt_versions` по `prompt_id`, сортировка по `version_number DESC`.
- Список версий с датой, номером, типом изменения.
- Accordion/Collapsible для просмотра содержимого каждой версии.
- Кнопка «Откатиться» — записывает текущее состояние промпта как новую версию, затем обновляет `prompts` данными выбранной версии.

**3. `src/components/prompts/PromptStepCard.tsx`**
- Добавить кнопку «История» (иконка `History`) рядом с существующими кнопками.
- Состояние `versionsOpen` для открытия диалога.

**4. `src/pages/Prompts.tsx`**
- При сохранении (saveMutation) — перед обновлением `prompts` записывать текущую версию в `prompt_versions` с `change_type: "manual"`.

**5. `src/components/prompts/RefinePromptDialog.tsx`**
- После успешной доработки — записывать предыдущее состояние в `prompt_versions` с `change_type: "ai_refine"`.

**6. `supabase/functions/import-prompts-txt/index.ts`**
- Перед обновлением каждого промпта — вставлять текущую версию в `prompt_versions` с `change_type: "import"`.

### Файлы
- Миграция — новая таблица `prompt_versions`
- `src/components/prompts/PromptVersionsDialog.tsx` — новый
- `src/components/prompts/PromptStepCard.tsx` — кнопка «История»
- `src/pages/Prompts.tsx` — сохранение версии при редактировании
- `src/components/prompts/RefinePromptDialog.tsx` — сохранение версии при AI-доработке
- `supabase/functions/import-prompts-txt/index.ts` — сохранение версии при импорте

