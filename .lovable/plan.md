

## Добавить кнопку «Скачать JSON» для промпта диагностической карты

Рядом с кнопкой «Скопировать» добавить кнопку «Скачать JSON», аналогично тому, как это сделано для quiz JSON выше.

### Изменение в `src/pages/DiagnosticDetail.tsx` (строки 692-695)

Добавить кнопку `downloadFile(cardPrompt, "card-prompt.json")` рядом с существующей кнопкой копирования. Функция `downloadFile` уже определена в компоненте.

```tsx
<div className="flex gap-2">
  <Button onClick={() => copyToClipboard(cardPrompt, "Промпт")} variant="outline">
    <Copy className="h-4 w-4 mr-2" />
    Скопировать
  </Button>
  <Button onClick={() => downloadFile(cardPrompt, "card-prompt.json")} variant="outline">
    <Download className="h-4 w-4 mr-2" />
    Скачать JSON
  </Button>
</div>
```

