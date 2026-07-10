import { expect, test } from "@playwright/test";

import { readTestUser } from "./support/test-user";

const INGREDIENT_NAME = "E2E тестовый ингредиент";

test.describe.configure({ mode: "serial" });

test("inventory smoke: login, add manually, edit quantity, delete", async ({ page }) => {
  const user = readTestUser();
  // Кнопка строки в группе категории; скоуп section отсекает кнопку выбора продукта
  // с тем же названием внутри порталящихся в body шитов/диалогов.
  const listRow = page.locator("section").getByRole("button", { name: new RegExp(INGREDIENT_NAME) });

  await test.step("вход", async () => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    // Первый запрос после старта dev-сервера компилирует маршрут — даём запас на это.
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({
      timeout: 15_000,
    });
  });

  await test.step("добавить продукт вручную", async () => {
    await page.goto("/inventory");
    await page.getByRole("button", { name: "Вручную" }).click();

    await page.getByRole("button", { name: "Продукт" }).click();
    const picker = page.getByRole("dialog").filter({ hasText: "Продукт из справочника" });
    await picker.getByPlaceholder("Название продукта").fill(INGREDIENT_NAME);

    const existingItem = picker.getByRole("button", { name: INGREDIENT_NAME, exact: true });
    const createBtn = picker.getByRole("button", { name: `Создать «${INGREDIENT_NAME}»` });
    await expect(existingItem.or(createBtn)).toBeVisible({ timeout: 5_000 });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await picker.getByRole("button", { name: "Создать и выбрать" }).click();
    } else {
      await existingItem.click();
    }
    await expect(picker).toBeHidden();

    await page.getByPlaceholder("Кол-во").fill("500");
    await page.getByRole("button", { name: "Добавить в запасы" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });

    // Количество в строке может отличаться от 500 г, если запас остался
    // от упавшего прошлого прогона (добавление суммирует).
    await expect(listRow).toBeVisible();
  });

  await test.step("изменить количество", async () => {
    await listRow.click();
    await page.getByPlaceholder("Кол-во").fill("1500");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    await expect(listRow).toContainText("1.5 кг");
  });

  await test.step("удалить позицию", async () => {
    await listRow.click();
    await page.getByRole("button", { name: "Удалить" }).click();
    // Шаг подтверждения: шит переключается на "Удалить из запасов?" с повторной кнопкой.
    await expect(page.getByText("Удалить из запасов?")).toBeVisible();
    await page.getByRole("button", { name: "Удалить" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    await expect(listRow).toHaveCount(0);
  });
});
