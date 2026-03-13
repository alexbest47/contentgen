

## Instagram-style Post Preview Layout

Redesign `SocialView` in `PipelineResultView.tsx` to present content as two Instagram-like post previews instead of the current form-heavy layout.

### Concept

Show two "phone post" cards side by side (or stacked on narrow screens): one for the carousel post, one for the single-image post. Each card mimics an Instagram post: image on top, text below.

### Layout

```text
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  📷 Пост с каруселью        │  │  📷 Пост с изображением     │
│ ┌─────────────────────────┐ │  │ ┌─────────────────────────┐ │
│ │  Carousel of slides     │ │  │ │  Static image            │ │
│ │  (embla-carousel)       │ │  │ │  (or placeholder)        │ │
│ │  ● ● ● ○ ○ ○ ○         │ │  │ └─────────────────────────┘ │
│ └─────────────────────────┘ │  │                             │
│                             │  │  [editable textarea]        │
│  [editable textarea]        │  │  [copy] [save]              │
│  [copy] [save]              │  └─────────────────────────────┘
└─────────────────────────────┘
```

### Changes — `src/components/project/PipelineResultView.tsx`

**SocialView** — replace the current flat list with two side-by-side `Card` containers:

1. **Carousel post card** (left):
   - Title: "Пост с каруселью"
   - Use `embla-carousel-react` (already installed) to show carousel slide images in a swipeable carousel with dot indicators. Max width ~400px, square aspect ratio to mimic Instagram.
   - Clicking any slide image opens the existing `ImagePreviewDialog`
   - Below the carousel: editable `post_text_carousel` textarea with copy/save buttons
   - Below textarea: collapsible section showing slide prompts (for reference, not prominent)

2. **Single image post card** (right):
   - Title: "Пост с изображением"
   - Show `staticImage` at the top, constrained to same width, square aspect ratio
   - Below: editable `post_text_single` textarea with copy/save
   - Below textarea: collapsible prompt text

3. **Backward compat**: When data has only `post_text` (no split), show a single post card with the static image and unified text.

4. **Responsive**: `grid grid-cols-1 lg:grid-cols-2 gap-6` — stacks on mobile, side by side on desktop.

5. **Slide prompts section**: Move from prominent card to a small collapsible `<Collapsible>` under each post card, showing prompt text in muted italic — keeps it available but not visually dominant.

### No changes needed to:
- `ContentDetail.tsx` — props and `onSave` stay the same
- `EmailView` — email layout stays as-is
- Database / edge functions — no changes

