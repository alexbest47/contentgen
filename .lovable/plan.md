

## Plan: Assign content_type and step_order to existing prompts

All 10 prompts currently have `content_type = NULL` and `step_order = 1`, which is why they all appear under "Прочие". We need to run a single SQL migration to distribute them into the correct pipelines.

### Distribution

| Pipeline | Step | Prompt | ID |
|---|---|---|---|
| **instagram** | 1 | Текст Instagram | `353838e2...` |
| **instagram** | 2 | Структура карусели | `d98a473e...` |
| **instagram** | 3 | Изображение поста | `c9d971d8...` |
| **instagram** | 4 | Изображения карусели | `53a235ea...` |
| **telegram** | 1 | Текст Telegram | `2727ea0a...` |
| **vk** | 1 | Текст VK | `dd42ef6f...` |
| **email** | 1 | Текст Email | `3dff7515...` |
| **email** | 2 | Изображение Email | `2d7e8a73...` |
| *(no type)* | 1 | Генерация лид-магнитов | `c3749d2b...` |
| *(no type)* | 1 | Генерация теста | `b615c3c8...` |

### Implementation

Single SQL migration with UPDATE statements setting `content_type` and `step_order` for each prompt by ID. No code changes needed -- the Prompts.tsx page already groups by `content_type`.

