"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, requireRole } from "@/lib/auth";
import { type ActionResult, firstIssue, type FormState } from "@/lib/form-state";
import type { Prisma } from "@/lib/generated/prisma/client";
import { canLeaveHousehold, organizerCount, wouldKeepOrganizer } from "@/lib/household-rules";
import { prisma } from "@/lib/prisma";
import type { HouseholdRole, HouseholdRoleValue } from "@/lib/types";
import { householdNameSchema, householdRoleSchema } from "@/lib/zod-schemas";

// Участники household, перечитанные с блокировкой строк (FOR UPDATE) внутри транзакции —
// чтобы проверка инварианта "хотя бы один Организатор" и запись были атомарны и две
// одновременные операции не прошли проверку обе (см. CLAUDE.md §5, TOCTOU-гонка).
async function lockHouseholdMembers(
  tx: Prisma.TransactionClient,
  householdId: string,
): Promise<{ id: string; role: HouseholdRole }[]> {
  return tx.$queryRaw<{ id: string; role: HouseholdRole }[]>`
    select id, role from public.users where household_id = ${householdId} for update
  `;
}

export type HouseholdNameState = FormState<{ name: string }>;

// Стартовый набор слотов при создании household — тот же, что в handle_new_user
// (см. миграцию rls_and_triggers). Держим в синхроне.
const DEFAULT_MEAL_SLOTS = ["Завтрак", "Обед", "Ужин"];

// Отселяет пользователя в новый пустой household (с дефолтными слотами) и делает его
// Организатором. Используется и при выходе, и при удалении участника Организатором —
// у пользователя всегда должен быть ровно один household (schema: householdId обязателен).
// Принимает транзакционный клиент, чтобы вызываться внутри уже открытой транзакции с
// заблокированными строками участников (см. lockHouseholdMembers).
async function moveUserToFreshHousehold(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const household = await tx.household.create({ data: {} });
  await tx.mealSlot.createMany({
    data: DEFAULT_MEAL_SLOTS.map((name, order) => ({ householdId: household.id, name, order })),
  });
  await tx.user.update({
    where: { id: userId },
    data: { householdId: household.id, role: "ORGANIZER" },
  });
}

// Переименование household — только Организатор (см. раздел 5, RLS households). Пустая
// строка сбрасывает название в null ("Ваша семья" на экране).
export async function renameHousehold(
  _prev: HouseholdNameState,
  formData: FormData,
): Promise<HouseholdNameState> {
  const user = await requireRole(["ORGANIZER"]);
  if (!user) return { error: "Только Организатор может переименовать семью" };

  const raw = String(formData.get("name") ?? "");
  const parsed = householdNameSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error.issues), values: { name: raw } };
  }

  await prisma.household.update({
    where: { id: user.householdId },
    data: { name: parsed.data || null },
  });
  revalidatePath("/profile");
  // На успехе values не возвращаем: по контракту FormState они только для восстановления
  // введённого после ошибки, иначе defaultValue={state.values?.name} навсегда затенил бы
  // revalidated-проп name (см. CLAUDE.md §10, FormState).
  return { error: null };
}

// Смена роли участника — только Организатор; нельзя понизить последнего Организатора.
export async function changeMemberRole(
  targetUserId: string,
  role: HouseholdRoleValue,
): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsed = householdRoleSchema.safeParse(role);
  if (!parsed.success) return { error: "Некорректная роль" };

  const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
    const members = await lockHouseholdMembers(tx, user.householdId);
    if (!members.some((m) => m.id === targetUserId)) {
      return { error: "Участник не найден в вашей семье" };
    }
    if (!wouldKeepOrganizer(members, targetUserId, parsed.data)) {
      return { error: "В семье должен остаться хотя бы один Организатор" };
    }
    await tx.user.update({ where: { id: targetUserId }, data: { role: parsed.data } });
    return { error: null };
  });

  if (!result.error) revalidatePath("/profile");
  return result;
}

// Удаление участника из household — только Организатор, и не самого себя (для себя есть
// "Покинуть семью"). Удалённый отселяется в свой новый household.
export async function removeMember(targetUserId: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER"]);
  if (!user) return { error: "Недостаточно прав" };
  if (targetUserId === user.id) return { error: "Нельзя удалить самого себя" };

  const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
    const members = await lockHouseholdMembers(tx, user.householdId);
    if (!members.some((m) => m.id === targetUserId)) {
      return { error: "Участник не найден в вашей семье" };
    }
    // Перечитанный с блокировкой набор защищает от гонки, где параллельная смена ролей
    // понизила единственного оставшегося Организатора: после удаления цели в семье всё ещё
    // должен остаться хотя бы один Организатор.
    const remaining = members.filter((m) => m.id !== targetUserId);
    if (organizerCount(remaining) < 1) {
      return { error: "В семье должен остаться хотя бы один Организатор" };
    }
    await moveUserToFreshHousehold(tx, targetUserId);
    return { error: null };
  });

  if (!result.error) revalidatePath("/profile");
  return result;
}

// Выход из household — с проверкой инварианта "хотя бы один Организатор" (см. household-rules).
export async function leaveHousehold(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
    const members = await lockHouseholdMembers(tx, user.householdId);
    const check = canLeaveHousehold(user.id, members);
    if (!check.allowed) return { error: check.reason ?? "Сейчас нельзя покинуть семью" };
    await moveUserToFreshHousehold(tx, user.id);
    return { error: null };
  });

  if (result.error) return result;
  redirect("/");
}

// Регенерация ссылки-приглашения — только Организатор. Новый код доносится до клиента
// единственным каналом — revalidatePath обновляет серверный компонент и прокидывает свежий
// inviteCode пропом в InviteSection (без второго источника истины в локальном состоянии).
export async function regenerateInviteCode(): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER"]);
  if (!user) return { error: "Недостаточно прав" };

  await prisma.household.update({
    where: { id: user.householdId },
    data: { inviteCode: crypto.randomUUID() },
  });
  revalidatePath("/profile");
  return { error: null };
}
