

## Plan: Switch to OpenRouter with `google/gemini-3-pro-image-preview`

**File:** `supabase/functions/generate-image/index.ts`

Remove the Lovable AI Gateway logic and always use OpenRouter directly with the `google/gemini-3-pro-image-preview` model.

### Changes (lines 110-126):
- Remove `LOVABLE_API_KEY` check and gateway URL logic
- Hardcode OpenRouter URL: `https://openrouter.ai/api/v1/chat/completions`
- Use `OPENROUTER_API_KEY` directly
- Set model to `google/gemini-3-pro-image-preview`

