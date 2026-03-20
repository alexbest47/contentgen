

## Убрать «Дата подтверждена», отключать дату при автовебинаре

### Изменения

**`src/pages/OfferTypeManagement.tsx`**

1. Удалить все state и использования `isDateConfirmed` / `is_date_confirmed` (create/edit/reset/openEdit/save)
2. Удалить блок чекбокса «Дата и время подтверждены» (строки 479-486)
3. В `onCheckedChange` автовебинара: при включении сбрасывать `webinarDate` в `undefined`; при выключении — ничего
4. Дизейблить Popover/DatePicker для «Дата проведения» когда `isAutowebinar === true`
5. В мутациях create/update: `webinar_date` передавать `null` если `isAutowebinar`
6. `is_date_confirmed` передавать как `false` всегда (или убрать из мутации — колонка имеет default false)

**`src/pages/PromptVariables.tsx`**

- Убрать `is_date_confirmed` из JSON `{{webinar_data}}`

### Итого
- 2 файла, ~15 строк удалено/изменено

