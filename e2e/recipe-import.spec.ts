import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { readTestUser } from "./support/test-user";

const TS = Date.now();
const MATCHED = `E2E совпал ${TS}`;
const UNMATCHED = `E2E новый ${TS}`;
const RECIPE_TITLE = `E2E импорт-рецепт ${TS}`;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function householdId(): Promise<string> {
  const { data } = await adminClient()
    .from("users")
    .select("household_id")
    .eq("id", readTestUser().id)
    .single();
  return data!.household_id as string;
}

const IMPORT_JSON = JSON.stringify({
  recipes: [
    {
      title: RECIPE_TITLE,
      baseServings: 4,
      cookTimeMinutes: 30,
      cookingMethods: ["stovetop"],
      ingredients: [
        { name: MATCHED, quantity: 200, unit: "g" },
        { name: UNMATCHED, quantity: 1, unit: "pcs" },
      ],
      steps: ["Первый шаг", "Второй шаг"],
    },
  ],
});

test.describe.configure({ mode: "serial" });

test("recipe import: вставить JSON → подтвердить → рецепт в списке", async ({ page }) => {
  const supabase = adminClient();
  const hh = await householdId();
  // Продукт, который уже есть в каталоге → должен сопоставиться, а не попасть в «новые».
  await supabase
    .from("ingredients")
    .insert({ id: crypto.randomUUID(), name: MATCHED, default_unit_type: "WEIGHT", category: "OTHER" });

  try {
    const user = readTestUser();
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({ timeout: 20_000 });

    await test.step("генератор промпта отдаёт текст в нужном формате", async () => {
      await page.goto("/recipes/import");
      await page.getByRole("button", { name: /Сгенерировать промпт для ИИ/ }).click();
      await page
        .getByPlaceholder(/быстрых ужинов/)
        .fill("3 ужина с курицей");
      await page.getByRole("button", { name: "Сгенерировать промпт" }).click();
      await expect(page.getByText('"recipes"', { exact: false })).toBeVisible();
      await expect(page.getByText(MATCHED, { exact: false })).toBeVisible();
    });

    await test.step("вставить JSON и продолжить", async () => {
      await page.goto("/recipes/import");
      await page.getByRole("button", { name: /У меня уже есть готовый JSON/ }).click();
      await page.getByPlaceholder(/"recipes"/).fill(IMPORT_JSON);
      await page.getByRole("button", { name: "Продолжить" }).click();
    });

    await test.step("экран подтверждения: рецепт и новый продукт", async () => {
      await expect(page.getByText("Будет добавлено")).toBeVisible();
      await expect(page.getByText(RECIPE_TITLE)).toBeVisible();
      // MATCHED сопоставлен и в «новые» не попал; UNMATCHED — в секции новых продуктов.
      await expect(page.getByText("Новые продукты")).toBeVisible();
      await expect(page.getByText(UNMATCHED, { exact: true })).toBeVisible();
    });

    await test.step("импортировать → рецепт виден в списке", async () => {
      await page.getByRole("button", { name: "Импортировать" }).click();
      await page.waitForURL("**/recipes");
      await expect(page.getByRole("link", { name: RECIPE_TITLE, exact: true })).toBeVisible();
    });

    await test.step("новый продукт создан в справочнике", async () => {
      const { data } = await supabase
        .from("ingredients")
        .select("id")
        .ilike("name", UNMATCHED);
      expect(data?.length).toBe(1);
    });
  } finally {
    await supabase.from("recipes").delete().eq("household_id", hh).eq("title", RECIPE_TITLE);
    await supabase.from("ingredients").delete().in("name", [MATCHED, UNMATCHED]);
  }
});

test("recipe import: несовпавший продукт можно сопоставить с существующим тех же единиц", async ({
  page,
}) => {
  const supabase = adminClient();
  const hh = await householdId();
  const targetName = `E2E цель ${TS}`;
  const newName = `E2E несопоставлен ${TS}`;
  const title = `E2E импорт-сопоставление ${TS}`;
  // Существующий штучный (COUNT) продукт — цель сопоставления для pcs-ингредиента.
  await supabase
    .from("ingredients")
    .insert({ id: crypto.randomUUID(), name: targetName, default_unit_type: "COUNT", category: "OTHER" });

  const json = JSON.stringify({
    recipes: [
      {
        title,
        baseServings: 2,
        ingredients: [{ name: newName, quantity: 2, unit: "pcs" }],
        steps: ["шаг"],
      },
    ],
  });

  try {
    const user = readTestUser();
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Пароль").fill(user.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({ timeout: 20_000 });

    await page.goto("/recipes/import");
    await page.getByRole("button", { name: /У меня уже есть готовый JSON/ }).click();
    await page.getByPlaceholder(/"recipes"/).fill(json);
    await page.getByRole("button", { name: "Продолжить" }).click();

    await expect(page.getByText(newName, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Сопоставить" }).click();
    await page.getByLabel(`Продукт для «${newName}»`).click();
    await page.getByRole("option", { name: targetName }).click();
    await page.getByRole("button", { name: "Импортировать" }).click();
    await page.waitForURL("**/recipes");
    await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();

    // Сопоставили с существующим — новый продукт не создавался.
    const { data } = await supabase.from("ingredients").select("id").ilike("name", newName);
    expect(data?.length ?? 0).toBe(0);
  } finally {
    await supabase.from("recipes").delete().eq("household_id", hh).eq("title", title);
    await supabase.from("ingredients").delete().in("name", [targetName, newName]);
  }
});

test("recipe import: Участнику импорт недоступен (кнопка скрыта, /recipes/import редиректит)", async ({
  page,
}) => {
  const supabase = adminClient();
  const email = `e2e-member+${TS}@fridgemind.test`;
  const password = `E2e-${Math.random().toString(36).slice(2)}!`;
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "E2E Участник" },
  });
  if (created.error || !created.data.user) throw new Error("не удалось создать участника");
  const memberId = created.data.user.id;
  await supabase.from("users").update({ role: "MEMBER" }).eq("id", memberId);

  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Пароль").fill(password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByRole("heading", { name: "Сегодня", level: 1 })).toBeVisible({ timeout: 20_000 });

    await page.goto("/recipes");
    await expect(page.getByRole("link", { name: "Импортировать рецепты" })).toBeHidden();

    // Серверный гейт, а не только скрытая кнопка: прямой заход редиректит на список.
    await page.goto("/recipes/import");
    await page.waitForURL("**/recipes");
    await expect(page.getByRole("heading", { name: "Рецепты", level: 1 })).toBeVisible();
    await expect(page.getByText("Импорт рецептов")).toBeHidden();
  } finally {
    const { data } = await supabase.from("users").select("household_id").eq("id", memberId).single();
    if (data?.household_id) await supabase.from("households").delete().eq("id", data.household_id);
    await supabase.auth.admin.deleteUser(memberId);
  }
});
