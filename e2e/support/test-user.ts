import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const STATE_FILE = path.join(__dirname, "..", ".test-user.json");

export type TestUser = {
  id: string;
  email: string;
  password: string;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не заданы для e2e");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

// Отдельный auto-confirmed пользователь на каждый прогон — handle_new_user создаёт для него
// свежий household (см. миграцию 20260704120005_rls_and_triggers), поэтому тест не задевает
// данные существующих household'ов в общем dev-проекте Supabase.
export async function createTestUser(): Promise<TestUser> {
  const supabase = adminClient();
  const email = `e2e+${Date.now()}@fridgemind.test`;
  const password = `E2e-${Math.random().toString(36).slice(2)}!`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "E2E Smoke" },
  });
  if (error || !data.user) {
    throw new Error(`Не удалось создать тестового пользователя: ${error?.message}`);
  }

  const user: TestUser = { id: data.user.id, email, password };
  fs.writeFileSync(STATE_FILE, JSON.stringify(user));
  return user;
}

export function readTestUser(): TestUser {
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

export async function deleteTestUser(user: TestUser): Promise<void> {
  const supabase = adminClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle();

  if (userRow?.household_id) {
    await supabase.from("households").delete().eq("id", userRow.household_id);
  }
  await supabase.auth.admin.deleteUser(user.id);

  if (fs.existsSync(STATE_FILE)) fs.rmSync(STATE_FILE);
}
