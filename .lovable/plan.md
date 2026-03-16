

## Два изменения

### 1. Скрыть кнопку «Сгенерировать карусель» для testimonial_content

**`src/pages/ContentDetail.tsx`** — строка 48: добавить `testimonial_content` в список типов без карусели:
```typescript
const supportsCarousel = !["expert_content", "provocative_content", "testimonial_content"].includes(project?.content_type ?? "");
```

### 2. Сделать название файла кейса кликабельной ссылкой на видео

**`src/pages/ProjectDetail.tsx`** — строки 278-284: заменить текущий блок (file_name + отдельная ссылка «Видео») на единую кликабельную ссылку:
- Если `source_url` есть — `file_name` становится `<a>` ссылкой на видео (с иконкой ExternalLink)
- Если нет — просто текст как сейчас
- Убрать отдельную ссылку «Видео»

