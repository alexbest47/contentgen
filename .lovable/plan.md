

## Email-страница: полная переработка UI + настройки хедера/футера

### Обзор
Текущая EmailView показывает поля как текстовые области. Нужно заменить её на специализированный UI с iframe-превью, HTML-кодом и настройками хедера/футера в админке.

### Изменения

#### 1. Миграция БД: таблица `email_settings`
Создать таблицу для хранения хедера и футера:
```sql
CREATE TABLE public.email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,  -- 'email_header_html', 'email_footer_html'
  setting_value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
-- SELECT для всех authenticated, INSERT/UPDATE только для admin
```

#### 2. `src/components/project/PipelineResultView.tsx` — переписать `EmailView`
- Убрать текущие EditableField-карточки
- Добавить загрузку `email_settings` (header/footer HTML) из БД
- **Вкладка «Превью письма»** (по умолчанию):
  - Серый блок с темой: `Тема: {email_subject}`
  - `<iframe>` шириной 600px по центру, белый фон, тень — рендерит header + body (с подставленным баннером или placeholder) + footer
  - Placeholder для баннера: фиолетовый блок `#F0EDF7` с текстом
- **Вкладка «HTML-код»**:
  - `<pre>` блок, фон `#1A1A2E`, текст `#F5F5F7`, горизонтальный скролл
  - Полный HTML = header + body + footer
  - Кнопка «Скопировать» в правом верхнем углу

#### 3. `src/pages/ContentDetail.tsx` — кнопка «Скопировать HTML»
- Добавить кнопку в верхнюю панель (только для email)
- Копирует полный HTML (header + body с реальным баннером + footer) в буфер

#### 4. `src/pages/EmailSettings.tsx` — новая страница админки
- Два textarea: «Хедер письма (HTML)» и «Футер письма (HTML)»
- Загрузка/сохранение из `email_settings`
- Кнопка «Сохранить»

#### 5. Роутинг и навигация
- `App.tsx`: добавить route `/email-settings` (adminOnly)
- `AppSidebar.tsx`: добавить пункт «Настройки Email» в adminNav

#### 6. Интерфейс EmailJson
Текущий интерфейс: `{ email_subject, email_body, banner_prompt }`. Поле `email_body` уже содержит HTML (или будет содержать `email_body_html` из промпта). Адаптировать парсинг под оба варианта (`email_body` или `email_body_html`).

### Файлы
| Файл | Действие |
|---|---|
| Миграция (email_settings) | Создать |
| `src/components/project/PipelineResultView.tsx` | Переписать EmailView |
| `src/pages/ContentDetail.tsx` | Добавить кнопку «Скопировать HTML» |
| `src/pages/EmailSettings.tsx` | Создать |
| `src/App.tsx` | Добавить route |
| `src/components/AppSidebar.tsx` | Добавить пункт меню |

