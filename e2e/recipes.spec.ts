import { expect, test } from "@playwright/test";
import path from "path";

import { readTestUser } from "./support/test-user";

const PHOTO_PATH = path.join(__dirname, "fixtures", "test-photo.png");
const INGREDIENT_NAME = "E2E тестовый ингредиент";

test.describe.configure({ mode: "serial" });

test("recipe CRUD smoke: login, create, view with servings recalc, edit, delete", async ({
  page,
}) => {
  const user = readTestUser();
  const title = `E2E тестовый рецепт ${Date.now()}`;
  const editedTitle = `${title} (изменён)`;

  await test.step("вход", async () => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible();
  });

  await test.step("создать рецепт", async () => {
    await page.goto("/recipes");
    await page.getByRole("link", { name: "Добавить рецепт" }).click();
    await page.waitForURL("**/recipes/new");

    await page.locator('input[type="file"]').first().setInputFiles(PHOTO_PATH);
    await expect(page.getByRole("button", { name: "Убрать" })).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder("Например, Тыквенный крем-суп").fill(title);
    await page.getByRole("button", { name: "Плита" }).click();

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

    await page.getByPlaceholder("100").fill("500");
    await page.getByPlaceholder("Опишите этот шаг…").fill("Смешать всё и подавать.");

    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.waitForURL((url) => /^\/recipes\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"));
  });

  await test.step("рецепт виден в списке", async () => {
    await page.goto("/recipes");
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

  await test.step("просмотр рецепта: пересчёт по порциям", async () => {
    await page.getByText(title, { exact: true }).click();
    await page.waitForURL(/\/recipes\/[^/]+$/);
    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    await expect(page.getByText(`${INGREDIENT_NAME} · 500 г`)).toBeVisible();

    const more = page.getByRole("button", { name: "Больше" });
    await more.click();
    await more.click();
    await expect(page.getByText(`${INGREDIENT_NAME} · 1 кг`)).toBeVisible();
  });

  await test.step("редактировать рецепт", async () => {
    await page.goto("/recipes");
    await page.getByRole("link", { name: `Изменить «${title}»` }).click();
    await page.waitForURL(/\/recipes\/[^/]+\/edit$/);

    const titleInput = page.getByPlaceholder("Например, Тыквенный крем-суп");
    await titleInput.fill(editedTitle);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.waitForURL(/\/recipes\/[^/]+$/);
    await expect(page.getByRole("heading", { name: editedTitle, level: 1 })).toBeVisible();
  });

  await test.step("удалить рецепт", async () => {
    await page.goto("/recipes");
    await page.getByRole("button", { name: `Удалить «${editedTitle}»` }).click();
    await page.getByRole("button", { name: "Удалить", exact: true }).click();
    await expect(page.getByText(editedTitle, { exact: true })).toHaveCount(0);
  });
});
