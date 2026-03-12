

## Plan: Soft-delete offers with archive

### Database
Add `is_archived` boolean column (default `false`) to `offers` table via migration.

### OfferTypeDetail.tsx changes
1. Filter query to only show `is_archived = false` offers
2. Add a delete (trash) button per offer row with `e.stopPropagation()`
3. Add `AlertDialog` for confirmation ("Оффер будет перемещён в архив")
4. On confirm: `UPDATE offers SET is_archived = true WHERE id = ...`

### New page: `src/pages/Archive.tsx`
- Query all offers where `is_archived = true`, joined with `paid_programs(title)` and `offer_tags(tag_id, tags(name))`
- Display as a list similar to OfferTypeDetail
- Each row has a "Восстановить" (restore) button that sets `is_archived = false`
- Permanent delete option with separate confirmation

### Routing & sidebar
- Add route `/archive` in `App.tsx`
- Add "Архив" item to `mainNav` in `AppSidebar.tsx` with `Archive` icon from lucide

### Technical details
- Migration: `ALTER TABLE offers ADD COLUMN is_archived boolean NOT NULL DEFAULT false;`
- All existing queries that fetch offers (OfferTypeDetail, Descriptions, OfferDetail) will be updated to filter `.eq("is_archived", false)`
- No RLS changes needed — same policies apply

