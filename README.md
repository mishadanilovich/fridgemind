# FridgeMind

PWA для планирования питания для семьи (**household**): домашние запасы, рецепты, меню на неделю и общий список покупок в реальном времени. Ключевая фича — фото холодильника → Claude Vision распознаёт продукты → обновляет инвентарь.

**Полное описание продукта, модель данных, все потоки и принятые решения — в [`CLAUDE.md`](./CLAUDE.md).** Это основной источник правды по проекту; README — только про запуск и структуру кода.

## Демо

Живое приложение: **https://fridgemind-app.vercel.app**

Три логина на одном демо-household — один и тот же household по-разному выглядит в зависимости от роли (пароль один для всех):

| Роль | Email | Пароль |
|---|---|---|
| Организатор | `demo@fridgemind.app` | `FridgeDemo2026!` |
| Редактор | `dmitry.demo@fridgemind.app` | `FridgeDemo2026!` |
| Участник | `vera.demo@fridgemind.app` | `FridgeDemo2026!` |

В household уже накручены данные, а не пустая форма: 10 рецептов с фото, частично докупленный инвентарь, спланированная на неделю меню (прошлые дни отмечены «скушано», сегодняшние специально оставлены пустыми — можно кликнуть вживую) и список покупок с частично отмеченным «куплено». Household полностью изолирован от остальных данных в базе.

## Возможности

- **Household + роли** — регистрация, приглашение по ссылке (предлагает вход или регистрацию в зависимости от того, есть ли уже аккаунт), роли Организатор / Редактор / Участник (проверка на бэкенде через Supabase RLS + server actions).
- **Рецепты** — CRUD с пошаговыми инструкциями (фото на каждый шаг), базовым числом порций (степпер с пропорциональным пересчётом ингредиентов), бейджами способа приготовления, поиском по названию/ингредиенту. Soft-delete.
- **Инвентарь** — ручное добавление из справочника ингредиентов с поиском по названию + распознавание нескольких фото холодильника одним запросом к Claude Vision.
- **Меню на неделю** — конструктор по дням с настраиваемыми слотами приёма пищи (drag-and-drop сортировка), просмотр дня («есть дома» / «нужно купить»), отметка «скушано» с отдельным необязательным списанием запасов (степпер порций).
- **Список покупок** — автоагрегация недостающих ингредиентов, фильтр по дням, группировка по категориям, ручные позиции с автоподстановкой единицы/категории, мгновенная отметка «куплено», массовый перенос купленного в запасы, «Поделиться» списком как текстом (Web Share API). Синхронизация в реальном времени между всеми членами household (Supabase Realtime).
- **«Что приготовить из того, что есть»** — рецепты, отсортированные по проценту совпадения с инвентарём.
- **PWA** — устанавливается на телефон, светлая / тёмная / системная тема, офлайн-режим только для чтения (Serwist + Dexie-снапшоты).

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | Next.js 15 (App Router, TypeScript strict) |
| UI | Tailwind CSS + shadcn/ui (примитивы в `components/ui`) |
| БД / Auth / Storage / Realtime | Supabase (PostgreSQL) |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| PWA / офлайн | Serwist (`@serwist/next`) + Dexie.js (IndexedDB) |
| Drag-and-drop | @dnd-kit |
| ИИ-распознавание фото | Claude Vision (`@anthropic-ai/sdk`) |
| Валидация | Zod (формы + ответ Claude Vision) |
| Тесты | Vitest (юнит) + Playwright (e2e) |
| Хостинг | Vercel |

## Установка

```bash
npm install
cp .env.example .env
# заполнить .env (см. ниже)
npm run db:generate
npm run db:migrate
npm run db:seed        # опционально: стартовый справочник ингредиентов
npm run dev
```

### Переменные окружения (`.env`)

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Клиент Supabase (Auth/Realtime) |
| `SUPABASE_SERVICE_ROLE_KEY` | Серверная запись в Storage в обход RLS |
| `DATABASE_URL`, `DIRECT_URL` | Prisma: pooler (pgbouncer) + прямое подключение для миграций |
| `ANTHROPIC_API_KEY` | Claude Vision (распознавание фото) |
| `VISION_DAILY_LIMIT` | Лимит распознаваний в день на household (защита от накрутки счёта) |
| `VISION_MODEL` | Модель распознавания (по умолчанию `claude-haiku-4-5`) |
| `CRON_SECRET` | Авторизация Vercel Cron (очистка фото рецептов) |

> Частые грабли с `DATABASE_URL` (Prisma P1000): `@next/env` раскрывает `$` в пароле — экранируй спецсимволы; после сброса пароля Supabase pooler какое-то время отдаёт старый.

## Скрипты

```bash
npm run dev          # dev-сервер
npm run build        # прод-сборка
npm run start        # запуск прод-сборки
npm run lint         # ESLint (запускается husky pre-commit хуком)
npm run typecheck    # tsc --noEmit
npm run test         # Vitest (юнит-тесты бизнес-логики)
npm run e2e          # Playwright (сквозные сценарии)
npm run db:migrate   # применить миграции (dev)
npm run db:studio    # Prisma Studio
npm run db:seed      # засеять справочник ингредиентов
```

## Тесты

- **Vitest** — бизнес-логика: агрегация списка покупок, пересчёт порций и округление, сравнение «есть/нужно», единицы измерения, парсинг ответа Claude Vision, роли и правила household (`lib/*.test.ts`).
- **Playwright** — критичные сквозные сценарии (`e2e/*.spec.ts`): рецепты, инвентарь, меню, слоты, список покупок, PWA-офлайн.

> PWA-офлайн e2e требует прод-сборки (dev-режим не отдаёт service worker корректно): `npm run build && npm run start -- --port 3100`, затем `E2E_PWA=1 npx playwright test pwa-offline`.

## Структура

```
app/
  (auth)/          login, signup
  (app)/           Сегодня, меню, рецепты, инвентарь, список покупок, профиль
  invite/[code]/   присоединение к household по ссылке
  ~offline/        офлайн-фоллбэк (Serwist precache)
  api/             роуты (в т.ч. cron очистки фото)
  sw.ts            service worker (Serwist)
components/
  ui/              примитивы shadcn/ui
  <домен>/         доменные компоненты (recipes, nav, auth, ...)
  skeletons/       заглушки для loading.tsx
lib/
  actions/<домен>.ts   server actions (мутации)
  queries/<домен>.ts   read-запросы (когда есть шейпинг/переиспользование)
  zod-schemas.ts       Zod-схемы форм и ответа Vision
  offline-db.ts        Dexie-обёртка офлайн-кэша
  supabase.ts, supabase-admin.ts, supabase-browser.ts   клиенты Supabase (сервер/service-role/браузер)
prisma/
  schema.prisma    модель данных (см. CLAUDE.md, раздел 5)
  seed.ts          стартовый справочник ингредиентов
design-prompts/    промпты для Claude Design по экранам/фичам (design-first workflow, см. CLAUDE.md, раздел 9)
```

## Деплой

Хостинг — Vercel. `vercel.json` объявляет cron-задачу `/api/cron/cleanup-recipe-photos` (очистка осиротевших фото рецептов, раз в сутки). Перед деплоем нужно прокинуть все переменные окружения в проект Vercel.

## Конвенции разработки

См. **[`CLAUDE.md`](./CLAUDE.md), раздел 10** — camelCase на фронте / snake_case в БД (`@map`), Zod-валидация всего внешнего, формы через server actions + `useActionState`, примитивы только из `components/ui`, проверка ролей на бэкенде. ESLint запускается автоматически husky pre-commit хуком.
