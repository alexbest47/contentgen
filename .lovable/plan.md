

## Plan: Restructure content generation into content type pipelines

### Concept
Replace the current 8 individual content categories with 4 high-level content types. Each content type defines a **pipeline** — an ordered sequence of prompts that execute automatically to produce a complete result (text + image).

```text
Current flow:
  Lead magnet → [8 separate buttons: text_instagram, image_post, text_vk, ...]

New flow:
  Lead magnet → [4 buttons: Instagram, Telegram, VK, Email]
                    ↓
              Pipeline runs automatically:
                Step 1: text prompt → Claude → text
                Step 2: image prompt → OpenRouter → image
                    ↓
              User sees combined result (text + image)
```

### Database changes

1. **Add `content_type` and `step_order` to `prompts` table:**
   - `content_type text` — one of: `instagram`, `telegram`, `vk`, `email` (nullable for legacy prompts like `lead_magnets`)
   - `step_order integer DEFAULT 1` — execution order within the pipeline

   This lets you assign multiple prompts to one content type. E.g., for Instagram: step 1 = text prompt (Claude), step 2 = image prompt (OpenRouter/Gemini).

2. **No enum changes needed** — `content_type` will be a plain text column to avoid migration complexity. The existing `prompt_category` stays as-is for backward compatibility.

### New edge function: `generate-pipeline`

A single edge function that:
1. Receives `{ project_id, content_type }` (e.g., `"instagram"`)
2. Fetches all active prompts with that `content_type`, ordered by `step_order`
3. Executes each prompt sequentially:
   - If prompt category is `image_*` → call OpenRouter with `modalities: ["image", "text"]`
   - Otherwise → call Claude API
4. Stores each result as a `content_piece` with `category` = the prompt's `prompt_category`
5. Returns all results together

### ProjectDetail.tsx changes

Replace the 8 category cards with 4 content type cards:

| Content type | Label | Expected output |
|---|---|---|
| `instagram` | Пост в Instagram | Text + Image |
| `telegram` | Пост в Telegram | Text (+ optional image) |
| `vk` | Пост в ВКонтакте | Text (+ optional image) |
| `email` | Email-рассылка | Text + Image |

Each card:
- One "Сгенерировать" button that triggers the full pipeline
- Shows progress: "Шаг 1 из 2: Генерация текста..."
- After completion, displays both text and image in one card
- Copy text / Download image buttons

### Prompts management page changes

Group prompts visually by `content_type`:
- Accordion/collapsible sections: "Instagram", "Telegram", "VK", "Email", "Прочие"
- Within each section, prompts sorted by `step_order`
- New field in the prompt form: content type selector + step order number
- Visual indicator showing the pipeline sequence (Step 1, Step 2, etc.)

### Files to create/modify

| File | Action |
|---|---|
| Migration SQL | Add `content_type` and `step_order` columns to `prompts` |
| `supabase/functions/generate-pipeline/index.ts` | New edge function — sequential pipeline execution |
| `src/pages/ProjectDetail.tsx` | Replace 8 categories with 4 content type cards + combined results |
| `src/pages/Prompts.tsx` | Group by content_type, add content_type/step_order fields |
| `supabase/config.toml` | Add `generate-pipeline` function config |

### Existing edge functions

`generate-content` and `generate-image` remain as-is — the new `generate-pipeline` function will contain its own logic (combining both text and image generation in one sequential flow) to avoid cross-function invocation complexity.

