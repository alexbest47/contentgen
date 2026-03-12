

## Plan: Open Images in a Dialog Instead of New Page

### Change

**`src/components/project/PipelineResultView.tsx`**:

1. Add `Dialog` imports from `@/components/ui/dialog`
2. Add state for the currently previewed image (`previewSrc: string | null`)
3. Make `ImageThumbnail` clickable — on click, set `previewSrc` to the image URL
4. Render a `Dialog` at the component root that shows the full-size image when `previewSrc` is set, with a close button and download option
5. The dialog content will use `max-w-3xl` or similar to show a large but contained image

This is a single-file change to `PipelineResultView.tsx` — add click-to-preview on thumbnails and a shared `Dialog` overlay for the full image.

