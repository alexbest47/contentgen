

## Добавление типа контента «Отработка возражения» (objection_handling)

Три блока: таблица возражений + страница управления, новый тип контента в пайплайне (по аналогии с `testimonial_content`), вкладка промптов.

---

### 1. База данных (3 миграции)

**1a.** Новый enum value:
```sql
ALTER TYPE public.prompt_category ADD VALUE 'objection_handling';
```

**1b.** Таблица `objections`:
```sql
CREATE TABLE public.objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  objection_text text NOT NULL,
  tags text[] DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.objections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view objections" ON public.objections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert objections" ON public.objections FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner or admin can update" ON public.objections FOR UPDATE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin can delete" ON public.objections FOR DELETE TO authenticated USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));
```

**1c.** Новая колонка в `projects`:
```sql
ALTER TABLE public.projects ADD COLUMN selected_objection_id uuid;
```

---

### 2. Страница «Работа с возражениями» (`src/pages/Objections.tsx`)

Роут: `/programs/:programId/objections` (admin-only, внутри AppLayout).

Интерфейс:
- Шапка с названием программы (запрос `paid_programs` по `programId`)
- Таблица возражений с inline-редактированием, удалением, тегами (Badge)
- Поиск по тексту, пагинация по 20
- Кнопка «+ Добавить возражение» — новая строка
- Кнопка «Импорт JSON» — file picker `.json`, диалог «Добавить / Заменить», валидация, toast

---

### 3. Роутинг и навигация

- **`src/App.tsx`**: добавить маршрут `/programs/:programId/objections` → `<Objections />`
- **`src/components/AppSidebar.tsx`**: добавить в `contentPrepNav`: `{ title: "Работа с возражениями", url: "/objections", icon: ShieldQuestion }`  
  (Примечание: страница привязана к программе, но в сайдбаре — общий вход; навигация к конкретной программе через ProgramDetail)
- **`src/pages/ProgramDetail.tsx`**: добавить кнопку/ссылку «Работа с возражениями» → `/programs/{programId}/objections`

---

### 4. Константы (`src/lib/promptConstants.ts`)

- `categoryLabels`: `objection_handling: "Отработка возражения"`
- `contentTypeLabels`: `objection_handling: "Отработка возражения"`
- `deriveCategory`: `if (contentType === "objection_handling") return "objection_handling";`

---

### 5. Edge-функция `generate-lead-magnets`

- `promptCategory` маппинг: `content_type === "objection_handling" ? "objection_handling"`
- Принимает `selected_objection_id` из body
- Загружает возражение из `objections`, подставляет `{{objection_data}}` (JSON: {id, objection_text, tags})
- Парсинг результата (3 угла): `angle_title`→`title`, `angle_type`→`visual_format`, `description`→`visual_content`, `hook`→`instant_value`, `transition_to_offer`→`transition_to_course`

---

### 6. Edge-функция `generate-pipeline`

- Добавить `{{objection_data}}` — JSON выбранного возражения (из `projects.selected_objection_id` → `objections`)
- Добавить `{{objection_angle}}` — контекст выбранного угла (аналогично `{{case_angle}}`)
- Добавить оба `.replace()` в подстановку

---

### 7. Edge-функция `generate-content`

- Добавить `.replace()` для `{{objection_data}}` и `{{objection_angle}}`

---

### 8. Страница оффера (`src/pages/OfferDetail.tsx`)

- Добавить `"objection_handling"` в union type `generateMutation`
- Для `objection_handling` — пропуск генерации лид-магнитов (как `testimonial_content`): пользователь сначала выбирает возражение
- Добавить бейдж `"Отработка возражения"` в списке проектов
- Добавить кнопку «Сгенерировать отработку возражения»

---

### 9. Страница проекта (`src/pages/ProjectDetail.tsx`)

- Статусные лейблы для `objection_handling`:
  - `draft`: "Выберите возражение"
  - `generating_leads`: "Генерация углов подачи..."
  - `leads_ready`: "Выберите угол подачи"
  - `lead_selected`: "Угол подачи выбран"
- Блок выбора возражения (список из `objections` с поиском по тексту и фильтром по тегам) — при `status === "draft"`
- Мутация `selectObjectionMutation`: сохраняет `selected_objection_id`, вызывает `generate-lead-magnets` с `{ content_type: "objection_handling", selected_objection_id }`
- Карточки углов: Тип угла, Описание, Крючок, Переход к офферу
- Показ выбранного возражения в карточке (текст + теги)

---

### 10. Страница контента (`src/pages/ContentDetail.tsx`)

- `objection_handling` → статичное изображение (без карусели)

---

### 11. Страница промптов (`src/pages/Prompts.tsx`)

- Фильтр `objectionHandlingPrompts`
- `renderObjectionHandlingTab()` (копия `renderMythBustingTab`)
- `<TabsTrigger value="objection_handling">Отработка возражения</TabsTrigger>` + `<TabsContent>`

---

### 12. Переменные промптов (`src/pages/PromptVariables.tsx`)

- Секция «Отработка возражения» с переменными `{{objection_data}}` и `{{objection_angle}}`

---

### 13. Пустые промпты (insert в prompts)

| name | slug | content_type | channel | category |
|---|---|---|---|---|
| Генерация углов отработки возражения | objection-handling-topics | objection_handling | NULL | objection_handling |
| Отработка возражения: Instagram | objection-handling-instagram | objection_handling | instagram | objection_handling |
| Отработка возражения: Telegram | objection-handling-telegram | objection_handling | telegram | objection_handling |
| Отработка возражения: VK | objection-handling-vk | objection_handling | vk | objection_handling |
| Отработка возражения: Email | objection-handling-email | objection_handling | email | objection_handling |

---

### Порядок реализации
1. Миграции БД (enum + таблица + колонка)
2. Страница Objections + роутинг + сайдбар + ссылка из ProgramDetail
3. Константы promptConstants
4. Edge-функции (generate-lead-magnets, generate-pipeline, generate-content) + деплой
5. Фронтенд: OfferDetail, ProjectDetail, ContentDetail, Prompts, PromptVariables
6. Вставка пустых промптов

