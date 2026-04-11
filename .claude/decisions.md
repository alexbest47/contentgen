> Это файл только для записи в него важных архитектурных решений по всему проекту!

## Конструктор лендингов: шаблонные переменные форм

В шаблонах блоков (`landing_block_definitions.html_template`) используются переменные вида `{{ПЕРЕМЕННАЯ}}`.
При создании новых блоков с формами — обязательно использовать именно эти переменные, не хардкодить атрибуты форм напрямую.

Переменные подставляются в трёх контекстах: превью редактора, экспорт WP (PHP) и экспорт S3 (HTML).

### Таблица подстановок

| Переменная | Превью | WP (PHP) | S3 GetCourse | S3 Шлюз |
|---|---|---|---|---|
| `{{FORM_TAG_ATTRS}}` | `data-target="axFormRequest"` | `<?= $formParmas['tag']; ?>` | `action="https://lk.talentsy.ru/pl/lite/block-public/process-html?id={id}" method="post" data-open-new-window="0"` | `id="form"` |
| `{{FORM_CLASS_EXTRA}}` | `ajaxForm` | `<?= $formParmas['class']; ?>` | пусто | пусто |
| `{{FIELD_NAME_NAME}}` | `Name` | `<?= $formParmas['names']['name']; ?>` | `formParams[first_name]` | `Name` |
| `{{FIELD_PHONE_NAME}}` | `Phone` | `<?= $formParmas['names']['phone']; ?>` | `formParams[phone]` | `Phone` |
| `{{FIELD_EMAIL_NAME}}` | `Email` | `<?= $formParmas['names']['email']; ?>` | `formParams[email]` | `Email` |
| `{{FORM_AGREED_BLOCK}}` | HTML блока согласия | `get_template_part('inc/components/form/agreed')` | HTML блока согласия | HTML блока согласия |
| `{{FORM_HIDDENS}}` | пусто | `<?= $formParmas['hiddens']; ?>` | скрытые поля GetCourse (UTM, elly_alias и др.) | скрытые поля шлюза |
| `{{DISCOUNT_UNTIL}}` | `03.04.2026` (захардкожено) | `<?= date('d.m.Y', strtotime('+4 days')); ?>` | `<span class="js-discount-until"></span>` | `<span class="js-discount-until"></span>` |
| `{{PROMO_BLOCK}}` | блок промокода (превью) | WP-версия блока промокода | пусто | блок промокода для шлюза |

### Где реализована логика подстановки

- **Превью:** `src/hooks/useLandingPreviewHtml.ts`
- **WP и S3 экспорт:** `src/utils/exportLandingZip.ts`

### Примечания

- В WP режиме итоговые значения форм определяются ACF-полем `is_gc` на странице WordPress — переменные `$formParmas` разворачиваются уже на сервере WP
- `{{DISCOUNT_UNTIL}}` в превью захардкожена датой — при необходимости обновить в `useLandingPreviewHtml.ts`
- `{{DISCOUNT_UNTIL}}` в S3 вычисляется JS на клиенте через `js-discount-until`