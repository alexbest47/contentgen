

## Plan: Simplify lead magnet variables

Remove `{{lead_magnet_title}}` and `{{lead_magnet_description}}` from the variables reference page, keeping only `{{lead_magnet}}`. Also remove the corresponding `.replace()` calls from the three edge functions that substitute these variables.

### Changes

**1. `src/pages/PromptVariables.tsx`** — Remove lines 12-13 (the two extra lead magnet variable entries).

**2. Edge functions** — Remove `.replace(/\{\{lead_magnet_title\}\}/g, ...)` and `.replace(/\{\{lead_magnet_description\}\}/g, ...)` from:
- `generate-content/index.ts`
- `generate-pipeline/index.ts`
- `generate-image/index.ts`

These two variables will no longer be supported — only `{{lead_magnet}}` remains.

