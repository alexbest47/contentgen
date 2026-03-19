

## Задача

При клике на блок «Кейс / отзыв» (testimonial_content) в canvas ничего не происходит — `isTemplateLocked` блокирует выбор. Нужно: при клике на этот блок сразу открывать модальное окно `CasePickerDialog`.

## Изменения

### `src/pages/EmailBuilder.tsx`

1. Добавить состояние `casePickerOpen` (boolean).
2. Импортировать `CasePickerDialog`.
3. В `onSelectBlock` — если блок `testimonial_content`, вместо `return` открывать `setCasePickerOpen(true)`.
4. Рендерить `<CasePickerDialog>` с привязкой к `casePickerOpen` и `handleChangeCaseId`.

### `src/components/email-builder/BlockSettingsPanel.tsx`

5. Убрать ветку `testimonial_content` с `TestimonialCaseSelector` — вместо неё показывать сообщение «Нажмите на блок для выбора кейса» или вообще не показывать панель для этого типа (блок остаётся залоченным, настройки не нужны).

### `src/components/email-builder/TestimonialCaseSelector.tsx`

6. Удалить файл — больше не используется.

---

3 файла: 2 правки, 1 удаление.

