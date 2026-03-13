

## Reduce Image Sizes in Post Cards

The images currently fill the full card width with `aspect-square`, making them too large. We'll constrain the image area to a max height and keep them centered.

### Changes in `src/components/project/PipelineResultView.tsx`:

1. **Add `max-w-[400px] mx-auto`** to the `PostCard` component's `Card` wrapper (line 419) to limit overall card width, which naturally constrains images.

2. Alternatively (and perhaps better for the 2-column layout): keep cards filling the grid but change the image `aspect-square` to a smaller fixed max-height approach:
   - Line 349 (static image): change `aspect-square` to `aspect-[4/3]` or add `max-h-[350px]`
   - Line 491 (carousel slides): same change

Given the screenshot shows images taking up most of the viewport, constraining cards with `max-w-[400px] mx-auto` on each card is the cleanest approach — it keeps the Instagram-like proportions while making everything smaller.

### Summary of edits:
| Location | Change |
|----------|--------|
| Line 419 (`Card` in `PostCard`) | Add `max-w-[480px] mx-auto` to center and constrain card width |

This single change constrains both the carousel and static image cards since both use `PostCard`.

