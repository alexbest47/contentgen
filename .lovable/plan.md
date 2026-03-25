

## Функция «Проверить письмо» — отправка тестового HTML через Resend

Добавить кнопку «Проверить письмо» в хедер конструктора. При нажатии — диалог с полем ввода email-адреса. После подтверждения собирается полный HTML письма (как при экспорте) и отправляется через Edge Function, которая вызывает Resend API.

### Что увидит пользователь

Рядом с кнопкой «Экспортировать HTML» появится кнопка «Проверить письмо». Клик открывает диалог с полем email. После отправки — toast «Письмо отправлено» или ошибка.

### Предварительное условие

Потребуется секрет `RESEND_API_KEY` — запрошу его через инструмент добавления секретов.

### Технические детали

**1. Edge Function: `supabase/functions/send-test-email/index.ts`**
- Принимает `{ html, subject, to, preheader }`.
- Вызывает `https://api.resend.com/emails` с `RESEND_API_KEY`.
- From: `onboarding@resend.dev` (или настраиваемый домен).
- Возвращает результат.

**2. `src/components/email-builder/EmailBuilderHeader.tsx`**
- Добавить prop `onTestEmail: (email: string) => void`, `testingEmail: boolean`.
- Добавить кнопку `Send` (иконка) рядом с «Экспортировать HTML».
- Встроить маленький Dialog с полем email и кнопкой «Отправить».

**3. `src/pages/EmailBuilder.tsx`**
- Добавить функцию `handleTestEmail(email: string)`:
  - Собирает HTML (та же логика что `handleExport`).
  - Вызывает `supabase.functions.invoke("send-test-email", { body: { html, subject, to: email, preheader } })`.
- Состояние `testingEmail`.
- Передать в `EmailBuilderHeader`.

### Файлы
- Секрет `RESEND_API_KEY` — запрос у пользователя
- `supabase/functions/send-test-email/index.ts` — новый
- `src/components/email-builder/EmailBuilderHeader.tsx` — кнопка + диалог
- `src/pages/EmailBuilder.tsx` — логика сборки HTML и вызова функции

