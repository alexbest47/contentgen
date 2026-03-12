

## Aligning JSON Format Expectations with Updated Prompts

### Issues Found

**1. Lead Magnets prompt** now returns `cta_text` per lead magnet, but:
- The `lead_magnets` table has no `cta_text` column
- The `generate-lead-magnets` edge function doesn't extract `cta_text` from the AI response

**2. Instagram Announcement prompt** now returns a different JSON structure:
- Prompt specifies `post_text_single` and `post_text_carousel` (two separate texts)
- But `PipelineResultView.tsx` expects a single `post_text` field
- The `SocialJson` interface needs updating to support both text fields

### Changes

**Database migration**: Add `cta_text` column to `lead_magnets` table.

**`supabase/functions/generate-lead-magnets/index.ts`**: Extract and save `cta_text` from AI response into the new column (line ~149, add `cta_text: lm.cta_text || ""`).

**`src/components/project/PipelineResultView.tsx`**:
- Update `SocialJson` interface: replace `post_text` with optional `post_text_single?`, `post_text_carousel?`, and keep `post_text?` for backward compat
- In `SocialView`, show two editable fields ("Текст для поста" and "Текст для карусели") when `post_text_single`/`post_text_carousel` are present; fall back to single `post_text` for old data
- Update save logic to serialize back the correct field names

**`src/pages/ProjectDetail.tsx`** (optional): Display `cta_text` on lead magnet cards if present.

