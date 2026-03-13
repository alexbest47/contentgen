

## Добавить кнопку «Остановить» во время генерации

### Что делаем

Добавляем кнопку «Остановить» в карточку прогресса генерации (`DiagnosticDetail.tsx`), которая:
1. Обновляет статус диагностики на `"error"` с пометкой `"Остановлено пользователем"` в `generation_progress`
2. Останавливает polling
3. Показывает toast

### Изменения в `src/pages/DiagnosticDetail.tsx`

- Импортировать иконку `Square` (или `StopCircle`) из `lucide-react`
- Добавить состояние `stopping` для блокировки кнопки на время запроса
- Добавить функцию `handleStop`:
  ```ts
  const handleStop = async () => {
    setStopping(true);
    await supabase.from("diagnostics")
      .update({ status: "error", generation_progress: { error: "Остановлено пользователем" } })
      .eq("id", diagnosticId);
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    queryClient.invalidateQueries({ queryKey: ["diagnostic", diagnosticId] });
    toast.info("Генерация остановлена");
    setStopping(false);
  };
  ```
- В секцию прогресса (после progress bar, ~строка 484) добавить кнопку:
  ```tsx
  {isGenerating && (
    <Button variant="destructive" size="sm" onClick={handleStop} disabled={stopping}>
      <Square className="h-4 w-4 mr-2" /> Остановить
    </Button>
  )}
  ```

Edge-функция продолжит работать в фоне, но результат будет проигнорирован — при записи в БД статус уже будет `error`, и фронтенд не покажет результат как `ready`.

