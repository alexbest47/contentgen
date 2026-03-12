

## Plan: Add sub_type dimension and create 43 prompts

### Current state
10 prompts exist, no sub_type concept. Pipeline runs all prompts for a content_type sequentially.

### New structure
Each content pipeline now has 3 sub-variants: **Анонс**, **Прогрев**, **Конверсия**. User picks content_type + sub_type, then the pipeline runs only matching prompts.

```text
User flow:
  Lead magnet selected
    → Pick: Instagram / Telegram / VK / Email
      → Pick: Анонс / Прогрев / Конверсия
        → Pipeline runs 4 steps (or 2 for Email)
```

### 1. Database changes

**Add `sub_type` column:**
```sql
ALTER TABLE prompts ADD COLUMN sub_type text; -- 'announcement', 'warmup', 'conversion'
```

**Delete old 8 pipeline prompts** (keep lead_magnets + test_generation), then **insert 42 new prompts** organized as:

| Content type | Steps per sub_type | Total |
|---|---|---|
| instagram | 4 (text, carousel structure, cover image, slide images) | 12 |
| telegram | 4 (text, carousel structure, cover image, slide images) | 12 |
| vk | 4 (text, carousel structure, cover image, slide images) | 12 |
| email | 2 (text, banner image) | 6 |

Each prompt gets concise system_prompt + user_prompt_template. Image prompts use `openrouter` provider and `google/gemini-3-pro-image-preview` model.

### 2. Edge function update (`generate-pipeline`)

Accept `{ project_id, content_type, sub_type }`. Filter prompts by both `content_type` AND `sub_type`:

```typescript
const { data: pipelineSteps } = await supabase
  .from("prompts")
  .select("*")
  .eq("content_type", content_type)
  .eq("sub_type", sub_type)
  .eq("is_active", true)
  .order("step_order", { ascending: true });
```

### 3. ProjectDetail.tsx update

After clicking a content type card, show 3 sub-type buttons: **Анонс**, **Прогрев**, **Конверсия**. Each triggers `generate-pipeline` with the corresponding `sub_type`. Results are stored per `category` (which includes sub_type in the slug), so all 3 variants can coexist.

Content pieces category will encode sub_type, e.g., `text_instagram_announcement`, so results don't overwrite each other.

### 4. Prompts management page update

Group prompts as: **Content type → Sub type → Steps**. Visual layout:
```text
Пайплайн: Instagram
  ├── Анонс (4 шага)
  │   Step 1: Текст поста
  │   Step 2: Структура карусели
  │   Step 3: Обложка карусели
  │   Step 4: Слайды карусели
  ├── Прогрев (4 шага)
  │   ...
  └── Конверсия (4 шага)
      ...
```

Add `sub_type` field to the prompt form dialog.

### 5. Prompt content (concise drafts)

All text prompts share this system prompt pattern:
> "Ты — маркетолог, специалист по [platform]. Пиши на русском. Формат: готовый к публикации текст."

User prompt template pattern:
> "Напиши [тип: анонс/прогрев/конверсия] пост для [platform]. Аудитория: {{audience_description}}. Оффер: {{offer_description}}. Лид-магнит: {{lead_magnet}}."

Image prompts system prompt:
> "Generate a marketing image for [platform]. Style: modern, clean, professional."

User prompt template:
> "Create [cover/slides] for a [announcement/warmup/conversion] carousel about: {{lead_magnet_title}}. Based on structure: {{previous_steps}}"

### Files to modify

| File | Change |
|---|---|
| Migration SQL | Add `sub_type` column |
| Data operations | Delete 8 old pipeline prompts, insert 42 new ones |
| `generate-pipeline/index.ts` | Add `sub_type` filtering |
| `src/pages/ProjectDetail.tsx` | Sub-type selection UI + updated content display |
| `src/pages/Prompts.tsx` | Group by content_type → sub_type |
| `src/components/prompts/PipelineGroup.tsx` | Sub-type sections within pipeline |
| `src/components/prompts/PromptFormDialog.tsx` | Add sub_type field |
| `src/components/prompts/PromptStepCard.tsx` | Show sub_type badge |

