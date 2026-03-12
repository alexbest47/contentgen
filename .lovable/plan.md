

## Plan: Add `offer_type` dimension to prompts

### Problem
All 42 current prompts are for the "mini_course" offer type, but there's no `offer_type` column on the `prompts` table. Different offer types will need different prompts. We need to scope prompts by offer type and update the UI to reflect this.

### 1. Database changes

**Add `offer_type` column** to `prompts` table and set all existing prompts to `mini_course`:

```sql
ALTER TABLE prompts ADD COLUMN offer_type text;
UPDATE prompts SET offer_type = 'mini_course' WHERE content_type IS NOT NULL;
```

### 2. Edge function update (`generate-pipeline`)

Add `offer_type` filter when fetching pipeline steps. The offer type is already available from the offer record:

```typescript
.eq("offer_type", offer.offer_type)  // add this filter
```

### 3. UI: Prompts page (`Prompts.tsx`)

Add top-level grouping by offer type. New visual hierarchy:

```text
Мини-курс
  └── Пайплайн: Instagram
        ├── Анонс (4 шага)
        ├── Прогрев (4 шага)
        └── Конверсия (4 шага)
  └── Пайплайн: Telegram
        ...
Прочие промпты (no offer_type)
```

Use tabs or sections with offer type headers from `OFFER_TYPES` in `src/lib/offerTypes.ts`.

### 4. Prompt form dialog

Add `offer_type` field (select from `OFFER_TYPES` list) to the create/edit form.

### 5. Constants update (`promptConstants.ts`)

Add `offer_type` to `PromptForm` interface and `emptyForm`.

### Files to modify

| File | Change |
|---|---|
| Migration SQL | Add `offer_type` column, update existing rows |
| `generate-pipeline/index.ts` | Add `.eq("offer_type", ...)` filter |
| `src/pages/Prompts.tsx` | Group by offer_type at top level |
| `src/components/prompts/PromptFormDialog.tsx` | Add offer_type select |
| `src/lib/promptConstants.ts` | Add offer_type to PromptForm |

