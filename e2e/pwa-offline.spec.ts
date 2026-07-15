import { expect, type Page, test } from "@playwright/test";
import path from "path";

import { readTestUser } from "./support/test-user";

// PWA-офлайн (CLAUDE.md §10: "установка PWA и чтение сохранённого меню офлайн").
// Против dev-сервера service worker недоступен, поэтому базовый сценарий проверяет
// офлайн-слой напрямую: визит экрана кладёт снапшот в Dexie, а /~offline (страница,
// которую SW отдаёт на любую навигацию без сети) рендерит его. Полный сквозной сценарий
// через SW — отдельным тестом под E2E_PWA=1 против прод-сборки (next build && next start).

test.describe.configure({ mode: "serial" });

const RECIPE_TITLE = `E2E офлайн-рецепт ${Date.now()}`;
const INGREDIENT_NAME = "E2E тестовый ингредиент";
const PHOTO_PATH = path.join(__dirname, "fixtures", "test-photo.png");

async function login(page: Page) {
  const user = readTestUser();
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль").fill(user.password);
  await page.getByRole("button", { name: "Войти" }).click();
  // Холодный dev-сервер компилирует "/" на лету — стандартных 5с ожидания не хватает.
  await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({
    timeout: 20_000,
  });
}

// Снапшот пишется в useEffect уже после отрисовки экрана — перед уходом со страницы
// дожидаемся, что запись реально легла в IndexedDB.
function waitForSnapshot(page: Page, table: string, id: string) {
  return page.waitForFunction(
    ({ table, id }) =>
      new Promise<boolean>((resolve) => {
        const open = indexedDB.open("fridgemind-offline");
        open.onerror = () => resolve(false);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains(table)) {
            db.close();
            resolve(false);
            return;
          }
          const get = db.transaction(table).objectStore(table).get(id);
          get.onerror = () => {
            db.close();
            resolve(false);
          };
          get.onsuccess = () => {
            db.close();
            resolve(get.result !== undefined);
          };
        };
      }),
    { table, id },
  );
}

test("экраны кэшируются в Dexie и читаются офлайн через /~offline", async ({ page, context }) => {
  await login(page);

  await test.step("создать рецепт для проверяемого контента", async () => {
    await page.goto("/recipes");
    await page.getByRole("link", { name: "Добавить рецепт" }).click();
    await page.waitForURL("**/recipes/new");

    await page.locator('input[type="file"]').first().setInputFiles(PHOTO_PATH);
    await expect(page.getByRole("button", { name: "Убрать" })).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder("Например, Тыквенный крем-суп").fill(RECIPE_TITLE);

    await page.getByRole("button", { name: "Продукт" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Название продукта").fill(INGREDIENT_NAME);
    const existingItem = dialog.getByRole("button", { name: INGREDIENT_NAME, exact: true });
    const createBtn = dialog.getByRole("button", { name: `Создать «${INGREDIENT_NAME}»` });
    await expect(existingItem.or(createBtn)).toBeVisible({ timeout: 5_000 });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await dialog.getByRole("button", { name: "Создать и выбрать" }).click();
    } else {
      await existingItem.click();
    }
    await expect(dialog).toBeHidden({ timeout: 15_000 });

    await page.getByPlaceholder("100").fill("500");
    await page.getByPlaceholder("Опишите этот шаг…").fill("Смешать всё и подавать.");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.waitForURL(
      (url) => /^\/recipes\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"),
      { timeout: 20_000 },
    );
  });

  await test.step("визиты экранов пишут снапшоты в Dexie", async () => {
    await waitForSnapshot(page, "recipes", page.url().split("/").pop() ?? "");

    await page.goto("/recipes");
    await expect(page.getByText(RECIPE_TITLE, { exact: true })).toBeVisible();
    await waitForSnapshot(page, "recipeLists", "all");

    await page.goto("/menu");
    await expect(page.getByRole("heading", { name: "Меню на неделю", level: 1 })).toBeVisible();
    const weekStart = await page.evaluate(() => {
      const now = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(new Date());
      const date = new Date(`${now}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      return date.toISOString().slice(0, 10);
    });
    await waitForSnapshot(page, "menuWeeks", weekStart);
  });

  await test.step("/~offline рендерит сохранённые рецепты", async () => {
    await page.goto("/~offline?from=/recipes");
    await expect(page.getByRole("heading", { name: "Рецепты", level: 1 })).toBeVisible();
    await expect(page.getByText("Офлайн-режим")).toBeVisible();
    await expect(page.getByText(RECIPE_TITLE, { exact: true })).toBeVisible();
  });

  await test.step("/~offline рендерит сохранённое меню недели", async () => {
    await page.goto("/~offline?from=/menu");
    await expect(page.getByRole("heading", { name: "Меню на неделю", level: 1 })).toBeVisible();
    await expect(page.getByText("Понедельник")).toBeVisible();
  });

  await test.step("баннер офлайна появляется при потере сети", async () => {
    await context.setOffline(true);
    await expect(page.getByText("Нет сети — показаны сохранённые данные")).toBeVisible();
    await context.setOffline(false);
  });
});

// Сквозной сценарий через service worker — только против прод-сборки:
//   npm run build && npm run start -- --port 3100
//   затем E2E_PWA=1 npx playwright test pwa-offline
test("service worker отдаёт офлайн-фоллбэк на навигацию без сети", async ({ page, context }) => {
  test.skip(!process.env.E2E_PWA, "нужна прод-сборка с service worker (E2E_PWA=1)");

  await login(page);

  await page.goto("/recipes");
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active?.state === "activated";
  });
  await waitForSnapshot(page, "recipeLists", "all");

  await context.setOffline(true);

  // Посещённый экран: SW отдаёт либо HTML из runtime-кэша, либо фоллбэк с данными из Dexie —
  // в обоих случаях сохранённый рецепт должен быть виден.
  await page.goto("/recipes");
  await expect(page.getByRole("heading", { name: "Рецепты", level: 1 })).toBeVisible();
  await expect(page.getByText(RECIPE_TITLE, { exact: true })).toBeVisible();

  // Непосещённый маршрут в runtime-кэш не попадал — сюда SW обязан отдать /~offline.
  await page.goto("/profile");
  await expect(page.getByText("Эта страница недоступна офлайн")).toBeVisible();

  await context.setOffline(false);
});
