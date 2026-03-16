

## Проблема: все файлы одновременно в статусе "classifying"

Сейчас `deepgram-callback` ставит каждому файлу статус `classifying` сразу после транскрибации. В итоге 10+ файлов одновременно показывают «Классификация...», хотя реально классифицируется только один. Очередь в `classify-case` работает правильно (пропускает, если видит другой файл в `classifying`), но проблема в том, что **все** файлы уже помечены как `classifying`.

### Решение

Ввести промежуточный статус `transcribed` — файл транскрибирован и ожидает классификации. Только `classify-case` переводит файл в `classifying` непосредственно перед отправкой в Claude API.

### Изменения

**1. `deepgram-callback/index.ts`**
- Менять статус на `transcribed` вместо `classifying`

**2. `classify-case/index.ts`**
- Убрать текущую проверку очереди по `classifying`
- Перед началом работы: проверить, есть ли файл в статусе `classifying` (= кто-то уже работает) → если да, выйти
- Перевести текущий файл из `transcribed` в `classifying`
- После завершения (или ошибки): найти следующий файл со статусом `transcribed` и вызвать себя для него

**3. `CaseManagement.tsx`**
- Добавить статус `transcribed` в `STATUS_MAP`: «Ожидает классификации»
- Обновить счётчики прогресса

### Файлы
- `supabase/functions/deepgram-callback/index.ts`
- `supabase/functions/classify-case/index.ts`
- `src/pages/CaseManagement.tsx`

