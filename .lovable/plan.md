

## Показывать используемый промпт на страницах генерации

### Где нужно добавить

| Страница | Что генерируется | Как найти промпт |
|---|---|---|
| **ProjectDetail** | Контент по каналам | `prompts` where `content_type = ct.key`, `offer_type = offerType`, `is_active = true` |
| **ContentDetail** | Регенерация контента | Тот же запрос, один промпт по `content_type + offer_type` |
| **OfferDetail** | Лид-магниты | `prompts` where `category = 'lead_magnets'`, `offer_type = offer.offer_type`, `is_active = true` |
| **OfferTypeDetail** | Лид-магниты (кнопка ✨) | То же, что OfferDetail |
| **DiagnosticDetail** | Тест | `prompts` where `category = 'test_generation'`, `is_active = true` |

### Реализация

**Новый хук `src/hooks/usePromptInfo.ts`** — универсальный хук, принимающий фильтры и возвращающий массив промптов:

```typescript
export function usePromptInfo(filters: {
  category?: string;
  content_type?: string;
  offer_type?: string;
  enabled?: boolean;
}) => useQuery → prompts[] { name, content_type, offer_type }
```

**Отображение** — мелкий текст `text-xs text-muted-foreground` под кнопкой или рядом с заголовком секции:
```
Промпт: «Текст поста + все Imagen-промпты: Instagram» (мини-курс / instagram)
```

### Изменения по файлам

**`src/hooks/usePromptInfo.ts`** (новый):
- `useQuery` к таблице `prompts` с фильтрами `category`, `content_type`, `offer_type`, `is_active = true`
- Возвращает массив `{ name, content_type, offer_type }`

**`src/pages/ProjectDetail.tsx`**:
- Добавить запрос промптов для текущего `offerType`, `is_active = true`, без фильтра по `content_type`
- Под каждой карточкой канала показать имя промпта, совпадающего по `content_type`

**`src/pages/ContentDetail.tsx`**:
- Запрос промпта по `content_type` + `offer_type`
- Показать под заголовком страницы

**`src/pages/OfferDetail.tsx`**:
- Запрос промпта `category = 'lead_magnets'`, `offer_type = offer.offer_type`
- Показать под кнопкой «Сгенерировать лид-магниты»

**`src/pages/OfferTypeDetail.tsx`**:
- То же — запрос промпта лид-магнитов по `offerType`
- Показать рядом с кнопкой ✨ или общей подписью

**`src/pages/DiagnosticDetail.tsx`**:
- Запрос промптов `category = 'test_generation'`, `is_active = true`
- Показать под кнопкой генерации

Формат отображения везде одинаковый: `text-xs text-muted-foreground`, название промпта.

