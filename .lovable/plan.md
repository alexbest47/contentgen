

## Добавить переменную `{{case_angle}}` в справочник

Добавить в секцию «Контент-отзыв» на странице `/prompt-variables` новую переменную:

| Переменная | Описание | Источник |
|---|---|---|
| `{{case_angle}}` | Полный JSON выбранного угла подачи кейса (angle_type, angle_title, hook, key_idea, transition_to_offer) | Выбранный lead_magnet для testimonial_content |

### Файл
- `src/pages/PromptVariables.tsx` — добавить строку в массив `variables` секции «Контент-отзыв»

