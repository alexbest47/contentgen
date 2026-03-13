

## Проблема

Кнопка «Остановить» меняет статус в БД на `error`, но edge-функция продолжает работать — в цикле генерации изображений (строка 274) нет проверки текущего статуса. Функция продолжает генерировать картинки и в конце перезаписывает статус на `ready`.

## Решение

В цикле генерации изображений добавить проверку статуса диагностики из БД перед каждой итерацией. Если статус стал `error` — прервать цикл и выйти без перезаписи статуса.

### Изменения в `supabase/functions/run-diagnostic-pipeline/index.ts`

**В цикле изображений (строка ~274)**, в начале каждой итерации добавить:

```ts
// Check if generation was cancelled
const { data: currentDiag } = await supabase
  .from("diagnostics")
  .select("status")
  .eq("id", diagnostic_id)
  .single();

if (currentDiag?.status === "error") {
  console.log("[pipeline] Generation cancelled by user, stopping.");
  return new Response(
    JSON.stringify({ success: false, cancelled: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**В финализации (строка ~327)** — та же проверка перед записью `status: "ready"`, чтобы не перезаписать `error` на `ready`.

