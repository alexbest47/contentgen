

## Задача

1. Разрешить редактирование текста сгенерированного письма прямо в канвасе (contentEditable)
2. Разрешить добавление пользовательских блоков (текст, изображение, CTA, разделитель) после генерации — они отображаются под сгенерированным HTML

## Изменения

### 1. `src/components/email-builder/BlockCanvas.tsx`

**Full letter mode** (строки 149-162): сделать div с `generatedHtml` редактируемым через `contentEditable`. При `onBlur` вызывать новый колбэк `onUpdateGeneratedHtml(innerHTML)`, чтобы сохранить изменения в состояние.

После сгенерированного HTML показывать пользовательские блоки (text, image, cta, divider) из массива `blocks` — так же, как в block mode. Это позволит добавлять блоки через библиотеку слева.

Новый проп: `onUpdateGeneratedHtml: (html: string) => void`.

### 2. `src/pages/EmailBuilder.tsx`

- Передать `onUpdateGeneratedHtml={setGeneratedHtml}` в `BlockCanvas`
- Убрать блокировку `addBlock` в full letter mode (сейчас она не заблокирована, но блоки не отображаются — теперь будут)

### 3. Экспорт (`handleExport`, строки 400-450)

Обновить экспорт: если есть `generatedHtml` **и** блоки, объединить оба в итоговый HTML (сначала generatedHtml с подставленными картинками, потом блоки).

## Логика

```text
┌─────────────────────────┐
│  Header (read-only)     │
├─────────────────────────┤
│  Generated HTML         │  ← contentEditable, onBlur → save
│  (editable text)        │
├─────────────────────────┤
│  User blocks            │  ← добавленные через библиотеку
│  (text/image/cta/div)   │
├─────────────────────────┤
│  Footer (read-only)     │
└─────────────────────────┘
```

