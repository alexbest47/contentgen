

## Передавать русское название вместо ключа в `{{offer_type}}`

Сейчас во всех 4 edge-функциях подставляется технический ключ (например `pre_list`). Нужно подставлять русскую метку (`Предсписок`).

### Изменения

Добавить маппинг ключ→название в каждую из 4 функций и использовать его при подстановке:

**В каждой из функций** (`generate-pipeline`, `generate-lead-magnets`, `generate-content`, `generate-image`):

1. Добавить объект-словарь `OFFER_TYPE_LABELS` (копия из `offerTypes.ts`, т.к. edge functions не имеют доступа к `src/`):
```ts
const OFFER_TYPE_LABELS: Record<string, string> = {
  mini_course: "Мини-курс",
  diagnostic: "Диагностика",
  webinar: "Вебинар",
  pre_list: "Предсписок",
  new_stream: "Старт нового потока",
  spot_available: "Освободилось место",
  sale: "Распродажа",
  discount: "Скидка",
  download_pdf: "Скачай PDF",
};
```

2. Заменить подстановку:
```ts
// было
.replace(/\{\{offer_type\}\}/g, offer.offer_type)
// стало
.replace(/\{\{offer_type\}\}/g, OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type)
```

Итого: 4 файла, одинаковое изменение в каждом.

