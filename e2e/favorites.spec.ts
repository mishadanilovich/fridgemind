import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { readTestUser } from "./support/test-user";

const PLAIN = `E2E обычный ${Date.now()}`;
const STARRED = `E2E любимый ${Date.now()}`;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// Рецепты заводятся напрямую, а не через форму: тест про избранное, а создание рецепта
// уже покрыто recipes.spec.ts.
async function seedRecipes(): Promise<string[]> {
  const supabase = adminClient();
  const { data: userRow } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", readTestUser().id)
    .single();

  // id и updated_at Prisma проставляет на клиенте (@default(cuid()) / @updatedAt), в самой
  // таблице дефолтов под них нет — при вставке мимо Prisma их нужно задать руками.
  const base = {
    household_id: userRow!.household_id,
    base_servings: 2,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("recipes")
    .insert([
      { ...base, id: crypto.randomUUID(), title: PLAIN, is_favorite: false },
      { ...base, id: crypto.randomUUID(), title: STARRED, is_favorite: true },
    ])
    .select("id");
  if (error) throw new Error(`Не удалось создать рецепты для теста: ${error.message}`);
  return data.map((r) => r.id);
}

test.describe.configure({ mode: "serial" });

test("favorites: фильтр показывает только избранное, сердечко переключается", async ({ page }) => {
  const ids = await seedRecipes();

  try {
    const user = readTestUser();
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible();

    await page.goto("/recipes");
    await expect(page.getByRole("link", { name: PLAIN, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: STARRED, exact: true })).toBeVisible();

    await test.step("фильтр сужает список до избранного", async () => {
      await page.getByRole("button", { name: "Избранное", exact: true }).click();
      await expect(page.getByRole("link", { name: STARRED, exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: PLAIN, exact: true })).toBeHidden();
    });

    await test.step("сердечко добавляет рецепт в избранное", async () => {
      await page.getByRole("button", { name: "Избранное", exact: true }).click();
      await page.getByRole("button", { name: `Добавить «${PLAIN}» в избранное` }).click();
      await expect(
        page.getByRole("button", { name: `Убрать «${PLAIN}» из избранного` }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Избранное", exact: true }).click();
      await expect(page.getByRole("link", { name: PLAIN, exact: true })).toBeVisible();
    });

    await test.step("снятие сердечка убирает его из фильтра", async () => {
      await page.getByRole("button", { name: `Убрать «${PLAIN}» из избранного` }).click();
      await expect(page.getByRole("link", { name: PLAIN, exact: true })).toBeHidden();
    });
  } finally {
    await adminClient().from("recipes").delete().in("id", ids);
  }
});
