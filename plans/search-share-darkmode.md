# План: поиск · «Поделиться» списком · тёмная тема

Три независимые фичи из отложенного черновика (стэш `wip: master CLAUDE.md edit`). Спека уже
обновлена: раздел 3 пункты 2/3 (поиск) и 13/14 (поделиться, тёмная тема), раздел 6 (экраны +
Профиль). Дизайн готов в Claude Design (проект «FridgeMind мобильный интерфейс»,
`FridgeMind.dc.html`).

Фичи независимы — можно идти в любом порядке. Рекомендуемый порядок: **поиск → поделиться →
тёмная тема** (тёмная последней, т.к. трогает все экраны и выигрывает от того, что остальное
уже стабильно). Каждая фича — **своя ветка и свой PR** (см. память «Always branch and PR»).

Перед вёрсткой каждого экрана — открыть его в Claude Design (`DesignSync` → `list_files` →
`get_file` для `FridgeMind.dc.html`), брать палитру/типографику/состояния оттуда, собирать из
примитивов `components/ui`, без инлайн-стилей (CLAUDE.md §9).

---

## Этап 1 — Поиск на «Рецепты» и «Запасы»

Ветка: `feat/search-recipes-pantry`

### 1.1 Бэкенд: названия ингредиентов в карточке рецепта
Поиск по рецептам — по названию **и по ингредиенту**, но `RecipeCardView` сейчас не несёт имён
ингредиентов (`lib/types.ts:61` — только `matchHave/matchTotal`).
- [ ] `lib/queries/recipes.ts` (`getRecipeCards`): в `include.ingredients` добавить
      `include: { ingredient: { select: { name: true } } }`, собрать `ingredientNames: string[]`
      (в нижнем регистре).
- [ ] `lib/types.ts`: добавить в `RecipeCardView` поле `ingredientNames: string[]`.
- [ ] Проверить, что снапшот офлайна (`OfflineSnapshot` для `recipeLists`) переживает новое поле —
      оно просто едет вместе с картами.

### 1.2 Чистая логика фильтра (тестируемая)
- [ ] `lib/search.ts`: `matchesQuery(haystack: string[], query: string): boolean` — нормализация
      (trim, toLowerCase), пустой запрос → всё проходит. Одна функция на оба экрана.
- [ ] Тест `lib/search.test.ts` (Vitest): пустой запрос, регистр, частичное совпадение, совпадение
      по ингредиенту, отсутствие совпадений.

### 1.3 Экран «Рецепты»
Поиск — контролируемое поле (CLAUDE.md §10 явно разрешает контролируемые поля для поиска),
фильтрация на клиенте по уже загруженным картам.
- [ ] `components/recipes/RecipeBrowser.tsx` (client): принимает `cards: RecipeCardView[]` +
      `canEdit`, держит `useState` строки поиска, рендерит поле поиска (иконка лупы, плейсхолдер
      «Поиск рецептов»), под ним — `RecipeSortToggle`, карточку «+ Добавить рецепт» и
      отфильтрованный список. Фильтр: `matchesQuery([title, ...ingredientNames], q)`.
- [ ] Пустой результат при непустом запросе — состояние «Ничего не найдено» (`EmptyState`).
- [ ] `app/(app)/recipes/page.tsx`: заменить прямой рендер `RecipeSortToggle` + список на
      `<RecipeBrowser cards={cards} canEdit={canEdit} />`. `OfflineSnapshot` и `ScreenHeader`
      остаются на серверной странице. `have` (сортировка) по-прежнему через `searchParams` — поиск
      их не ломает, это отдельный клиентский слой поверх карт.
- [ ] Поле поиска — `text-base` (≥16px, iOS-зум), см. CLAUDE.md §10.

### 1.4 Экран «Запасы»
- [ ] `PantryGroups` уже client. Добавить поле поиска сверху (в самом компоненте или обёртке
      `components/inventory/PantryGroups.tsx`): `useState` запроса, фильтровать `item.ingredient.name`
      через `matchesQuery`, скрывать пустые категории, показывать «Ничего не найдено» при пустом
      результате.
- [ ] Плейсхолдер «Поиск продуктов», иконка лупы, `text-base`.

### 1.5 Завершение
- [ ] `npm run lint`, прогнать Vitest.
- [ ] PR.

---

## Этап 2 — «Поделиться» списком покупок текстом

Ветка: `feat/share-shopping-list`

### 2.1 Форматтер текста (тестируемый)
- [ ] `lib/shopping-list.ts`: `formatShoppingListText(groups, opts)` — на вход результат
      `buildShoppingGroups`, на выход plain-text, сгруппированный по категориям (заголовок
      категории + строки «• Название — 500 г» через `formatQuantity`). Первая строка — заголовок
      с меткой фильтра («Список покупок · Вся неделя» / «· Сегодня» / «· Завтра» / «· Выбраны дни»).
      Купленные позиции — с пометкой (например, префикс «✓»), решить по дизайну.
- [ ] Тест `lib/shopping-list.test.ts`: несколько категорий, пустой список, единицы, метка фильтра.

