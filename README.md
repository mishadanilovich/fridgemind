# FridgeMind

PWA для планирования меню, домашних запасов и списка покупок для семьи (household).

Полное описание продукта, модели данных, всех потоков и принятых решений — в `CLAUDE.md` в корне проекта. Этот файл читает Claude Code как основной источник правды при разработке — начинай любую сессию с ним с "прочитай CLAUDE.md" или полагайся на то, что Claude Code подхватит его автоматически.

## Что уже в этом скелете

- Next.js App Router + TypeScript (`strict`), Tailwind CSS
- Serwist (`app/sw.ts`, `next.config.mjs`) — PWA/офлайн-слой
- Prisma-схема (`prisma/schema.prisma`) — полная модель данных из CLAUDE.md, раздел 5
- Zod-схемы (`lib/zod-schemas.ts`) — валидация форм и ответа Claude Vision API
- Заглушки 6 экранов (`app/`) с TODO-комментариями, указывающими на нужный раздел CLAUDE.md
- Заглушки API-роутов (`app/api/*`) с комментариями про роли/RLS, где это важно
- Dexie-обёртка для офлайн-кэша (`lib/offline-db.ts`)
- Supabase-клиенты для браузера и сервера (`lib/supabase.ts`)

Ничего из этого не реализовано полностью — это стартовая точка, а не готовые фичи. Задача Claude Code — наполнить эти файлы реальной логикой по этапам из CLAUDE.md, раздел 8.

## Установка

```bash
npm install
cp .env.example .env
# заполнить .env: Supabase URL/anon key, DATABASE_URL/DIRECT_URL, ANTHROPIC_API_KEY
npm run db:generate
npm run db:migrate
npm run dev
```

## Дизайн

Макеты экранов уже накиданы в Claude Design (research preview, claude.ai/design) — см. промпт-файлы `claude-design-*.md`, если они лежат рядом с проектом. Экспортируй итоговый макет из Claude Design прямо в Claude Code и попроси сверстать по нему поверх текущих заглушек экранов.

## Порядок разработки

Следуй этапам из CLAUDE.md, раздел 8 (0 → 10): дизайн → фундамент (Next.js/Supabase/Prisma) → auth+household+роли → профиль → рецепты → инвентарь → меню на неделю → список покупок → real-time → PWA → полировка.

Перед тем как просить Claude Code писать код — стоит явно передать ему `CLAUDE.md` и попросить придерживаться раздела 10 ("Технические соглашения разработки": camelCase/snake_case маппинг, Zod-валидация всего внешнего, тесты Vitest/Playwright по мере готовности фич).
