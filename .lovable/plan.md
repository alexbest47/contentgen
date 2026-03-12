

## Plan: Restructure all content pipelines to 2-step model

### New architecture

```text
Step 1: "Создать" → Claude returns JSON → saved as one content_piece
Step 2: User clicks button → images generated from JSON prompts

Social (instagram/telegram/vk) JSON:
{
  "post_text": "...",
  "static_image_prompt": "...",
  "carousel_prompts": [{ slide_number, type, prompt }, ...]
}
Buttons: "Сгенерировать карусель" | "Сгенерировать единое изображение"

Email JSON:
{
  "email_subject": "...",
  "email_body": "...",
  "banner_prompt": "..."
}
Button: "Сгенерировать баннер"
```

### Content storage categories

| Category pattern | What it stores |
|---|---|
| `pipeline_json_{subtype}` | Full JSON from Step 1 |
| `carousel_{subtype}_{N}` | Individual carousel slide image URL |
| `static_image_{subtype}` | Single 1080x1080 image URL |
| `banner_{subtype}` | Email banner image URL |

### Changes by file

**1. `supabase/functions/generate-pipeline/index.ts` — Simplify**

Remove the multi-step loop. Keep single prompt lookup (step_order=1), call Claude, save raw JSON as `pipeline_json_{sub_type}`. No image generation here. Remove OPENROUTER_API_KEY dependency.

**2. New `supabase/functions/generate-pipeline-images/index.ts`**

Accepts `{ project_id, content_type, sub_type, mode }` where mode is `"carousel"` | `"static"` | `"banner"`.

- Reads `pipeline_json_{sub_type}` from content_pieces
- Parses JSON
- If mode=carousel: iterates `carousel_prompts`, sends each to OpenRouter, uploads images, saves as `carousel_{sub_type}_{slide_number}`
- If mode=static: sends `static_image_prompt` to OpenRouter, saves as `static_image_{sub_type}`
- If mode=banner: sends `banner_prompt` to OpenRouter, saves as `banner_{sub_type}`

**3. `src/components/project/SlideStructureView.tsx` → rename to `PipelineResultView.tsx`**

Complete rewrite. Parses the pipeline JSON and renders:
- For social: post_text with copy button, carousel_prompts as slide cards (number + type + prompt preview), static_image_prompt preview
- For email: email_subject, email_body with copy, banner_prompt preview
- Generated images displayed inline when available (read from content_pieces)

**4. `src/pages/ProjectDetail.tsx` — Major UI overhaul**

- Remove old `ContentType` interface with `textCategory` / `imageCategories`
- Simplify content types to just key/label/icon/isEmail
- Each subtype card shows:
  - "Создать" button → calls `generate-pipeline` (Step 1)
  - Once JSON exists, render `PipelineResultView` with parsed content
  - For social: two image generation buttons (carousel / static)
  - For email: one banner generation button
  - Generated images shown inline
- New mutation `generateImagesMutation` calling `generate-pipeline-images`
- Update `hasContentForKey` and `getContent` logic for new category patterns

**5. `supabase/config.toml`** — Add `generate-pipeline-images` function config with `verify_jwt = false`

**6. Cleanup**

- `generate-content/index.ts` and `generate-image/index.ts` become unused (can keep for backward compatibility or delete)
- Old `SlideStructureView.tsx` replaced by new component
- `contentTypes` array in ProjectDetail simplified

### Edge function: generate-pipeline-images (key logic)

```typescript
// Read saved JSON
const { data: piece } = await supabase.from("content_pieces")
  .select("content")
  .eq("project_id", project_id)
  .eq("category", `pipeline_json_${sub_type}`)
  .single();

const json = JSON.parse(piece.content);

if (mode === "carousel") {
  for (const slide of json.carousel_prompts) {
    // Call OpenRouter with slide.prompt
    // Upload image → save as carousel_{sub_type}_{slide.slide_number}
  }
} else if (mode === "static") {
  // Call OpenRouter with json.static_image_prompt
  // Save as static_image_{sub_type}
} else if (mode === "banner") {
  // Call OpenRouter with json.banner_prompt
  // Save as banner_{sub_type}
}
```

### Files to create/modify

| File | Action |
|---|---|
| `supabase/functions/generate-pipeline/index.ts` | Simplify to single Claude call |
| `supabase/functions/generate-pipeline-images/index.ts` | New — image generation from JSON prompts |
| `src/components/project/PipelineResultView.tsx` | New — replaces SlideStructureView |
| `src/pages/ProjectDetail.tsx` | Major rewrite of content section |
| `src/components/project/SlideStructureView.tsx` | Delete (replaced) |

