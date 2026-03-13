

## Show Full Images (4:5 Portrait Aspect Ratio)

Currently images use `aspect-square` + `object-cover`, cropping portrait (4:5) images. Change to `aspect-[4/5]` + `object-contain` so full images are visible.

### Changes in `src/components/project/PipelineResultView.tsx`:

| Line | Current | New |
|------|---------|-----|
| 349 | `aspect-square … overflow-hidden` | `aspect-[4/5] … overflow-hidden` |
| 353 | `object-cover` | `object-contain` |
| 491 | `aspect-square … overflow-hidden` | `aspect-[4/5] … overflow-hidden` |
| 495 | `object-cover` | `object-contain` |

This applies to both the static image container and each carousel slide, ensuring portrait images display fully without cropping.

