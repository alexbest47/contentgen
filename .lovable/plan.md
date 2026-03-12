

## Plan: Fix hardcoded lead magnet context in edge functions

### Problem found
Two edge functions have a **hardcoded `leadMagnetContext` string** that references old deleted columns (`description`, `marketing_angle`, `call_to_action`, `infographic_concept`, `attention_reason`). This will produce empty values at runtime.

### Affected files

**1. `supabase/functions/generate-content/index.ts` (lines 91-98, 108)**

Hardcoded context block with old fields + line 108 references `selectedLead.description` which no longer exists.

**2. `supabase/functions/generate-pipeline/index.ts` (lines 86-93, 117)**

Same hardcoded context block with old fields + line 117 references `selectedLead.description`.

### Fix

Update `leadMagnetContext` in both files to use new fields:

```typescript
const leadMagnetContext = `Выбранный лид-магнит:
- Название: ${selectedLead.title}
- Формат: ${selectedLead.format || ""}
- Обещание: ${selectedLead.promise || ""}
- Ключевой инсайт: ${selectedLead.key_insight || ""}
- Переход к курсу: ${selectedLead.transition_to_course || ""}`;
```

And replace `selectedLead.description` with `selectedLead.promise` in the `{{lead_magnet_description}}` replacement.

### Note on `generate-project-name`

This function has a hardcoded prompt, but it's a simple utility for naming projects (not user-configurable content). No change needed unless you want it configurable too.

### Files to modify

| File | Change |
|---|---|
| `generate-content/index.ts` | Update `leadMagnetContext` (lines 91-98), fix `lead_magnet_description` replacement (line 108) |
| `generate-pipeline/index.ts` | Update `leadMagnetContext` (lines 86-93), fix `lead_magnet_description` replacement (line 117) |

