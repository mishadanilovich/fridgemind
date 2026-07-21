import { expect, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { readTestUser } from "./support/test-user";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function householdId(): Promise<string> {
  const supabase = adminClient();
  const { data } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", readTestUser().id)
    .single();
  return data!.household_id as string;
}

// Рецепт заводится напрямую — тест про шаблоны, создание рецепта покрыто recipes.spec.ts.
// id и updated_at Prisma генерирует на клиенте, в таблице дефолтов под них нет.
async function seedRecipe(hh: string, title: string): Promise<string> {
  const { data, error } = await adminClient()
    .from("recipes")
    .insert({
      id: crypto.randomUUID(),
      household_id: hh,
      title,
      base_servings: 2,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`Не удалось создать рецепт: ${error.message}`);
  return data!.id as string;
}

async function login(page: Page) {
  const user = readTestUser();
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Пароль").fill(user.password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("menu templates: план недели → сохранить → переименовать → применить → удалить", async ({
  page,
}) => {
  const hh = await householdId();
  const recipeId = await seedRecipe(hh, `E2E шаблон-рецепт ${Date.now()}`);

  try {
    await login(page);

    await test.step("запланировать понедельник-завтрак", async () => {
      await page.goto("/menu");
      await page.getByRole("button", { name: /Завтрак/ }).first().click();
      const sheet = page.getByRole("dialog");
      await expect(sheet.getByText("Выбрать рецепт")).toBeVisible();
      await sheet.getByRole("button", { name: /E2E шаблон-рецепт/ }).click();
      await sheet.getByRole("button", { name: "Добавить в день" }).click();
      await expect(sheet).toBeHidden();
    });

    await test.step("сохранить как шаблон", async () => {
      await page.getByRole("button", { name: "Действия с меню недели" }).click();
      await page.getByRole("button", { name: "Сохранить как шаблон" }).click();
      await page.getByPlaceholder("Например, «Обычная неделя»").fill("Обычная неделя");
      await page.getByRole("button", { name: "Сохранить" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
    });

    await test.step("шаблон виден в списке с числом приёмов", async () => {
      await page.getByRole("button", { name: "Действия с меню недели" }).click();
      await page.getByRole("button", { name: "Шаблоны" }).click();
      await expect(page.getByText("Обычная неделя")).toBeVisible();
      await expect(page.getByText(/1 приём(?!\p{L})/u)).toBeVisible();
    });

    await test.step("переименовать шаблон", async () => {
      await page.getByRole("button", { name: "Переименовать «Обычная неделя»" }).click();
      const input = page.getByPlaceholder("Название шаблона");
      await input.fill("Будни");
      await page.getByRole("button", { name: "Сохранить" }).click();
      await expect(page.getByText("Будни")).toBeVisible();
    });

    await test.step("применить шаблон — предупреждение, т.к. неделя не пуста", async () => {
      await page.getByRole("button", { name: "Применить" }).click();
      await expect(page.getByText(/заменит уже запланированные рецепты/)).toBeVisible();
      await page.getByRole("button", { name: "Применить", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
    });

    await test.step("удалить шаблон", async () => {
      await page.getByRole("button", { name: "Действия с меню недели" }).click();
      await page.getByRole("button", { name: "Шаблоны" }).click();
      await page.getByRole("button", { name: "Удалить «Будни»" }).click();
      await page.getByRole("button", { name: "Удалить", exact: true }).click();
      await expect(page.getByText("Пока нет шаблонов")).toBeVisible();
    });
  } finally {
    const supabase = adminClient();
    await supabase.from("menu_templates").delete().eq("household_id", hh);
    await supabase.from("recipes").delete().eq("id", recipeId);
  }
});

test("menu templates: пятый шаблон упирается в лимит", async ({ page }) => {
  const hh = await householdId();
  const supabase = adminClient();
  const rows = [1, 2, 3, 4].map((n) => ({
    id: crypto.randomUUID(),
    household_id: hh,
    name: `Лимит ${n}`,
  }));
  const { error } = await supabase.from("menu_templates").insert(rows);
  if (error) throw new Error(`Не удалось создать шаблоны: ${error.message}`);

  try {
    await login(page);
    await page.goto("/menu");
    await page.getByRole("button", { name: "Действия с меню недели" }).click();
    await page.getByRole("button", { name: "Сохранить как шаблон" }).click();
    await expect(page.getByText(/Достигнут лимит в 4 шаблона/)).toBeVisible();
  } finally {
    await supabase.from("menu_templates").delete().eq("household_id", hh);
  }
});
