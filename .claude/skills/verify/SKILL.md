# Verify: FridgeMind (Next.js + Supabase)

Как прогнать изменение вживую, когда браузер недоступен (claude-in-chrome блокирует localhost).

## Запуск

- `npm run dev` в фоне; порт 3000 часто занят — Next сам берёт 3001, смотреть вывод.
- Все экраны за Supabase-аутентификацией; без cookie страницы редиректят на /login, API отдаёт 401.

## Сессия без браузера

1. Временный пользователь: `@supabase/supabase-js` c `SUPABASE_SERVICE_ROLE_KEY` (из .env) →
   `admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })`.
   Триггер `handle_new_user` сам создаёт household, public.users и 3 стартовых MealSlot.
2. Cookie в формате приложения: `createServerClient` из `@supabase/ssr` с cookie-jar на Map →
   `signInWithPassword` → собрать заголовок `Cookie: name=encodeURIComponent(value); ...`.
3. Скрипты класть временно в `scripts/*.ts` (импорт `../lib/prisma` + `import "dotenv/config"`),
   запускать `npx tsx scripts/<file>.ts`, удалить после. Из scratchpad импорты проекта не резолвятся.
4. Фикстуры (рецепты/меню/запасы) — напрямую через Prisma в том же скрипте.
5. Проверка: `curl -H "Cookie: $COOKIE" http://localhost:3001/<page>` — SSR-HTML грепается по
   текстам; учесть, что React вставляет `<!-- -->` между JSX-выражениями, а часть контента
   уезжает в стриминговый `__next_f`-payload. API — обычный curl.

## Гочи

- Кириллица в `curl -d` из Git Bash на Windows уходит в cp1251 → в БД мойибейк. Это артефакт
  окружения, не приложения; для проверки кириллицы слать тело из файла (`-d @body.json`).
- Консольный вывод кириллицы мойибейкается (cp1251); в python-скриптах ставить
  `PYTHONIOENCODING=utf-8`.
- Уборка: удалить household (cascade заберёт рецепты/меню/списки), public.users, auth-юзера
  через admin API и созданные (не переиспользованные) записи глобального каталога Ingredient.
