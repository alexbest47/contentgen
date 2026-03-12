

## Problem

`generate-pipeline-images` currently calls **Lovable AI Gateway** (`ai.gateway.lovable.dev`) with `LOVABLE_API_KEY`. You want it to use **OpenRouter** (`openrouter.ai/api/v1/chat/completions`) with `OPENROUTER_API_KEY`.

The response format from OpenRouter for `google/gemini-3-pro-image-preview` is the same — images come in `message.images[].image_url.url` — so parsing logic stays unchanged.

## Changes

**File: `supabase/functions/generate-pipeline-images/index.ts`**

1. In `generateImage()` — change fetch URL from `https://ai.gateway.lovable.dev/v1/chat/completions` to `https://openrouter.ai/api/v1/chat/completions`
2. In the main handler — read `OPENROUTER_API_KEY` instead of `LOVABLE_API_KEY`
3. Pass `OPENROUTER_API_KEY` to all `generateImage()` calls

No other changes needed — the response parsing already handles the `message.images` format correctly.

