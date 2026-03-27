
## Что уже проверил

Для текущего письма `/email-builder/33d1b1b9-638b-4313-b8f6-5ad6baa731a1` стиль в базе **сохранился корректно**:
- шаблон: `Приглашение на вебинар: письмо 1`
- `image_style_id` = `Фотореализм`

Но у этого же письма в `image_placeholders[0].prompt` уже лежит текст вида:
`Flat minimalistic illustration style, purple-grey color palette...`

Значит проблема не в сохранении значения из визарда, а в том, **как собирается промпт для генерации письма/изображения**.

## Корневая причина

Сейчас в `generate-email-letter` и `generate-email-block` переменные подставляются только в `user_prompt_template`, а `system_prompt` уходит в модель почти как есть.

Это критично, потому что для 4 шаблонов из 5 переменная `{{image_style}}` находится именно в `system_prompt`:
- История трансформации
- Прямой оффер
- Вебинар: письмо 1
- Вебинар: письмо 2

Для шаблона `С нуля` проблема двойная:
- его `system_prompt` сейчас вообще слишком пустой
- в нём **нет** `{{image_style}}`, поэтому этот шаблон никогда не сможет учитывать выбранный стиль без обновления самого промпта

Также важно: генератор картинки не читает `image_style_id` напрямую. Он использует уже готовый `image_placeholders[].prompt`, который сначала собирает Claude. Если стиль не попал туда, изображение всегда будет “не тем”.

## План исправления

### 1. Починить подстановку переменных в `system_prompt`
Файлы:
- `supabase/functions/generate-email-letter/index.ts`
- `supabase/functions/generate-email-block/index.ts`

Что сделать:
- собрать единый словарь переменных
- подставлять его **и в `system_prompt`, и в `user_prompt_template`**
- `image_style` подставлять с приоритетом выбранного `image_style_id`, а не глобальной переменной
- передавать в модель уже `resolvedSystemPrompt`, а не сырой `prompt.system_prompt`

Это исправит применение стиля сразу для всех существующих шаблонов, где `{{image_style}}` уже есть.

### 2. Привести `free_form` к той же схеме
Файл:
- новая миграция для записи `prompts` со slug `email-builder-free-form`

Что сделать:
- обновить системный промпт шаблона `С нуля`
- добавить в него `{{image_style}}`
- добавить нормальные инструкции для единственного баннера `image_placeholder_1`
- сохранить совместимость с текущей логикой `{{letter_theme}}`

Иначе из 5 шаблонов именно `С нуля` останется исключением.

### 3. Не трогать визард без необходимости
Файл:
- `src/components/email-builder/CreateLetterWizard.tsx`

Из текущей проверки видно, что визард уже пишет `image_style_id` в `email_letters`.
Отдельный фикс в визарде не нужен, если не обнаружится второй баг при повторной проверке.

### 4. Сделать единый механизм замены плейсхолдеров
Чтобы больше не ловить такие ошибки точечно:
- вынести замену переменных в общий helper для edge functions
- использовать его и для писем, и для блоков
- исключить ситуацию, когда часть переменных меняется в одном месте, а часть нет

## Проверка после исправления

Проверю отдельно все 5 шаблонов:
1. История трансформации
2. Прямой оффер
3. Приглашение на вебинар: письмо 1
4. Приглашение на вебинар: письмо 2
5. С нуля

Для каждого шаблона:
- создать письмо через визард с выбранным стилем `Фотореализм`
- убедиться, что `image_style_id` сохранился в `email_letters`
- запустить генерацию письма
- проверить, что в `image_placeholders[].prompt` появляется фотостиль, а не старый “flat minimalistic illustration”
- отдельно убедиться, что в письме с одним баннером и письме с несколькими плейсхолдерами стиль проходит одинаково

## Технические детали

Ключевой фикс будет таким по сути:

```ts
const templateVars = {
  ...gv,
  image_style: imageStyleText,
  brand_style: brandStyle,
  brand_voice: gv.brand_voice || "",
  audience_description: audienceDescription,
  letter_theme: letterTheme,
  ...
};

const resolvedSystemPrompt = applyVars(prompt.system_prompt || "", templateVars);
const resolvedUserPrompt = applyVars(prompt.user_prompt_template || "", templateVars);
```

А в запрос к модели пойдёт:

```ts
system: resolvedSystemPrompt
messages: [{ role: "user", content: resolvedUserPrompt }]
```

## Файлы в изменениях

- `supabase/functions/generate-email-letter/index.ts`
- `supabase/functions/generate-email-block/index.ts`
- новая миграция для обновления `prompts.slug = 'email-builder-free-form'`

Если хочешь, следующим сообщением я подготовлю уже точечную реализацию именно этого фикса без расширения скоупа.