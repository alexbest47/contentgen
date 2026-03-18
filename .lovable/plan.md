

## Диагноз

Проблема в функции `setConfig` (строка 54-56). При выборе программы вызываются три `setConfig` подряд:

```ts
setConfig("program_id", v); setConfig("offer_id", ""); setConfig("selected_variant_id", undefined);
```

Каждый вызов делает `onUpdateConfig({ ...config, [key]: value })`, используя **один и тот же снимок** `config`. Третий вызов перезаписывает результат первого — `program_id` теряется.

Та же проблема у выбора типа оффера и оффера.

## Исправление

В `GeneratedBlockSettings.tsx` заменить цепочечные вызовы `setConfig` на один вызов `onUpdateConfig` с объединённым объектом:

**Строка 284** (выбор программы):
```ts
onValueChange={(v) => onUpdateConfig({ ...config, program_id: v, offer_id: "", offer_type: config.offer_type, selected_variant_id: undefined })}
```

**Строка 297** (выбор типа оффера):
```ts
onValueChange={(v) => onUpdateConfig({ ...config, offer_type: v, offer_id: "", selected_variant_id: undefined })}
```

**Строка 310** (выбор оффера):
```ts
onValueChange={(v) => onUpdateConfig({ ...config, offer_id: v, selected_variant_id: undefined })}
```

Аналогично для строк **350** (case_id) и **376** (objection_id).

Один файл, точечные правки в 5 строках.

