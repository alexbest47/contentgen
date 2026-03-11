

## Генератор маркетингового контента — Этап 1: Ядро системы

### Что входит в этот этап
Базовая структура данных, авторизация, управление программами/мини-курсами/проектами, генерация лид-магнитов.

---

### 1. База данных (Supabase / Lovable Cloud)

**Таблицы:**
- `profiles` — id, full_name, created_at (связь с auth.users)
- `user_roles` — user_id, role (enum: admin, user)
- `paid_programs` — id, title, description, created_by, created_at
- `mini_courses` — id, program_id (FK), title, audience_description, course_description, created_by
- `projects` — id, mini_course_id (FK), title, status (enum: draft, generating_leads, leads_ready, lead_selected, generating_content, completed, error), selected_lead_magnet_id, created_by
- `lead_magnets` — id, project_id (FK), title, promise, description, marketing_angle, call_to_action, infographic_concept, attention_reason, is_selected
- `prompts` — id, name, slug, category, description, provider, model, system_prompt, user_prompt_template, output_format_hint, is_active, created_at

RLS-политики для всех таблиц. Роли через `has_role()` security definer функцию.

---

### 2. Авторизация
- Вход по email/паролю через Supabase Auth
- Автосоздание профиля через триггер
- Первый зарегистрированный — admin (или ручное назначение)
- Страница входа на русском языке

---

### 3. Интерфейс (всё на русском)

**Страницы:**
- **Вход** — форма авторизации
- **Панель управления** — обзор программ и последних проектов
- **Платные программы** — список, создание, редактирование
- **Мини-курсы** — список внутри программы, создание с полями: название, описание аудитории, описание курса
- **Проекты** — список внутри мини-курса, создание, просмотр статуса
- **Страница проекта** — пошаговый интерфейс: генерация лид-магнитов → выбор → (далее в этапе 2)
- **Управление промптами** (только admin) — CRUD промптов с полями из ТЗ, включение/выключение
- **Управление пользователями** (только admin) — список, назначение ролей

**Навигация:** Боковое меню с иконками, адаптивное.

---

### 4. Генерация лид-магнитов (первая AI-фича)

- Edge-функция `generate-lead-magnets`, вызывающая Claude API (ваш ключ)
- Берёт активный промпт из категории "генерация лид-магнитов"
- Подставляет переменные: {{program_title}}, {{mini_course_title}}, {{audience_description}}, {{mini_course_description}}
- Возвращает 3 структурированных лид-магнита
- Сохраняет в таблицу `lead_magnets`
- Пользователь выбирает один → статус проекта обновляется

---

### 5. Управление промптами

- Предзаполненные промпты для всех 10 категорий
- Шаблонные переменные в формате `{{variable}}`
- Admin может редактировать, создавать, включать/выключать
- При генерации система берёт активный промпт нужной категории

---

### Что будет в следующих этапах
- **Этап 2:** Генерация контента (карусель, тексты соцсетей, email, тест JSON)
- **Этап 3:** Генерация изображений + Supabase Storage
- **Этап 4:** Библиотека контента с поиском и фильтрами
- **Этап 5:** Редактирование сгенерированного контента

