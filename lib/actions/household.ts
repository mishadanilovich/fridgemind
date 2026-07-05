"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, hasRole } from "@/lib/auth";
import { firstIssue, type FormState } from "@/lib/form-state";
import { canLeaveHousehold, wouldKeepOrganizer } from "@/lib/household-rules";
import { prisma } from "@/lib/prisma";
import type { HouseholdRoleValue } from "@/lib/types";
import { householdNameSchema, householdRoleSchema } from "@/lib/zod-schemas";

/** Результат императивных экшенов (не форм) — читается клиентом для показа ошибки. */
export type ActionResult = { error: string | null };

export type HouseholdNameState = FormState<{ name: string }>;

// Стартовый набор слотов при создании household — тот же, что в handle_new_user
// (см. миграцию rls_and_triggers). Держим в синхроне.
const DEFAULT_MEAL_SLOTS = ["Завтрак", "Обед", "Ужин"];

// Отселяет пользователя в новый пустой household (с дефолтными слотами) и делает его
// Организатором. Используется и при выходе, и при удалении участника Организатором —
// у пользователя всегда должен быть ровно один household (schema: householdId обязателен).
async function moveUserToFreshHousehold(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const household = await tx.household.create({ data: {} });
    await tx.mealSlot.createMany({
      data: DEFAULT_MEAL_SLOTS.map((name, order) => ({ householdId: household.id, name, order })),
    });
    await tx.user.update({
      where: { id: userId },
      data: { householdId: household.id, role: "ORGANIZER" },
    });
  });
}

// Переименование household — только Организатор (см. раздел 5, RLS households). Пустая
// строка сбрасывает название в null ("Ваша семья" на экране).
export async function renameHousehold(
  _prev: HouseholdNameState,
  formData: FormData,
): Promise<HouseholdNameState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, ["ORGANIZER"])) {
    return { error: "Только Организатор может переименовать семью" };
  }

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
  return { error: null, values: { name: parsed.data } };
}

// Смена роли участника — только Организатор; нельзя понизить последнего Организатора.
export async function changeMemberRole(
  targetUserId: string,
  role: HouseholdRoleValue,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, ["ORGANIZER"])) return { error: "Недостаточно прав" };

  const parsed = householdRoleSchema.safeParse(role);
  if (!parsed.success) return { error: "Некорректная роль" };

  const members = await prisma.user.findMany({
    where: { householdId: user.householdId },
    select: { id: true, role: true },
  });
  if (!members.some((m) => m.id === targetUserId)) {
    return { error: "Участник не найден в вашей семье" };
  }
  if (!wouldKeepOrganizer(members, targetUserId, parsed.data)) {
    return { error: "В семье должен остаться хотя бы один Организатор" };
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { role: parsed.data } });
  revalidatePath("/profile");
  return { error: null };
}

// Удаление участника из household — только Организатор, и не самого себя (для себя есть
// "Покинуть семью"). Удалённый отселяется в свой новый household.
export async function removeMember(targetUserId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, ["ORGANIZER"])) return { error: "Недостаточно прав" };
  if (targetUserId === user.id) return { error: "Нельзя удалить самого себя" };

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { householdId: true },
  });
  if (!target || target.householdId !== user.householdId) {
    return { error: "Участник не найден в вашей семье" };
  }

  await moveUserToFreshHousehold(targetUserId);
  revalidatePath("/profile");
  return { error: null };
}

// Выход из household — с проверкой инварианта "хотя бы один Организатор" (см. household-rules).
export async function leaveHousehold(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const members = await prisma.user.findMany({
    where: { householdId: user.householdId },
    select: { id: true, role: true },
  });
  const check = canLeaveHousehold(user.id, members);
  if (!check.allowed) return { error: check.reason ?? "Сейчас нельзя покинуть семью" };

  await moveUserToFreshHousehold(user.id);
  redirect("/");
}

// Регенерация ссылки-приглашения — только Организатор. Возвращает новый код клиенту,
// чтобы обновить отображаемую ссылку без перезагрузки.
export async function regenerateInviteCode(): Promise<ActionResult & { inviteCode?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, ["ORGANIZER"])) return { error: "Недостаточно прав" };

  const household = await prisma.household.update({
    where: { id: user.householdId },
    data: { inviteCode: crypto.randomUUID() },
  });
  revalidatePath("/profile");
  return { error: null, inviteCode: household.inviteCode };
}
