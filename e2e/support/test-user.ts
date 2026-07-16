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

export type SecondaryTestUser = TestUser & { originalHouseholdId: string };

// Второй аккаунт для сценария "один дома, другой в магазине": создаётся внутри теста,
// присоединяется к household основного пользователя по реальной ссылке-приглашению
// и удаляется в том же тесте (finally), не полагаясь на global-teardown.
export async function createSecondaryUser(): Promise<SecondaryTestUser> {
  const supabase = adminClient();
  const email = `e2e-b+${Date.now()}@fridgemind.test`;
  const password = `E2e-${Math.random().toString(36).slice(2)}!`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "E2E Second" },
  });
  if (error || !data.user) {
    throw new Error(`Не удалось создать второго тестового пользователя: ${error?.message}`);
  }

  const { data: userRow, error: selectError } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", data.user.id)
    .single();
  if (selectError || !userRow) {
    throw new Error(`Не найден household второго пользователя: ${selectError?.message}`);
  }

  return { id: data.user.id, email, password, originalHouseholdId: userRow.household_id };
}

export async function getInviteCodeFor(userId: string): Promise<string> {
  const supabase = adminClient();
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", userId)
    .single();
  if (userError || !userRow) {
    throw new Error(`Не найден household пользователя ${userId}: ${userError?.message}`);
  }

  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("invite_code")
    .eq("id", userRow.household_id)
    .single();
  if (householdError || !household) {
    throw new Error(`Не найден invite-код household: ${householdError?.message}`);
  }
  return household.invite_code;
}

export async function deleteSecondaryUser(user: SecondaryTestUser): Promise<void> {
  const supabase = adminClient();

  // Каждый шаг очистки best-effort и независим: сбой раннего не должен прерывать остальные,
  // иначе в общем dev/prod-проекте Supabase копятся осиротевшие household'ы и auth-пользователи.
  // Собственный household (originalHouseholdId) и так осиротел после присоединения к семье A,
  // поэтому auth-пользователя удаляем в любом случае. Ошибки агрегируем и бросаем в конце.
  const errors: string[] = [];

  // Строка public.users — FK на auth.users нет, каскада от deleteUser не будет; удаляем первой,
  // чтобы снять ссылку users.household_id перед удалением самого household.
  const { error: userError } = await supabase.from("users").delete().eq("id", user.id);
  if (userError) errors.push(`users: ${userError.message}`);

  const { error: householdError } = await supabase
    .from("households")
    .delete()
    .eq("id", user.originalHouseholdId);
  if (householdError) errors.push(`households: ${householdError.message}`);

  const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
  if (authError) errors.push(`auth: ${authError.message}`);

  if (errors.length > 0) {
    throw new Error(`Неполная очистка второго тестового пользователя: ${errors.join("; ")}`);
  }
}

export async function deleteTestUser(user: TestUser): Promise<void> {
  const supabase = adminClient();

  const { data: userRow, error: selectError } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle();
  if (selectError) {
    throw new Error(`Не удалось найти household тестового пользователя: ${selectError.message}`);
  }

  if (userRow?.household_id) {
    const { error: deleteError } = await supabase
      .from("households")
      .delete()
      .eq("id", userRow.household_id);
    if (deleteError) {
      // Не удаляем auth-пользователя, если household не удалился — иначе он останется
      // осиротевшим (без владельца) и потеряется как мусор в общем dev-проекте Supabase.
      throw new Error(`Не удалось удалить тестовый household: ${deleteError.message}`);
    }
  }
  await supabase.auth.admin.deleteUser(user.id);

  if (fs.existsSync(STATE_FILE)) fs.rmSync(STATE_FILE);
}