### 2.2 Кнопка «Поделиться»
- [ ] В `components/shopping/ShoppingListBoard.tsx` — кнопка/иконка «Поделиться» рядом с
      `ToggleGroup` фильтра по дням. Текст строится из **текущих** `groups` (уже считаются от
      активного `filter`) → учитывает фильтр по дням автоматически.
- [ ] Web Share API по образцу `components/profile/InviteSection.tsx`: feature-detect
      `navigator.share` (в `useEffect`, чтобы не рассинхронить SSR), `navigator.share({ title:
      "FridgeMind", text })`, `catch` — тихо (пользователь отменил). Если `navigator.share` нет —
      фолбэк на копирование в буфер (`navigator.clipboard.writeText`) с короткой подсказкой
      «Скопировано».
- [ ] Ручные позиции (`isManual`) уже входят в `groups` — попадут в текст как есть.

### 2.3 Завершение
- [ ] `npm run lint`, Vitest.
- [ ] PR.

---

## Этап 3 — Тёмная тема

Ветка: `feat/dark-theme`

Фундамент уже удобный: `tailwind.config.ts` — `darkMode: ["class"]`, все цвета — HSL-переменные
`hsl(var(--token))`. Значит тёмная тема = определить `.dark`-палитру + провайдер, который вешает
класс `dark` на `<html>`.

### 3.1 Тёмная палитра
- [ ] Взять тёмную палитру из Claude Design (в промпте на дизайн просили показать тёмный вариант
      как референс).
- [ ] `app/globals.css`: добавить блок `.dark { --background: …; --foreground: …; … }` со всеми
      токенами из `:root` (§6–52). Не забыть: `--shadow-card` использует сырой `rgba(45,32,18,.5)` —
      в тёмной сделать отдельное значение. Добавить `color-scheme: light` в `:root` и
      `color-scheme: dark` в `.dark` (нативные скроллбары/контролы).

### 3.2 Провайдер темы (без FOUC)
Тема — личная настройка устройства, `localStorage`, значения `"light" | "dark" | "system"`
(CLAUDE.md §3 п.14).
- [ ] `lib/theme.ts`: тип `Theme`, ключ `localStorage` (напр. `fridgemind-theme`), чистая
      `resolveTheme(theme, systemPrefersDark): "light" | "dark"`.
- [ ] `components/theme/ThemeProvider.tsx` (client): контекст `{ theme, setTheme }`, применяет класс
      `dark` на `document.documentElement`, подписывается на `matchMedia("(prefers-color-scheme:
      dark)")` в режиме `system`, пишет в `localStorage`.
- [ ] Анти-FOUC: инлайн `<script>` в `<head>` `app/layout.tsx`, который **до первой отрисовки**
      читает `localStorage`/системную тему и ставит класс `dark`. Иначе мигнёт светлая тема.
      (Хендмейд ~15 строк, чтобы не тащить `next-theme` зависимостью — решить самому; если проще
      взять `next-themes`, это тоже норм, но это лишняя зависимость.)
- [ ] Обернуть `{children}` в `<ThemeProvider>` в `app/layout.tsx` (корневой layout покрывает и
      `(app)`, и `/~offline`, и auth-экраны).

### 3.3 Переключатель в Профиле
- [ ] `components/theme/ThemeToggle.tsx` (client): существующий примитив `ToggleGroup`/`ToggleGroupItem`
      с тремя пунктами «Светлая» / «Тёмная» / «Как в системе», значение из контекста провайдера.
- [ ] `app/(app)/profile/page.tsx`: новая `SettingsSection title="Оформление"` с `<ThemeToggle />`
      (например, между «Приёмы пищи» и «Аккаунт»).

### 3.4 themeColor и визуальная проверка
- [ ] `app/layout.tsx` `viewport.themeColor`: сделать массивом с media-query (light/dark), сейчас
      захардкожен `#F4EEE2`. (Следует системной теме, не ручному переключателю — для MVP ок.)
- [ ] Пройтись по всем экранам в тёмной теме глазами. Точки с сырыми цветами вне токенов, которые
      надо проверить: `bg-white` и `bg-black/15` в `RecipeSortToggle.tsx` (ручка тумблера/иконка),
      `text-primary-foreground` на светлых плашках, тени `shadow-card/accent-glow/primary-glow`.
      Где сырой цвет ломает тёмную тему — заменить на токен.
- [ ] Проверить офлайн-экран `/~offline` и `OfflineBanner` в тёмной теме (класс `dark` на `<html>`
      ставит инлайн-скрипт, но контекст провайдера туда может не доходить — тема при этом всё равно
      применится через класс).

### 3.5 Завершение
- [ ] `npm run lint`.
- [ ] PR.

---

## Что НЕ делаем
- Обложка рецепта отдельным полем (`Recipe.photoUrl` как cover) — была в стэше, но в этот объём не
  входит (решение пользователя). При желании — отдельной задачей позже.
- Синхронизация темы между участниками household — тема осознанно локальная (§3 п.14).
