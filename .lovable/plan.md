
## Исправление: генерация сохраняет результат в task_queue, но не в email_letters

### Проблема

Результат генерации присутствует в `task_queue.result` (полный HTML), но `email_letters.generated_html` пуст (длина 0), при этом `status = "ready"`. Это указывает на то, что edge-функция `generate-email-letter` не была фактически передеплоена с исправлениями `freshSb`, либо update выполняется без проверки ошибки.

### Решение

Добавить проверку ошибки при обновлении `email_letters` и логирование, затем передеплоить функцию.

### Изменения

#### 1. `generate-email-letter/index.ts` — строки 350-355

Заменить тихий `await freshSb.from(...).update(...)` на вариант с проверкой ошибки и логированием:

```typescript
const freshSb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
console.log("Updating email_letters", letter_id, "html length:", html.length);
const { error: updateErr } = await freshSb.from("email_letters").update(updatePayload).eq("id", letter_id);
if (updateErr) {
  console.error("Failed to update email_letters:", updateErr);
}

const responseData = { html, image_placeholders: imagePlaceholders, email_subject: emailSubject, email_preheader: emailPreheader };
if (taskId) await completeTask(taskId, responseData);
```

#### 2. Передеплоить `generate-email-letter`

Принудительный redeploy, чтобы гарантировать использование актуального кода с `freshSb`.

### Итого
- 1 файл — добавить логирование и проверку ошибки
- 1 redeploy
