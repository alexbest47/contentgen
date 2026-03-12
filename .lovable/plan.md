

## Analysis

The updated `slide_structure` prompt now outputs a JSON array of slide objects:

```json
[
  { "slide_number": 1, "type": "cover", "headline": "...", "subheadline": "...", "visual_note": "..." },
  { "slide_number": 2, "type": "content", "headline": "...", "body": "...", "visual_note": "..." },
  { "slide_number": N, "type": "cta", "headline": "...", "body": "...", "cta_text": "..." }
]
```

Currently `ProjectDetail.tsx` displays all content as plain text. For `slide_structure` results, this means users will see raw JSON — not useful.

## Plan

### 1. Create `SlideStructureView` component

`src/components/project/SlideStructureView.tsx` — a component that:
- Accepts raw JSON string, parses it into slides array
- Renders each slide as a visual card with:
  - Slide number badge + type label (cover/content/cta)
  - `headline` as title
  - `subheadline` or `body` as description
  - `visual_note` as a subtle design hint (italic, muted)
  - `cta_text` for CTA slides
- Falls back to plain text if JSON parsing fails
- Copy button copies the full JSON

### 2. Update `ProjectDetail.tsx`

In the content display section (lines 293-317), detect when the category is `slide_structure` and render `<SlideStructureView>` instead of the raw text/image display.

### Files

| File | Change |
|---|---|
| `src/components/project/SlideStructureView.tsx` | New component for structured slide rendering |
| `src/pages/ProjectDetail.tsx` | Use `SlideStructureView` for `slide_structure` categories |

