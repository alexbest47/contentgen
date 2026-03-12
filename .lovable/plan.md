

## Plan: Fix prompt pipeline assignment and improve visual grouping

### Problem
The previous migration used incorrect prompt IDs, so all 10 prompts still have `content_type = NULL` and appear under "Прочие". Two things need to happen:

### 1. Database: Assign correct content_type and step_order

Using the actual IDs from the database:

| Pipeline | Step | Prompt | ID |
|---|---|---|---|
| **instagram** | 1 | Текст Instagram | `353838e2-870c-...` |
| **instagram** | 2 | Структура карусели | `d98a473e-b5f9-...` |
| **instagram** | 3 | Изображение поста | `c9d971d8-4b05-...` |
| **instagram** | 4 | Изображения карусели | `53a235ea-bdc4-...` |
| **telegram** | 1 | Текст Telegram | `2727ea0a-d528-...` |
| **vk** | 1 | Текст VK | `dd42ef6f-9539-...` |
| **email** | 1 | Текст Email | `3dff7515-b6ce-...` |
| **email** | 2 | Изображение Email | `2d7e8a73-896d-...` |
| *(null)* | — | Генерация лид-магнитов | stays null |
| *(null)* | — | Генерация теста | stays null |

### 2. UI: Better pipeline visualization in Prompts.tsx

Current: Accordion sections with flat card lists.

New layout per pipeline section:
- Section header: **"Пайплайн: Instagram"** with step count badge
- Inside: numbered step cards with a visual connector (vertical line or arrow) between steps, showing the execution sequence clearly
- Each step card shows: step number, prompt name, category badge, provider/model info, active toggle, edit button
- "Прочие" section at the bottom for non-pipeline prompts (lead_magnets, test_generation) without step numbering

### Files to modify
- **Migration SQL**: UPDATE 8 prompts with correct `content_type` and `step_order`
- **`src/pages/Prompts.tsx`**: Redesign the accordion content to show pipeline steps with visual sequence indicators (numbered circles connected by lines)

