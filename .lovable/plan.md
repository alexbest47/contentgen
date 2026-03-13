

## Перестройка генерации диагностики: 3 отдельных блока

### Суть изменений

Claude возвращает JSON с тремя ключами: `quiz`, `thankYouPage`, `diagnosticCardPrompt`. Плейсхолдеры изображений заменяются только внутри `quiz`. Все три части сохраняются отдельно в БД и показываются как три блока с кнопками копирования/скачивания.

### 1. Миграция БД

Добавить два новых столбца в `diagnostics`:
```sql
ALTER TABLE diagnostics ADD COLUMN thank_you_json jsonb;
ALTER TABLE diagnostics ADD COLUMN card_prompt text;
```

### 2. Edge-функция `run-diagnostic-pipeline/index.ts`

После парсинга ответа Claude:
- Извлечь `quizJson.quiz`, `quizJson.thankYouPage`, `quizJson.diagnosticCardPrompt`
- Плейсхолдеры `{{IMAGE:PROMPT=...}}` искать только в `JSON.stringify(quiz)`
- При сохранении в БД: `quiz_json` = финальный quiz, `thank_you_json` = thankYouPage, `card_prompt` = diagnosticCardPrompt
- Финализация: сохранять все три поля

### 3. Страница `DiagnosticDetail.tsx`

Раздел результата (status === "ready") — вместо одного блока JSON показать три карточки:

**Блок 1 — JSON теста**
- Содержимое `diagnostic.quiz_json`
- Кнопки «Скопировать» и «Скачать JSON» (файл `quiz.json`)

**Блок 2 — JSON страницы «Спасибо»**
- Содержимое `diagnostic.thank_you_json`
- Кнопки «Скопировать» и «Скачать JSON» (файл `thank_you.json`)

**Блок 3 — Промпт диагностической карты**
- Содержимое `diagnostic.card_prompt` (текст, не JSON)
- Кнопка «Скопировать»

### Что НЕ меняется

- Форма создания (`CreateDiagnostic.tsx`) — без изменений
- Черновик и редактирование — без изменений
- Прогресс генерации — та же логика (3 шага), только плейсхолдеры ищутся в quiz-части

