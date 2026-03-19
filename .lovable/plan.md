

## Задача

Правая панель до генерации: обязательный выбор кейса (фильтр по программе, без опции «Без кейса»). Кнопка генерации остаётся в хедере, но `disabled` пока кейс не выбран.

## Изменения

### 1. `src/components/email-builder/LetterGenerationPanel.tsx`

**Pre-generation mode** (строки 141-163):
- Заголовок: «Выберите кейс»
- Подзаголовок: «История кейса — основа письма. Без кейса письмо не будет содержать реальную историю студента»
- Убрать опцию «Без кейса» из dropdown — поле обязательное
- Фильтровать кейсы по `programId`: запрос `.eq("program_id", programId)`, `enabled: !!programId`

### 2. `src/components/email-builder/EmailBuilderHeader.tsx`

Добавить проп `canGenerate: boolean`. Кнопка «Сгенерировать письмо» получает `disabled={generatingLetter || !canGenerate}`.

### 3. `src/pages/EmailBuilder.tsx`

Передать в `EmailBuilderHeader` проп `canGenerate={!!caseId}`.

