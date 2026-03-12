

## Plan: Fix circular import causing blank page

### Problem
`PromptStepCard.tsx` imports `categoryLabels` from `src/pages/Prompts.tsx`, and `Prompts.tsx` imports `PromptStepCard`. This circular dependency causes a runtime crash — the entire app renders blank.

### Fix
Extract shared constants (`categoryLabels`, `contentTypeLabels`, `subTypeLabels`, `categories`, `PromptForm`, `emptyForm`) into a new file `src/lib/promptConstants.ts`. Then update both `Prompts.tsx` and `PromptStepCard.tsx` to import from there.

### Files
| File | Change |
|---|---|
| `src/lib/promptConstants.ts` | **Create** — move all shared exports here |
| `src/pages/Prompts.tsx` | Import from `promptConstants` instead of exporting directly |
| `src/components/prompts/PromptStepCard.tsx` | Import from `promptConstants` instead of `Prompts.tsx` |
| `src/components/prompts/PromptFormDialog.tsx` | Update import if it references `Prompts.tsx` |

