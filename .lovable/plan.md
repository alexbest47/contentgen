

## Добавить цвета в селект бренд-стиля в CreatePdfWizard

### Что делаем
В выпадающем списке «Бренд-стиль» на шаге 2 wizard-а показывать цветные кружки/полоски рядом с названием каждой схемы.

### Изменения

**`src/components/pdf/CreatePdfWizard.tsx`**
1. В запросе `color_schemes` добавить `preview_colors` в select: `"id, name, description, preview_colors"`
2. В `SelectItem` для каждой схемы добавить inline цветовые кружки из `s.preview_colors` (массив hex-строк) — аналогично `ColorPreview` из PromptVariables:
   ```
   <SelectItem key={s.id} value={s.id}>
     <div className="flex items-center gap-2">
       <div className="flex gap-0.5">
         {s.preview_colors?.map((c, i) => (
           <div key={i} className="w-3 h-3 rounded-full border" style={{ backgroundColor: c }} />
         ))}
       </div>
       {s.name}
     </div>
   </SelectItem>
   ```

### Итого
- 1 файл изменён, ~5 строк

