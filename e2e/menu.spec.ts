import { expect, test } from "@playwright/test";
import path from "path";

import { readTestUser } from "./support/test-user";

const PHOTO_PATH = path.join(__dirname, "fixtures", "test-photo.png");
const INGREDIENT_NAME = "E2E тестовый ингредиент";

test.describe.configure({ mode: "serial" });

test("menu smoke: рецепт → назначить на завтрак → виден на «Сегодня» и в неделе → убрать", async ({
  page,
}) => {
  const user = readTestUser();
  const title = `E2E меню-рецепт ${Date.now()}`;

  await test.step("вход", async () => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({
      timeout: 30_000,
    });
  });

  await test.step("создать рецепт для меню", async () => {
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

  await test.step("назначить рецепт на завтрак сегодня", async () => {
    await page.goto("/");
    // Дожидаемся тишины в сети: на холодном .next dev-сервер досылает hot-update уже после
    // загрузки, и Fast Refresh перемонтирует компоненты — открытая шторка при этом закрылась бы.
    await page.waitForLoadState("networkidle");

    // Стартовый набор слотов household — Завтрак/Обед/Ужин (см. CLAUDE.md §5).
    await page.getByRole("button", { name: /Завтрак/ }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Выбрать рецепт")).toBeVisible();
    await sheet.getByRole("button", { name: new RegExp(title) }).click();

    // Базовое число порций рецепта — 2; готовим на 3.
    await expect(sheet.getByText("2 порц.")).toBeVisible();
    await sheet.getByRole("button", { name: "Больше" }).click();
    await sheet.getByRole("button", { name: "Добавить в день" }).click();
    await expect(sheet).toBeHidden();
  });

  await test.step("приём пищи виден на «Сегодня»", async () => {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
    await expect(page.getByText("3 порц.")).toBeVisible();
    await expect(page.getByText("1/1", { exact: false })).toBeHidden();
    await expect(page.getByText("0/1", { exact: true })).toBeVisible();
  });

  await test.step("приём пищи виден в меню на неделю и в просмотре дня", async () => {
    await page.goto("/menu");
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Открыть день" }).first().click();
    await page.waitForURL(/\/menu\/\d{4}-\d{2}-\d{2}$/);
  });

  await test.step("убрать рецепт из слота", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: `Убрать «${title}» из слота «Завтрак»` }).click();
    await page.getByRole("button", { name: "Убрать", exact: true }).click();

    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Завтрак/ })).toBeVisible();
  });
});
