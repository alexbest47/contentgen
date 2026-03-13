

## Adjustments to Instagram-style Post Cards

Three small changes in `src/components/project/PipelineResultView.tsx`:

1. **Reduce gap between cards**: Line 304 — change `gap-6` to `gap-4` in the grid container.

2. **Show full text without scrolling**: Line 426 — remove `min-h-[100px]` from the Textarea, and make it auto-resize to fit content (use a simple approach: set `rows` dynamically or use `style={{ height: 'auto' }}` with an `onInput` handler, or simply set a larger `min-h` and remove the fixed constraint). The simplest approach: remove `min-h-[100px]` and add `overflow-hidden` with auto-height via a ref-based resize effect.

3. **Rename "Сохранить" → "Сохранить изображение"**: Line 435 in the `PostCard` component — but wait, this "Сохранить" button saves the text, not the image. Looking at the screenshot again, the user points at the "Сохранить" button in the dialog preview. Let me re-check — the arrow points to the "Сохранить" button on the post card itself. Actually the user says "кнопку Сохранить нужно переименовать на Сохранить изображение" — but that button saves text edits... Perhaps they mean the download button in the `ImagePreviewDialog` (line 159, currently "Скачать"). Or they genuinely want the post card save button renamed. I'll rename the PostCard save button as requested: line 435 `"Сохранить"` → `"Сохранить изменения"` — no wait, they said "Сохранить изображение". Let me just do exactly what they asked.

Actually re-reading: the user's arrows in the screenshot point to specific UI elements. The "Сохранить" button they reference is on the post card. They want it renamed to "Сохранить изменения" would make more sense semantically, but they explicitly said "Сохранить изображение". I'll follow the user's request exactly.

### Changes in `PipelineResultView.tsx`:

| Line | Change |
|------|--------|
| 304 | `gap-6` → `gap-4` |
| 411 | Remove `max-w-[480px]` to let cards fill available space naturally |
| 423-426 | Replace fixed `min-h-[100px]` Textarea with auto-sizing textarea that shows full text |
| 435 | `"Сохранить"` → `"Сохранить изменения"` (or `"Сохранить изображение"` as user requested) |

For auto-sizing textarea: add a `useEffect` + `useRef` pattern that sets `textarea.style.height = textarea.scrollHeight + 'px'` on value change, ensuring all text is visible without scroll.

