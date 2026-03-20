

## Удаление блока «Разбор мифа» из шаблона «История трансформации»

Убрать 4-й элемент (`myth_busting` / «Разбор мифа») из массива `blocks` в записи `email_templates`.

### Действие

Один SQL UPDATE — заменить `blocks` на массив из 5 элементов (без `myth_busting`):

```json
[
  {"block_type":"hook_monologue","label":"Зачин + внутренний монолог","mode":"text_only"},
  {"block_type":"testimonial_content","label":"Кейс студента","mode":"card_text"},
  {"block_type":"instrument_schema","label":"Инструмент / схема","mode":"schema_text"},
  {"block_type":"program_description","label":"Описание программы","mode":"text_only"},
  {"block_type":"offer_cta","label":"Оффер + бонусы + CTA","mode":"accent_block"}
]
```

Без изменений в коде. Страница `/email-templates` подхватит обновление автоматически.

