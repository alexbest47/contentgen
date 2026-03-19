

## Задача

Пользовательские блоки (CTA, разделитель) используют захардкоженные цвета (#6366f1), не учитывая выбранную цветовую гамму письма. Нужно подтягивать акцентный цвет из `preview_colors` схемы.

## Подход

Цветовая схема хранит `preview_colors` — массив hex-цветов. По конвенции `preview_colors[1]` — акцентный цвет (CTA, разделители). Будем использовать его как дефолт для пользовательских блоков.

## Изменения

### 1. `UserBlockSettings.tsx` — принять `colorSchemeId`, загрузить цвета

- Добавить проп `colorSchemeId: string | null`
- Загрузить `preview_colors` через `useQuery` по `colorSchemeId`
- Использовать `preview_colors[1]` как дефолтный цвет CTA кнопки вместо `#6366f1`
- Показывать подсказку «Цвет из гаммы» рядом с color picker

### 2. `BlockSettingsPanel.tsx` — пробросить `colorSchemeId` в `UserBlockSettings`

```tsx
<UserBlockSettings
  block={block}
  colorSchemeId={colorSchemeId}
  onUpdateConfig={(config) => onUpdateConfig(block.id, config)}
/>
```

### 3. `BlockCanvas.tsx` — использовать акцентный цвет схемы для рендера CTA/divider

- Принять проп `colorSchemeId`
- Загрузить `preview_colors` через `useQuery`
- В рендере CTA блока (строка 292): `backgroundColor: block.config.color || accentColor || "hsl(var(--primary))"`
- В рендере divider (строка 282): `borderTop: \`1px solid ${accentColor || "hsl(var(--border))"}\``

### 4. `EmailBuilder.tsx` — пробросить `colorSchemeId` в `BlockCanvas`

Добавить проп `colorSchemeId={colorSchemeId}` в `<BlockCanvas>`.

### 5. Экспорт HTML (строки 437-440 в EmailBuilder.tsx)

В `handleExport` — аналогично использовать акцентный цвет из схемы для CTA и divider, чтобы экспортированный HTML соответствовал превью.

---

5 файлов, ~30 строк изменений.

