

## Audit results

I reviewed all 6 edge functions. Here's the status:

| Function | Prompts from DB? | Hardcoded issues? |
|---|---|---|
| `generate-lead-magnets` | Yes, from DB | None — clean |
| `generate-content` | Yes, from DB | None — clean |
| `generate-pipeline` | Yes, from DB | None — clean |
| `generate-image` | Yes, from DB | **Old `leadMagnetContext` with deleted columns** (lines 88-95, 105) |
| `generate-project-name` | Hardcoded prompt | Utility function, not user content |
| `fetch-google-doc` | N/A | N/A (no AI prompts) |

### Problem found

**`generate-image/index.ts`** still references old deleted columns in `leadMagnetContext` (lines 88-95):
- `selectedLead.description` — deleted
- `selectedLead.marketing_angle` — deleted  
- `selectedLead.call_to_action` — deleted
- `selectedLead.infographic_concept` — deleted
- `selectedLead.attention_reason` — deleted

And line 105: `selectedLead.description` used for `{{lead_magnet_description}}`.

### Fix

Update `generate-image/index.ts` lines 88-95 and 105 to use new fields, identical to the other functions:

```typescript
const leadMagnetContext = `Выбранный лид-магнит:
- Название: ${selectedLead.title}
- Формат: ${selectedLead.format || ""}
- Обещание: ${selectedLead.promise || ""}
- Ключевой инсайт: ${selectedLead.key_insight || ""}
- Переход к курсу: ${selectedLead.transition_to_course || ""}`;
```

And line 105: change `selectedLead.description` → `selectedLead.promise`.

### Files to modify

| File | Change |
|---|---|
| `generate-image/index.ts` | Fix `leadMagnetContext` (lines 88-95) and `lead_magnet_description` replacement (line 105) |

