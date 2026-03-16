

## Исправление состояния кнопок генерации

### Проблема
Все три кнопки используют общий `progressText` для текста и общий спиннер `generatingProject`. Когда нажата одна кнопка, все три показывают спиннер, а первая кнопка («Сгенерировать лид-магниты») заменяет свой текст на `progressText` (например, «Генерация тем экспертного контента...»), потому что её текст задан как `{progressText || "Сгенерировать лид-магниты"}`.

### Решение
Добавить state `generatingType` (`"lead_magnet" | "reference_material" | "expert_content" | null`) вместо булевого `generatingProject`. Для каждой кнопки:
- Спиннер показывать **только** если `generatingType` совпадает с типом кнопки
- `disabled` — если `generatingType !== null` (любая генерация идёт)
- Текст кнопки **не менять** — каждая кнопка всегда показывает свой фиксированный лейбл

### Файл: `src/pages/OfferDetail.tsx`
1. Заменить `const [generatingProject, setGeneratingProject] = useState(false)` на `const [generatingType, setGeneratingType] = useState<string | null>(null)`
2. В `generateMutation.mutationFn`: `setGeneratingType(contentType)` вместо `setGeneratingProject(true)`
3. В `onSuccess`/`onError`: `setGeneratingType(null)`
4. Каждая кнопка:
   - `disabled={!!generatingType}`
   - Спиннер только при `generatingType === "lead_magnet"` / `"reference_material"` / `"expert_content"`
   - Убрать `progressText` из текста кнопок (оставить только фиксированные лейблы)
5. Можно убрать state `progressText` целиком или оставить только для тостов

