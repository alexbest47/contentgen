

## Обработка больших файлов — асинхронная транскрибация через Deepgram Callback

### Проблема

Сейчас `transcribe-case-file` отправляет URL в Deepgram и **ждёт ответа**. Для файла в 1 ГБ Deepgram может обрабатывать 5–15 минут, а edge-функция имеет таймаут ~60 сек → timeout error.

### Решение — Deepgram Callback API

Deepgram поддерживает параметр `callback` — вместо ожидания ответа, Deepgram сам отправит результат на наш endpoint когда закончит. Это полностью убирает проблему таймаута.

```text
transcribe-case-file          deepgram-callback
    │                              │
    ├─ POST Deepgram               │
    │  (url + callback param)      │
    ├─ Response: 200 (accepted)    │
    │  ← функция завершается       │
    │       за 2-3 сек             │
    │                              │
    │  ... Deepgram обрабатывает   │
    │       5-15 минут ...         │
    │                              │
    │                   POST ──────┤
    │                   (результат)│
    │                              ├─ Сохраняет транскрипт
    │                              ├─ Запускает следующий файл
    │                              └─ done
```

### Изменения

**1. Новая edge-функция: `deepgram-callback`**
- Принимает POST от Deepgram с результатом транскрибации
- Извлекает `file_id` и `job_id` из query-параметров callback URL
- Сохраняет `transcript_text` и `transcript_json` в `case_files`
- Запускает цепочку: вызывает `transcribe-case-file` для следующего pending файла
- Когда файлов не осталось — ставит job в `completed`
- `verify_jwt = false` (Deepgram не может передать JWT)

**2. Изменение `transcribe-case-file`**
- Убрать ожидание ответа от Deepgram
- Добавить `callback` параметр в URL Deepgram:
  ```
  https://api.deepgram.com/v1/listen?callback=<our-callback-url>&model=nova-2&language=ru...
  ```
- Callback URL: `${supabaseUrl}/functions/v1/deepgram-callback?file_id=X&job_id=Y`
- Функция завершается сразу после отправки запроса (2-3 сек вместо минут)
- Убрать self-chaining из этой функции — теперь цепочку продолжает callback

**3. `supabase/config.toml`**
- Добавить `[functions.deepgram-callback]` с `verify_jwt = false`

### Безопасность callback

Deepgram не поддерживает подпись запросов, но мы можем:
- Проверять что `file_id` существует и имеет статус `transcribing`
- Принимать данные только если файл действительно ожидает результат

### Итого: 1 новая функция + 1 правка существующей + config.toml

