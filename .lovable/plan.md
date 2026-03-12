

## Progressive Carousel Image Generation

### Problem
Currently, carousel generation sends all 7-8 slides in a single edge function call. This causes:
1. Edge function timeout (default ~60s, each image takes ~10-15s)
2. No visual progress — user sees nothing until all images are done

### Solution
**Per-slide generation from the frontend** — the simplest and most reliable approach:

1. **Edge function `generate-pipeline-images`**: When `mode === "carousel"`, accept an optional `slide_number` parameter. If provided, generate only that one slide. Keep existing bulk behavior as fallback.

2. **Frontend `ContentDetail.tsx`**: When user clicks "Сгенерировать карусель":
   - Parse the pipeline JSON to get the list of carousel prompts
   - Loop through slides sequentially, calling the edge function with `slide_number` for each
   - After each successful call, invalidate the `content_pieces` query so the image appears immediately in the UI
   - Show progress: "Генерация 3 из 7..."
   - If one slide fails, continue with the next (don't abort the whole batch)

3. **Enable Realtime on `content_pieces`** (optional enhancement) — so images appear instantly without manual invalidation. But query invalidation after each call is sufficient and simpler.

### Changes

**`supabase/functions/generate-pipeline-images/index.ts`**
- Accept optional `slide_number` in request body
- When `mode === "carousel"` and `slide_number` is set, generate only that one slide instead of looping through all

**`src/pages/ContentDetail.tsx`**
- Replace single `generateImagesMutation` for carousel with a loop that calls per-slide
- Add state for progress tracking: `carouselProgress: { current: number; total: number } | null`
- After each slide completes, call `queryClient.invalidateQueries` so the image renders immediately
- Show "Генерация слайда 3 из 7..." in the button

This avoids any timeout issues since each edge function call handles only one image (~10-15s), well within limits.

