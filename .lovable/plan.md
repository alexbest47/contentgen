

## Задача

1. Убрать кнопку «Сгенерировать письмо» из правой панели (она уже есть в хедере).
2. Исправить баг: пользовательские блоки не загружаются после обновления страницы.

## Анализ бага

В `EmailBuilder.tsx` (строки 127-140) есть гонка состояний при загрузке блоков:

```text
useEffect: dbBlocks
  if (dbBlocks && !initialLoadRef.current) return;  ← ПРОБЛЕМА
```

`initialLoadRef.current` начинается как `false`. Если `dbBlocks` загрузится **раньше** чем `letter`, условие `!initialLoadRef.current` будет `true` → эффект выходит, блоки **не устанавливаются**. Когда позже загружается `letter` и ставит `initialLoadRef = true`, эффект блоков уже не перезапускается (зависимость `dbBlocks` не менялась).

Блоки при этом **сохраняются** в БД корректно (через `addBlock` и `save`), но после обновления страницы не отображаются.

## Изменения

### 1. `src/pages/EmailBuilder.tsx` — исправить загрузку блоков

Строки 127-140: убрать зависимость от `initialLoadRef` при загрузке блоков. Блоки должны загружаться всегда когда приходят из БД, но не перезаписывать локальное состояние после начальной загрузки. Использовать отдельный ref `blocksLoadedRef`:

```js
const blocksLoadedRef = useRef(false);

useEffect(() => {
  if (dbBlocks && !blocksLoadedRef.current) {
    setBlocks(dbBlocks.map(...));
    blocksLoadedRef.current = true;
  }
}, [dbBlocks]);
```

### 2. `src/components/email-builder/LetterGenerationPanel.tsx` — убрать кнопку генерации

Строки 177-194 (секция «Generate» в pre-generation mode): убрать кнопку «Сгенерировать письмо» и сопроводительный текст. Оставить только выбор кейса.

Строки 137-150 (секция в post-generation mode): убрать кнопку «Перегенерировать письмо» — она дублирует хедер.

