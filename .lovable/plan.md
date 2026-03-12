

## Plan: Update lead magnets structure to match new prompt

### Problem
The `lead_magnets` prompt was updated with new output fields (`format`, `key_insight`, `transition_to_course`), but the database table, edge function, and UI still use old fields (`description`, `marketing_angle`, `call_to_action`, `infographic_concept`, `attention_reason`). Also, the edge function has hardcoded fallback prompts instead of fully relying on the DB prompt.

### 1. Database migration

Remove old columns, add new ones on `lead_magnets` table:

```sql
ALTER TABLE lead_magnets
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS marketing_angle,
  DROP COLUMN IF EXISTS call_to_action,
  DROP COLUMN IF EXISTS infographic_concept,
  DROP COLUMN IF EXISTS attention_reason,
  ADD COLUMN format text DEFAULT '',
  ADD COLUMN key_insight text DEFAULT '',
  ADD COLUMN transition_to_course text DEFAULT '';
```

### 2. Edge function (`generate-lead-magnets`)

- **Remove hardcoded fallback prompts** — if no active prompt found, throw an error instead of using a default template.
- Update the insert mapping to use new fields: `format`, `key_insight`, `transition_to_course` (keep `title` and `promise` which remain).

### 3. UI (`ProjectDetail.tsx`)

Update lead magnet card display (lines 225-231) to show new fields:
- **Формат** → `lm.format`
- **Обещание** → `lm.promise` (unchanged)
- **Ключевой инсайт** → `lm.key_insight`
- **Переход к курсу** → `lm.transition_to_course`

### Files to modify

| File | Change |
|---|---|
| Migration SQL | Drop old columns, add `format`, `key_insight`, `transition_to_course` |
| `generate-lead-magnets/index.ts` | Remove hardcoded fallback, update insert mapping |
| `src/pages/ProjectDetail.tsx` | Update lead magnet card fields |

