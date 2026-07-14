import { expect, test } from "@playwright/test";
import path from "path";

import { readTestUser } from "./support/test-user";

const PHOTO_PATH = path.join(__dirname, "fixtures", "test-photo.png");
const INGREDIENT_NAME = "E2E тестовый ингредиент";

test.describe.configure({ mode: "serial" });

// Сквозной сценарий этапа 8: рецепт в меню + запасы → "Скушал" со списанием →
// недостающее в списке покупок → "куплено" → массовый перенос в запасы.
test("stage 8 smoke: скушано со списанием, куплено, перенос в запасы", async ({ page }) => {
  // Сценарий длиннее остальных smoke (весь этап 8 одной цепочкой), а на холодном .next
  // dev-сервер ещё и компилирует каждый маршрут по пути — стандартных 60с не хватает.
  test.setTimeout(180_000);
  const user = readTestUser();
  const title = `E2E этап-8 ${Date.now()}`;

  await test.step("вход", async () => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({
      timeout: 30_000,
    });
  });

  await test.step("создать рецепт (300 г ингредиента на 2 порции)", async () => {
    await page.goto("/recipes/new");

    await page.locator('input[type="file"]').first().setInputFiles(PHOTO_PATH);
    await expect(page.getByRole("button", { name: "Убрать" })).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder("Например, Тыквенный крем-суп").fill(title);

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
    await expect(dialog).toBeHidden();

    await page.getByPlaceholder("100").fill("300");
    await page.getByPlaceholder("Опишите этот шаг…").fill("Приготовить и подать.");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.waitForURL(
      (url) => /^\/recipes\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"),
    );
  });

  await test.step("добавить 500 г ингредиента в запасы", async () => {
    await page.goto("/inventory");
    await page.getByRole("button", { name: "Вручную" }).click();

    await page.getByRole("button", { name: "Продукт" }).click();
    const picker = page.getByRole("dialog").filter({ hasText: "Продукт из справочника" });
    await picker.getByPlaceholder("Название продукта").fill(INGREDIENT_NAME);
    await picker.getByRole("button", { name: INGREDIENT_NAME, exact: true }).click();
    await expect(picker).toBeHidden();

    await page.getByPlaceholder("Кол-во").fill("500");
    await page.getByRole("button", { name: "Добавить в запасы" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
  });

  await test.step("назначить рецепт на завтрак сегодня", async () => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /Завтрак/ }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: new RegExp(title) }).click();
    await sheet.getByRole("button", { name: "Добавить в день" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

  await test.step("«Скушал» → шит списания → «Списать»", async () => {
    await page.getByRole("button", { name: "Скушал" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Отмечено съеденным")).toBeVisible({ timeout: 10_000 });
    await expect(sheet.getByText("Готовили порций")).toBeVisible();
    // Количество к списанию — на 2 порции, как в рецепте.
    await expect(sheet.getByText("300 г")).toBeVisible();

    await sheet.getByRole("button", { name: "Списать", exact: true }).click();
    await expect(sheet).toBeHidden({ timeout: 10_000 });

    await expect(page.getByText("Съедено")).toBeVisible();
    await expect(page.getByText("1/1", { exact: true })).toBeVisible();
  });

  await test.step("запасы уменьшились: 500 − 300 = 200 г", async () => {
    await page.goto("/inventory");
    const listRow = page
      .locator("section")
      .getByRole("button", { name: new RegExp(INGREDIENT_NAME) });
    await expect(listRow).toContainText("200 г");
  });

  await test.step("в списке покупок недостающие 100 г; отметить «куплено»", async () => {
    await page.goto("/shopping-list");
    const row = page.locator("section").filter({ hasText: INGREDIENT_NAME });
    await expect(row.getByText("100 г")).toBeVisible();

    await page.getByRole("checkbox", { name: `Куплено: ${INGREDIENT_NAME}` }).click();
    // Подпись "куплено · имя" приходит с сервера после ревалидации; на холодном dev-сервере
    // ответ server action может занять десятки секунд — таймаут с запасом.
    await expect(page.getByText("куплено · E2E Smoke")).toBeVisible({ timeout: 30_000 });
  });

  await test.step("«Добавить в запасы» переносит купленное в инвентарь", async () => {
    await page.getByRole("button", { name: "Добавить в запасы · 1" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Перенести в запасы")).toBeVisible();
    await sheet.getByRole("button", { name: "Добавить 1 в запасы" }).click();
    await expect(sheet).toBeHidden({ timeout: 10_000 });

    await expect(page.getByRole("button", { name: /Добавить в запасы · / })).toHaveCount(0);

    await page.goto("/inventory");
    const listRow = page
      .locator("section")
      .getByRole("button", { name: new RegExp(INGREDIENT_NAME) });
    await expect(listRow).toContainText("300 г");
  });
});

// Realtime-синхронизация (см. CLAUDE.md §6): второй клиент добавляет ручную позицию,
// первый видит её без перезагрузки — через Supabase Realtime → router.refresh().
test("shopping realtime: позиция от другого клиента появляется без перезагрузки", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const user = readTestUser();
  const manualName = `E2E реалтайм ${Date.now()}`;

  async function login(ctx: Awaited<ReturnType<typeof browser.newContext>>) {
    const page = await ctx.newPage();
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    return page;
  }

  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  try {
    const pageA = await login(ctxA);
    const pageB = await login(ctxB);

    await pageA.goto("/shopping-list");
    await pageA.waitForLoadState("networkidle");

    await pageB.goto("/shopping-list");
    await pageB.getByRole("button", { name: "Добавить свою позицию" }).click();
    await pageB.getByLabel("Название").fill(manualName);
    await pageB.getByLabel("Количество").fill("1");
    await pageB.getByRole("button", { name: "Добавить в список" }).click();
    await expect(pageB.getByRole("dialog")).toBeHidden({ timeout: 10_000 });

    // Никакой навигации на pageA — позиция должна прийти по вебсокету.
    await expect(pageA.getByText(manualName)).toBeVisible({ timeout: 15_000 });

    // Удаление вторым клиентом тоже долетает без перезагрузки (DELETE-событие без payload
    // — см. ShoppingListRealtime).
    await pageB.getByRole("button", { name: `Изменить: ${manualName}` }).click();
    await pageB.getByRole("button", { name: "Удалить" }).click();
    await expect(pageB.getByText("Удалить из списка?")).toBeVisible();
    await pageB.getByRole("button", { name: "Удалить" }).click();
    await expect(pageB.getByRole("dialog")).toBeHidden({ timeout: 10_000 });

    await expect(pageA.getByText(manualName)).toBeHidden({ timeout: 15_000 });
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});
