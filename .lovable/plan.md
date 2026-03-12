

## Plan: Update prompts management UI for new 2-step pipeline model

The prompts management page still reflects the old 4-step pipeline structure. With the new model (1 prompt per content_type+sub_type), several UI elements need updating.

### Changes

**1. `src/components/prompts/PromptFormDialog.tsx`** (line 105)
- Remove `{{lead_magnet_title}}`, `{{lead_magnet_description}}`, `{{previous_steps}}` from the variables hint text — these no longer exist.

**2. `src/components/prompts/PipelineGroup.tsx`** (line 18)
- Change wording from "шаг/шага/шагов" to "промпт/промпта/промптов" since pipelines are no longer multi-step chains.
- Remove arrow connectors between prompts (lines 29-35) — they imply sequential execution which no longer applies.

**3. `src/lib/promptConstants.ts`**
- The `categoryLabels` still list old granular categories (`text_instagram`, `slide_structure`, `image_carousel`, etc.). These are DB enum values so they stay, but they're less relevant now. No code change needed here since the enum is DB-driven.

### Summary
Three small edits: fix variables hint, update badge wording, remove step arrows.

