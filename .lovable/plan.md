

## Детальные статусы с отображением времени обработки

### Проблема

Deepgram Callback API не отправляет промежуточных обновлений — только финальный результат. Поэтому реальный прогресс-бар (30%, 50%...) для транскрибации невозможен. Но можно показать **сколько времени файл находится в текущем статусе**, чтобы пользователь видел, что процесс идёт.

### Решение

**1. Миграция: добавить `status_updated_at` в `case_files`**
- Новый столбец `status_updated_at timestamptz` — обновляется при каждой смене статуса
- Позволяет UI показывать «Транскрибация... 3 мин 12 сек»

**2. Обновить edge-функции**
- `transcribe-case-file`: записывать `status_updated_at: new Date().toISOString()` при каждом `update`
- `deepgram-callback`: то же при записи `completed`

**3. Обновить UI (`CaseManagement.tsx`)**
- Для активных статусов (`downloading`, `transcribing`) показывать таймер с elapsed time, обновляемый каждую секунду
- Добавить более информативные подписи:
  - `pending` → «В очереди»
  - `downloading` → «Получение ссылки на скачивание... X мин Y сек»
  - `transcribing` → «Транскрибация в Deepgram... X мин Y сек» + пульсирующая анимация
  - `completed` → «Готово»
  - `error` → «Ошибка: сообщение»
- Для `transcribing` показать анимированный индикатор (пульсирующая полоска) вместо статичного бейджа, чтобы было видно что процесс жив

### Файлы
- Миграция: `status_updated_at`
- `supabase/functions/transcribe-case-file/index.ts` — добавить `status_updated_at`
- `supabase/functions/deepgram-callback/index.ts` — добавить `status_updated_at`
- `src/pages/CaseManagement.tsx` — таймер elapsed time + улучшенные статусы

