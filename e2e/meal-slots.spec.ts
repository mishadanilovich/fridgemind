import { expect, test } from "@playwright/test";
import path from "path";

import { readTestUser } from "./support/test-user";

const PHOTO_PATH = path.join(__dirname, "fixtures", "test-photo.png");
const INGREDIENT_NAME = "E2E тестовый ингредиент";
const SLOT = "Полдник";

test.describe.configure({ mode: "serial" });

// Пересоздание удалённого слота не должно плодить дубли (см. CLAUDE.md §5, "Защита от дублей
// при пересоздании"): старая запись воскресает вместе со своими MenuDayMeal, а не заводится вторая.
test("meal slots: имя уникально, а пересоздание удалённого слота возвращает прежний", async ({
  page,
}) => {
  const user = readTestUser();
  const title = `E2E слот-рецепт ${Date.now()}`;

  await test.step("вход", async () => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({
      timeout: 30_000,
    });
  });

  await test.step("создать рецепт", async () => {
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

    await page.getByPlaceholder("100").fill("200");
    await page.getByPlaceholder("Опишите этот шаг…").fill("Приготовить.");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.waitForURL(
      (url) => /^\/recipes\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith("/new"),
    );
  });

  const slotField = page.getByLabel(`Название приёма пищи «${SLOT}»`);

  await test.step("добавить слот и запретить дубль по имени", async () => {
    await page.goto("/profile");
    await page.getByPlaceholder("Новый приём пищи").fill(SLOT);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await expect(slotField).toBeVisible({ timeout: 15_000 });

    // Регистр не важен: "полдник" — то же имя, что уже занято активным слотом.
    await page.getByPlaceholder("Новый приём пищи").fill(SLOT.toLowerCase());
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await expect(page.getByText("Такой приём пищи уже есть")).toBeVisible();
    await expect(slotField).toHaveCount(1);
  });

  await test.step("назначить рецепт на новый слот", async () => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: new RegExp(SLOT) }).click();

    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: new RegExp(title) }).click();
    await sheet.getByRole("button", { name: "Добавить в день" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

  await test.step("удалить слот и создать его заново — блюдо остаётся, дубля нет", async () => {
    await page.goto("/profile");
    await page.getByRole("button", { name: `Удалить «${SLOT}»` }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Удалить", exact: true }).click();
    await expect(slotField).toHaveCount(0);

    await page.getByPlaceholder("Новый приём пищи").fill(SLOT);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await expect(slotField).toHaveCount(1);

    // Слот воскрес вместе со своим id: приём пищи всё ещё в нём, и "Полдник" на экране один.
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(SLOT, { exact: true })).toHaveCount(1);
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  });

  // Household общий на весь прогон — возвращаем его в исходное состояние, чтобы соседние
  // спеки не видели лишний слот и лишний приём пищи.
  await test.step("убрать за собой", async () => {
    await page.getByRole("button", { name: `Убрать «${title}» из слота «${SLOT}»` }).click();
    await page.getByRole("button", { name: "Убрать", exact: true }).click();
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);

    await page.goto("/profile");
    await page.getByRole("button", { name: `Удалить «${SLOT}»` }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Удалить", exact: true }).click();
    await expect(slotField).toHaveCount(0);
  });
});
