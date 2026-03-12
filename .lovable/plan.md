

## UI Improvement for ContentDetail + Editable Text

### Problems
1. Grey-on-grey blocks blend together — no visual separation
2. Images render at full size — too large
3. Text content is read-only — no way to edit and save

### Changes

**`src/components/project/PipelineResultView.tsx`** — Major refactor:

1. **Visual separation**: Wrap each section (post text, each carousel slide, static image block) in `Card` components with white background, giving clear visual boundaries against the page background.

2. **Smaller images**: Constrain carousel and static images to `max-w-[200px]` (thumbnail size) with click-to-expand or just smaller fixed width. Images in the 2-column grid will take less space.

3. **Editable text fields**: 
   - Replace static `<div>` text displays with `<Textarea>` components for post_text, email_subject, email_body
   - Add a "Сохранить" button per editable section
   - Accept an `onSave(updatedJson: string)` callback prop from parent
   - Track local edit state; on save, serialize back to JSON and call `onSave`

4. **Slide prompts**: Keep prompts read-only (they're AI prompts, not user content), but style them more distinctly with a lighter italic card.

**`src/pages/ContentDetail.tsx`**:
- Pass an `onSave` handler to `PipelineResultView` that updates the `content_pieces` row via `supabase.from("content_pieces").update({ content: newJson }).eq("id", pipelineJson.id)`
- Invalidate query on success, toast confirmation

### Layout Structure (Social)
```text
┌─ Card: Текст поста ──────────────────────────┐
│ [Textarea - editable]           [Копировать]  │
│                                 [Сохранить]   │
└───────────────────────────────────────────────┘

┌─ Card: Слайды карусели ───────────────────────┐
│ ┌─ Slide 1 ─────────────────────────────────┐ │
│ │ Badge: "1. Обложка"                       │ │
│ │ Prompt (italic, muted)    | img 200px max │ │
│ └───────────────────────────────────────────┘ │
│ ┌─ Slide 2 ─────────────────────────────────┐ │
│ │ ...                                       │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘

┌─ Card: Единое изображение ────────────────────┐
│ Prompt (italic)              | img 200px max  │
└───────────────────────────────────────────────┘
```

### Save Logic
- Component tracks `editedPostText`, `editedSubject`, `editedBody` in local state (initialized from parsed JSON)
- On "Сохранить" click: merge edits back into the parsed JSON object, serialize to string, call `onSave(newJsonString)`
- Parent updates `content_pieces` row in database

