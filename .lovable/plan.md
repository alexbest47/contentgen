

## Разделить «Тип контента» и «Канал» в промптах

Сейчас `content_type` хранит и тип контента (lead_magnet, diagnostic), и канал (instagram, telegram, vk, email) в одном поле. Пользователь хочет разделить эти понятия.

### Изменения

**1. Миграция БД** — добавить колонку `channel text` в таблицу `prompts`:
- Перенести значения: промпты с `content_type` = instagram/telegram/vk/email → записать это значение в `channel`, а `content_type` обновить на `lead_magnet` (т.к. пайплайн-промпты относятся к лидмагнитам).

**2. `src/lib/promptConstants.ts`**:
- Разделить `contentTypeLabels` на два словаря:
  - `contentTypeLabels` = `{ lead_magnet: "Лидмагнит", diagnostic: "Диагностика" }`
  - `channelLabels` = `{ instagram: "Instagram", telegram: "Telegram", vk: "ВКонтакте", email: "Email" }`
- Обновить `PromptForm`: добавить поле `channel: string`
- Обновить `emptyForm`, `deriveCategory`, `tabContentTypes` соответственно
- `tabContentTypes` теперь фильтрует по `content_type`, а пайплайн-группировка внутри вкладки «Лидмагнит» — по `channel`

**3. `src/components/prompts/PromptFormDialog.tsx`**:
- Поле «Тип контента» — селект с двумя вариантами: Лидмагнит / Диагностика
- Новое поле «Канал» — селект с вариантами: Без канала / Instagram / Telegram / ВКонтакте / Email (показывать только если тип = lead_magnet)

**4. `src/pages/Prompts.tsx`**:
- Вкладка «Лидмагнит» показывает промпты с `content_type = 'lead_magnet'`, группируя пайплайны по `channel`
- Вкладка «Диагностики» показывает промпты с `content_type = 'diagnostic'`
- Обновить `openEdit` / `openDuplicate` для маппинга поля `channel`
- В `saveMutation` сохранять `channel` в БД

**5. `src/components/prompts/PipelineGroup.tsx`** — группировка по `channel` вместо `content_type`

