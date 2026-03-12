

## CSV Import for Prompts (mini_course)

### Overview
Add a CSV import button to the Prompts page that replaces all prompts for the selected offer type tab (starting with `mini_course`). Also generate a downloadable CSV template.

### CSV Columns
`name,slug,category,content_type,sub_type,step_order,provider,model,description,system_prompt,user_prompt_template,output_format_hint,is_active`

### Changes

**1. New component: `src/components/prompts/CsvImportButton.tsx`**
- "Импорт CSV" button + hidden file input
- "Скачать шаблон" button that generates a CSV template with headers and 2 example rows
- On file select: parse CSV (simple split-based parser, no library needed), validate required columns
- Show confirmation dialog: "Будет удалено N существующих промптов и создано M новых для типа Мини-курс"
- On confirm: delete all prompts where `offer_type = offerTypeKey`, then insert parsed rows with `offer_type` set automatically
- Toast success/error

**2. Update `src/pages/Prompts.tsx`**
- Import and render `CsvImportButton` next to "Создать промпт" button
- Pass current active tab's `offerTypeKey` to the component
- Invalidate prompts query on success

### CSV Template Example
```csv
name,slug,category,content_type,sub_type,step_order,provider,model,description,system_prompt,user_prompt_template,output_format_hint,is_active
"Текст поста Instagram Анонс",text-ig-announce,text_instagram,instagram,announcement,1,anthropic,claude-sonnet-4-20250514,"Генерация текста поста","Ты копирайтер...","Напиши пост для {{program_title}}...","JSON",true
```

### Import Logic
1. Parse CSV rows, map to prompt objects
2. Set `offer_type` from current tab (not from CSV — prevents mistakes)
3. Delete existing prompts for that `offer_type`
4. Bulk insert new prompts
5. Refresh query

