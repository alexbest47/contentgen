Проект разрабатывают несколько людей с помощью вайб-кодинга с помощью Claude (Cowork, Code).

Контекст разработки проекта находтися:
- /project_context.md - личный файл контекста разработки главного разработчика проекта - Александра
- /.claude/context/ - личные файлы контекста разработки от других разработчиков
- /.claude/decisions.md - для записи важных глобальных архитектурных решений

## Стек
**Frontend:** React 18 + TypeScript + Vite
**UI:** shadcn/ui (Radix UI) + Tailwind CSS
**Роутинг:** react-router-dom v6
**Данные:** TanStack Query v5 + Supabase JS client
**Тесты:** Vitest (unit), Playwright (e2e)
**Backend:** Supabase
- БД: PostgreSQL (через Supabase)
- Auth: Supabase Auth (управление пользователями)
- Edge Functions: ~40 функций на Deno (папка `/supabase/functions/`)

## Деплой
- **Хостинг:** Vercel, интегрирован с GitHub
- **Production:** автодеплой при push/merge в `main` → https://contentgen.talentsy.ru/
- **Preview:** автодеплой для всех остальных веток (временный URL от Vercel)
- **Репозиторий:** GitHub

## Важно
- Проект создавался через Lovable — часть архитектурных решений сделана им
- Edge Functions деплоятся отдельно через Supabase CLI (`supabase functions deploy`)
- Миграции БД: `/supabase/migrations/`

## Supabase
- **Project ID:** `szlvnesyoydwvtqieazo`
- **Project URL:** `https://szlvnesyoydwvtqieazo.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/szlvnesyoydwvtqieazo


## Правила работы
- При принятии важных архитектурных решений — записывай их в `/.claude/decisions.md`
- Перед началом работы изучай файлы контекста разработчиков

## Работа с Git
- **Никогда не работай в ветке `main` напрямую** — только через feature-ветки и PR
- Перед началом задачи убедись что создана отдельная ветка
- Называй ветки по схеме: `feature/короткое-описание` или `fix/что-чинишь`
- После того как ветка слита в `main` через PR — напомни разработчику удалить её локально и на GitHub
- Если фича не завершена, а ветка уже слита — создавай новую ветку от обновлённого `main`, не продолжай работу в старой. Можно использовать номера веток (v1, v2, ...)