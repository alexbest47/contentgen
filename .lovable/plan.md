

## Задача

Для блока `testimonial_content` в правой панели показывать только выбор кейса (без программы, оффера, вариантов, кнопок генерации). Выбранный кейс должен автоматически сохраняться в `email_letters.case_id`.

## Изменения

### 1. `src/components/email-builder/BlockSettingsPanel.tsx`

Добавить отдельную ветку для `testimonial_content` перед `isGeneratedBlock`. Новый компонент `TestimonialCaseSelector` — простой dropdown кейсов из `case_classifications`, без остальных полей.

### 2. Новый компонент `src/components/email-builder/TestimonialCaseSelector.tsx`

Простой компонент:
- Заголовок «Кейс / отзыв»
- Подзаголовок: «Выберите кейс студента. Данные кейса будут использованы при генерации письма»
- Dropdown из `case_classifications` (все кейсы, без фильтра — программа уже выбрана на уровне письма)
- При выборе: вызывает `onChangeCaseId(id)` — пробрасывается наверх

Props: `caseId`, `onChangeCaseId`

### 3. `src/pages/EmailBuilder.tsx`

- Передать в `BlockSettingsPanel` дополнительные пропсы `caseId` и `onChangeCaseId`
- `onChangeCaseId` обновляет состояние `caseId` и сразу сохраняет в БД: `supabase.from("email_letters").update({ case_id: id }).eq("id", letterId)`
- В `BlockSettingsPanel` при `block_type === "testimonial_content"` рендерить `TestimonialCaseSelector` вместо `GeneratedBlockSettings`

### 4. `src/components/email-builder/BlockSettingsPanel.tsx`

Обновить интерфейс Props — добавить `caseId: string | null` и `onChangeCaseId: (id: string | null) => void`. Добавить ветку:

```tsx
block.block_type === "testimonial_content" ? (
  <TestimonialCaseSelector caseId={caseId} onChangeCaseId={onChangeCaseId} />
)
```

