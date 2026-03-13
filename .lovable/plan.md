

## Добавить кнопку «Сгенерировать лид-магниты» на страницу диагностики

### Суть
На странице `DiagnosticDetail.tsx` добавить кнопку «Сгенерировать лид-магниты», аналогичную той, что есть на `OfferDetail.tsx`. Кнопка создаст проект, привязанный к `offer_id` диагностики, и запустит генерацию лид-магнитов.

### Изменения

**`src/pages/DiagnosticDetail.tsx`**:
- Добавить импорты: `Sparkles` из lucide-react, `useMutation` из react-query, `useAuth` из AuthContext
- Добавить состояния `generatingProject` и `progressText`
- Добавить `generateMutation` (та же логика что в OfferDetail): generate-project-name → insert project → generate-lead-magnets
- Проект привязывается к `diagnostic.offer_id`; если `offer_id` нет — кнопка не показывается
- После успеха — навигация на страницу проекта (`/programs/{programId}/offers/diagnostic/{offerId}/projects/{projectId}`)
- Кнопку разместить в шапке рядом с заголовком диагностики, показывать когда статус `ready` или `draft` (не во время генерации самой диагностики)

