

## Задача

Три проблемы после генерации письма:
1. **Разный фон** — `renderHtmlWithPlaceholders` разрезает HTML на куски, ломая inline-стили
2. **Нет редактирования текста** — `contentEditable` не работает когда есть image placeholders  
3. **Шаблонные блоки остаются** — после генерации видны locked/generated блоки, а нужны только пользовательские

## Корневая причина (фон)

Наша функция `renderHtmlWithPlaceholders` разбивает HTML по `{{image_placeholder_N}}` на отдельные `<div dangerouslySetInnerHTML>`. Браузер «чинит» незакрытые теги в каждом фрагменте, теряя контекст `<table bgcolor>` / inline background-color.

## Решение

### 1. `BlockCanvas.tsx` — единый HTML-рендеринг

Отказаться от разбиения HTML на фрагменты. Вместо этого:

- **Перед рендером** заменить `{{placeholder_id}}` прямо в строке HTML:
  - Если есть `image_url` → `<img src="url" style="max-width:100%" />`
  - Если нет → `<img src="" data-placeholder-id="..." style="display:block;width:100%;height:200px;background:#f0f0f0" />`
- Рендерить **весь HTML** в одном `contentEditable` div — текст редактируется, фон не ломается
- Кнопки генерации изображений — вынести в **отдельную панель** под канвасом (список незаполненных плейсхолдеров с кнопками), либо в правую панель настроек

### 2. `BlockCanvas.tsx` — фильтрация блоков в full letter mode

Когда `isFullLetterMode === true`, из массива `blocks` показывать только пользовательские:

```ts
const userBlocks = blocks.filter(b => 
  ["text", "image", "cta", "divider"].includes(b.block_type)
);
```

Шаблонные/генерируемые блоки скрываются — они уже вошли в сгенерированный HTML.

### 3. `BlockLibrary.tsx` — скрыть генерируемые блоки после генерации

Принять проп `isFullLetterMode`. Если `true` — скрыть секцию «Генерируемые блоки», оставить только пользовательские (текст, изображение, CTA, разделитель).

### 4. `EmailBuilder.tsx` — передать флаг

Передать `isFullLetterMode={!!generatedHtml}` в `BlockLibrary`.

### Файлы:
- `src/components/email-builder/BlockCanvas.tsx` — переписать рендеринг HTML + фильтрация блоков
- `src/components/email-builder/BlockLibrary.tsx` — скрыть генерируемые блоки
- `src/pages/EmailBuilder.tsx` — передать флаг

