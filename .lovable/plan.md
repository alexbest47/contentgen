

## Добавить тип оффера в отображение промпта

Сейчас везде показывается только `Промпт: «Название»`. Нужно добавить тип оффера и content_type.

### Изменения

Во всех трёх файлах изменить формат отображения:

**`src/pages/ProjectDetail.tsx`** (строка 249):
```
Промпт: «{prompt.name}» → Промпт: «{prompt.name}» ({offerTypeLabel} / {ct.key})
```
`offerType` уже доступен из `useParams`, преобразуем через `getOfferTypeLabel`.

**`src/pages/OfferDetail.tsx`** (строка 169):
```
Промпт: «{promptInfo[0].name}» → Промпт: «{promptInfo[0].name}» ({typeLabel})
```
`typeLabel` уже вычислен в компоненте.

**`src/pages/ContentDetail.tsx`** (строка 192):
```
Промпт: «{promptInfo[0].name}» → Промпт: «{promptInfo[0].name}» ({offerTypeLabel} / {contentTypeLabel})
```
`offerType` и `contentType` доступны из `useParams`.

Нужно импортировать `getOfferTypeLabel` в `ProjectDetail.tsx` и `ContentDetail.tsx` (в `OfferDetail.tsx` уже импортирован).

