

## Задача

Сделать поля «описание» и «изображение (квадрат)» обязательными при создании офферов 4 типов: мини-курс, вебинар, скачай PDF и диагностика.

## Контекст

- Таблица `offers` уже имеет поле `description`, но не имеет `image_url`.
- Таблица `diagnostics` имеет `description`, но не имеет `image_url`.
- Нужен storage bucket для загрузки изображений офферов.
- Мини-курсы, вебинары, скачай PDF создаются через `OfferTypeDetail.tsx` (OfferForm).
- Диагностики создаются через `CreateDiagnostic.tsx`.

## Изменения

### 1. Миграция БД

```sql
-- Добавить image_url в offers
ALTER TABLE public.offers ADD COLUMN image_url text;

-- Добавить image_url в diagnostics
ALTER TABLE public.diagnostics ADD COLUMN image_url text;

-- Создать bucket для изображений офферов
INSERT INTO storage.buckets (id, name, public) VALUES ('offer-images', 'offer-images', true);

CREATE POLICY "Anyone can read offer-images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'offer-images');

CREATE POLICY "Authenticated users can upload offer-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'offer-images');

CREATE POLICY "Authenticated users can update offer-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'offer-images');

CREATE POLICY "Authenticated users can delete offer-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'offer-images');
```

### 2. `src/pages/OfferTypeDetail.tsx` — обновить OfferForm и логику создания/редактирования

- Добавить в `OfferFormProps` поля `description`, `setDescription`, `imageUrl`, `imageFile`, `setImageFile`, `showMediaFields` (boolean — true для mini_course, webinar, download_pdf).
- В форме: если `showMediaFields` — показать поле «Описание» (Textarea, required) и поле загрузки изображения (input type=file, accept="image/*", preview квадрата).
- Состояния: `createDescription`, `createImageFile`, `editDescription`, `editImageFile` + preview.
- В `createMutation`: загрузить файл в bucket `offer-images`, получить public URL, передать `description` и `image_url` при insert.
- В `updateMutation`: аналогично при редактировании.
- Валидация: для типов mini_course/webinar/download_pdf проверять наличие описания и изображения перед submit.

### 3. `src/pages/CreateDiagnostic.tsx` — добавить описание и изображение

- Добавить состояния `description`, `imageFile`, `imagePreview`.
- Добавить в форму поле «Описание» (Textarea, required) и загрузку изображения (квадрат, required).
- В `handleSave`: загрузить файл в bucket `offer-images`, передать `description` и `image_url` при insert в `diagnostics` и `offers`.
- Валидация: проверять наличие описания и изображения.

### UI для загрузки изображения

- Квадратная зона drag/drop или клик для выбора файла.
- Preview загруженного изображения в квадратном формате.
- Подсказка «Загрузите изображение в формате квадрата».

