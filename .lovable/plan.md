

## Plan: Update lead magnet data structure to match new prompt

### What changed in the prompt

The updated prompt now outputs these fields per lead magnet:
- `title` (kept)
- `visual_format` (was `format`)
- `visual_content` (new, replaces `promise`)
- `instant_value` (new, replaces `key_insight`)
- `transition_to_course` (kept)

### 1. Database migration

```sql
ALTER TABLE public.lead_magnets
  DROP COLUMN IF EXISTS format,
  DROP COLUMN IF EXISTS promise,
  DROP COLUMN IF EXISTS key_insight,
  ADD COLUMN visual_format text DEFAULT '',
  ADD COLUMN visual_content text DEFAULT '',
  ADD COLUMN instant_value text DEFAULT '';
```

Column `transition_to_course` stays as-is.

### 2. Edge function: `generate-lead-magnets/index.ts`

Update insert mapping (lines 143-150):
```typescript
title: lm.title || "Без названия",
visual_format: lm.visual_format || "",
visual_content: lm.visual_content || "",
instant_value: lm.instant_value || "",
transition_to_course: lm.transition_to_course || "",
```

### 3. Edge functions: `generate-content`, `generate-pipeline`, `generate-image`

Update `leadMagnetContext` in all three to use new fields:
```typescript
const leadMagnetContext = `Выбранный лид-магнит:
- Название: ${selectedLead.title}
- Визуальный формат: ${selectedLead.visual_format || ""}
- Визуальный контент: ${selectedLead.visual_content || ""}
- Мгновенная ценность: ${selectedLead.instant_value || ""}
- Переход к курсу: ${selectedLead.transition_to_course || ""}`;
```

Update `{{lead_magnet_description}}` replacement: `selectedLead.promise` → `selectedLead.visual_content`.

### 4. UI: `ProjectDetail.tsx` (lines 225-229)

```
Визуальный формат: lm.visual_format
Визуальный контент: lm.visual_content
Мгновенная ценность: lm.instant_value
Переход к курсу: lm.transition_to_course
```

### 5. Prompt variables page

Update `PromptVariables.tsx` to reflect the new field names in the reference table.

### Files to modify

| File | Change |
|---|---|
| Migration SQL | Drop `format`, `promise`, `key_insight`; add `visual_format`, `visual_content`, `instant_value` |
| `generate-lead-magnets/index.ts` | Update insert mapping |
| `generate-content/index.ts` | Update `leadMagnetContext` + description replacement |
| `generate-pipeline/index.ts` | Update `leadMagnetContext` + description replacement |
| `generate-image/index.ts` | Update `leadMagnetContext` + description replacement |
| `ProjectDetail.tsx` | Update card display fields |
| `PromptVariables.tsx` | Update variable reference |

