

## Сменить пароль администратора через edge function

### Подход
Создать одноразовую edge function `admin-reset-password`, которая использует Supabase Admin API (`supabase.auth.admin.updateUserById`) для смены пароля. После успешного выполнения — удалить функцию.

### Изменения

**1. Создать `supabase/functions/admin-reset-password/index.ts`**
- Использует `SUPABASE_SERVICE_ROLE_KEY` для создания admin-клиента
- Вызывает `auth.admin.updateUserById(userId, { password })` для пользователя `8e4d5a3b-e62f-46c0-b415-0b118585cd28`
- Пароль: `admin123$`
- Возвращает результат

**2. Деплой и вызов функции**
- Задеплоить функцию
- Вызвать через curl
- Удалить функцию после успешного выполнения

### Итого
- 1 временная edge function (создать → вызвать → удалить)

