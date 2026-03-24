

## Модуль «Библиотека баннеров»

Большая фича: новый раздел для хранения, загрузки и генерации баннеров с интеграцией в конструктор писем.

---

### 1. База данных — новая таблица `banners`

Миграция создаёт таблицу:

```sql
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  banner_type text NOT NULL, -- header_banner | case_card | program_banner
  category text NOT NULL, -- paid_program | offer
  program_id uuid REFERENCES public.paid_programs(id) ON DELETE SET NULL,
  offer_type text, -- для категории "offer"
  color_scheme_id uuid REFERENCES public.color_schemes(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  source text NOT NULL DEFAULT 'uploaded', -- uploaded | generated
  generation_prompt text,
  note text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
-- RLS: authenticated SELECT, owner/admin INSERT/UPDATE/DELETE
```

---

### 2. Навигация и маршрутизация

- **AppSidebar.tsx**: добавить «Библиотека баннеров» (иконка `ImageIcon`) первым пунктом в группу `contentPrepNav`, URL `/banner-library`
- **App.tsx**: добавить маршрут `/banner-library` → `<BannerLibrary />` (adminOnly)

---

### 3. Страница `src/pages/BannerLibrary.tsx`

Основная страница со следующей структурой:

- **Заголовок** + кнопка «+ Добавить баннер»
- **Вкладки**: «Платные программы» / «Офферы»
- **Фильтры**: Программа/Тип оффера, Тип баннера, Цветовая гамма (с цветовыми чипами)
- **Сетка карточек** (3 колонки desktop, 2 tablet): превью с правильными пропорциями (600×200, 600×240, 600×220), название, метаданные, меню [...] (редактировать / удалить)
- **Пустые состояния**: пустая библиотека, нет результатов по фильтрам

---

### 4. Модальное окно «Добавить баннер» — компонент `AddBannerDialog.tsx`

Два таба:

**Таб «Загрузить»**: название, тип баннера, drag-and-drop зона (JPG/PNG/WebP, ≤5MB), валидация размеров изображения по типу, категория (radio: программа/оффер → условный select), цветовая гамма, заметка. Загрузка в storage bucket `generated-images`.

**Таб «Сгенерировать»**: те же метаданные + textarea с предзаполненным промптом-шаблоном по типу баннера (шаблоны из раздела 6 ТЗ). Кнопка «Сбросить к шаблону». Переменная `{{image_style}}` подставляется из `prompt_global_variables`. Генерация через `generate-email-letter` edge function (payload с `generate_banner: true`) или отдельную функцию — используем существующий паттерн с OpenRouter + Gemini image model. Состояния: loading → preview + «Сохранить» / «Перегенерировать» → error.

---

### 5. Модальное окно «Редактировать метаданные» — компонент `EditBannerDialog.tsx`

Редактируемые: название, тип баннера, категория/программа/оффер, цветовая гамма, заметка.
Только для просмотра: источник, дата, промпт генерации (collapsible).

---

### 6. Edge function `generate-banner-image`

Новая edge-функция:
- Получает `{ prompt, banner_type, color_scheme_id, _task_id }`
- Загружает `{{image_style}}` из `prompt_global_variables`
- Загружает описание цветовой гаммы из `color_schemes`
- Собирает финальный промпт: PREAMBLE + image_style + пользовательский промпт
- Вызывает OpenRouter Gemini image model (как в `generate-image`)
- Загружает результат в `generated-images` bucket
- Возвращает `{ image_url }`
- Поддержка task queue (completeTask/failTask)

---

### 7. Интеграция с конструктором писем

- **BlockCanvas.tsx**: рядом с кнопками генерации/загрузки для каждого placeholder добавить кнопку «📁» (выбрать из библиотеки)
- **Новый компонент `BannerPickerDialog.tsx`**: модальное окно-пикер с вкладками, фильтрами (автофильтр по типу баннера из placeholder), сетка карточек 2 колонки. Клик → подставить `image_url` в placeholder.
- **EmailBuilder.tsx**: добавить state для пикера, передать callback в BlockCanvas

Маппинг placeholder → тип баннера:
- `image_placeholder_1` → `header_banner`
- `image_placeholder_2` → `case_card`
- `image_placeholder_3`, `image_placeholder_4` → `program_banner`

---

### Файлы (создать/изменить)

| Действие | Файл |
|----------|------|
| Миграция | `banners` таблица + RLS |
| Создать | `src/pages/BannerLibrary.tsx` |
| Создать | `src/components/banners/AddBannerDialog.tsx` |
| Создать | `src/components/banners/EditBannerDialog.tsx` |
| Создать | `src/components/banners/BannerPickerDialog.tsx` |
| Создать | `supabase/functions/generate-banner-image/index.ts` |
| Изменить | `src/components/AppSidebar.tsx` — новый пункт меню |
| Изменить | `src/App.tsx` — новый маршрут |
| Изменить | `src/components/email-builder/BlockCanvas.tsx` — кнопка «из библиотеки» |
| Изменить | `src/pages/EmailBuilder.tsx` — state + callback для пикера |

