

## Добавить кнопку «Сохранить»

### Изменения

**1. `EmailBuilderHeader.tsx`** — добавить проп `onSave` и кнопку рядом с бейджем статуса:

- Добавить в `Props`: `onSave: () => void`
- После `Badge` добавить `<Button variant="outline" size="sm" onClick={onSave} disabled={saveStatus === "saving"}>Сохранить</Button>`

**2. `EmailBuilder.tsx`** — передать `save` в header:

- Добавить проп `onSave={save}` в `<EmailBuilderHeader>`

Две правки, два файла.

