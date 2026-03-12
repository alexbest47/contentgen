

## UI Redesign: Content Generation Section

### Problem
Currently, content for each platform (Instagram, Telegram, etc.) shows sub-types (Анонс, Прогрев, Конверсия) as inline expandable cards within the same page. User wants:
1. A **table-like layout** per platform with rows: sub-type name, status badge, and a single Create/Update button
2. Clicking a row (when content exists) navigates to a **separate detail page** for that specific content piece (e.g., Instagram + Анонс)

### Changes

**1. Simplify `ProjectDetail.tsx` content section**
- Replace the 3-column grid of expandable cards with a simple table/list per platform
- Each row: sub-type label + description | status badge ("Готово" or empty) | "Создать"/"Обновить" button
- Row click (when has content) navigates to `/programs/:programId/offers/:offerType/:offerId/projects/:projectId/content/:contentType/:subType`
- Remove all expand/collapse logic, `PipelineResultView` rendering, and image generation buttons from this page

**2. Create new page `src/pages/ContentDetail.tsx`**
- Route: `/programs/:programId/offers/:offerType/:offerId/projects/:projectId/content/:contentType/:subType`
- Back button returns to ProjectDetail
- Header: platform label + sub-type label (e.g., "Пост в Instagram — Анонс")
- Shows `PipelineResultView` with full content
- Image generation buttons (carousel, static, banner depending on platform type)
- "Обновить" button to regenerate pipeline JSON

**3. Add route in `App.tsx`**
- Add route for the new content detail page under the protected layout

