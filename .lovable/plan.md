

## Убрать публичный лендинг, добавить просмотр лендинга внутри приложения

### Суть
Убираем публичный маршрут `/l/:slug` и кнопки «Открыть лендинг» / «Копировать ссылку». Вместо них — одна кнопка «Просмотр», которая ведёт на внутреннюю страницу `/pdf-materials/:id`, где в двух табах отображаются: лендинг (iframe) и PDF (iframe). С возможностью экспорта HTML для каждого.

### Изменения

**1. `src/App.tsx`**
- Удалить импорт `PublicLanding` и маршрут `/l/:slug`

**2. `src/pages/PublicLanding.tsx`** — удалить файл

**3. `src/pages/PdfMaterials.tsx`**
- Убрать кнопки Globe (лендинг) и Copy (копировать ссылку) из действий
- Убрать `copyLink` функцию и импорт `Globe`, `Copy`
- Оставить одну кнопку «Просмотр» (иконка `Eye`) → navigate(`/pdf-materials/${m.id}`)
- В `handleSuccess` убрать ссылку на `/l/`, просто toast «PDF-материал сгенерирован!»

**4. `src/pages/PdfMaterialView.tsx`** — переделать
- Два таба (Tabs): «Лендинг» и «PDF-материал»
- Таб «Лендинг»: iframe с `landing_html` (с заменой BACKGROUND_IMAGE_URL), кнопка «Экспорт HTML лендинга» (скачивает landing_html как .html файл)
- Таб «PDF-материал»: iframe с `html_content`, кнопки «Скачать PDF» (print) и «Экспорт HTML» (скачивает html_content как .html)
- Кнопка «Назад» остаётся

### Итого
- 1 файл удалён (`PublicLanding.tsx`)
- 3 файла изменены (`App.tsx`, `PdfMaterials.tsx`, `PdfMaterialView.tsx`)

