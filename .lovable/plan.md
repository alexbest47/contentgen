

## Problem

The database still contains the old 4-step prompt chains (text, slide structure, cover image, carousel slides) for social pipelines and 2-step chains for email. With the new 2-step architecture, each pipeline needs only **1 Claude prompt** that returns the full JSON (text + all image prompts combined).

The old image-generation prompts (steps 3-4 for social, step 2 for email) are no longer needed — image prompts are now embedded in the Claude JSON output and sent to Imagen in Step 2 via `generate-pipeline-images`.

## Plan

### 1. Clean up database — remove obsolete prompts

For each social pipeline (instagram/telegram/vk × announcement/warmup/conversion):
- Keep step 1 (the Claude text prompt) — but update its `system_prompt` and `user_prompt_template` to return the new unified JSON format
- Delete steps 2, 3, 4 (slide_structure, image_post, image_carousel) — these are now redundant

For each email pipeline:
- Keep step 1 (the Claude text prompt) — update to return `{email_subject, email_body, banner_prompt}`
- Delete step 2 (banner image prompt)

This reduces from 42 content prompts to 12 (one per content_type × sub_type).

### 2. Update remaining prompts

Update the category of the remaining prompts to a single unified value (e.g. keep `text_instagram` / `text_telegram` / `text_vk` / `text_email` since those are valid enum values) — they now represent the single Claude call that returns the full JSON.

### 3. No code changes needed

The Prompts UI already displays whatever is in the database. Once old rows are deleted, each pipeline group will show "1 промпт" instead of "4 промпта".

### Migration SQL

```sql
-- Delete obsolete social pipeline steps (keep only step_order=1)
DELETE FROM prompts 
WHERE content_type IN ('instagram', 'telegram', 'vk') 
  AND step_order > 1;

-- Delete obsolete email pipeline steps (keep only step_order=1)
DELETE FROM prompts 
WHERE content_type = 'email' 
  AND step_order > 1;
```

After this, 30 rows will be deleted (9×3 social + 3×1 email = 30), leaving 12 content prompts + 2 without content_type.

**Note:** You'll also want to update the `system_prompt` and `user_prompt_template` of the remaining 12 prompts to instruct Claude to return the new unified JSON format — but that's content editing best done through the existing prompt editor UI, not via migration.

