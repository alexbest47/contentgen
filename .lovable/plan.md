

## Answers & Plan

### Question 1: How carousel generation works
Yes, you're right. The edge function processes carousel slides **sequentially** — it loops through each `carousel_prompts` item one by one, sends to OpenRouter, waits for the response, uploads to storage, then moves to the next. This is the simplest approach but slow for 7 slides.

### Question 2: UI changes

**File: `src/components/project/PipelineResultView.tsx`**

Two changes:

1. **Remove `max-h-40` scroll constraint on post text** (line 131) — replace with no height limit so the full text is visible without scrolling. Same for email body (line 88).

2. **Carousel slides: show prompt and image side-by-side in a table layout** — instead of prompt above and image below, use a 2-column grid (left: prompt text, right: generated image). Same pattern for static image prompt + generated image (lines 166-190): show them as a row with prompt on the left and image on the right.

Layout for each carousel slide:
```text
┌──────────────────────────┬──────────────────────┐
│ 1. Обложка               │                      │
│ [prompt text]            │  [generated image]   │
└──────────────────────────┴──────────────────────┘
```

Layout for static image section:
```text
┌──────────────────────────┬──────────────────────┐
│ Промпт единого изобр.    │                      │
│ [prompt text]            │  [generated image]   │
└──────────────────────────┴──────────────────────┘
```

Same for email banner prompt + banner image.

