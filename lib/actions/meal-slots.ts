"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, hasRole } from "@/lib/auth";
import { firstIssue, type FormState } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";
import { mealSlotNameSchema, mealSlotOrderSchema } from "@/lib/zod-schemas";

import type { ActionResult } from "./household";

// Управление слотами приёма пищи — только Организатор/Редактор (см. раздел 5, RLS meal_slots).
async function requireSlotEditor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, ["ORGANIZER", "EDITOR"])) return null;
  return user;
}

// Добавление слота — форма через useActionState (см. CLAUDE.md §10), поэтому сигнатура
// (prevState, formData). Успех помечаем data.ok, чтобы клиент очистил поле после добавления.
export async function createMealSlot(
  _prev: FormState<Record<string, never>, { ok: true }>,
  formData: FormData,
): Promise<FormState<Record<string, never>, { ok: true }>> {
  const user = await requireSlotEditor();
  if (!user) return { error: "Недостаточно прав" };

  const parsed = mealSlotNameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const last = await prisma.mealSlot.aggregate({
    where: { householdId: user.householdId, deletedAt: null },
    _max: { order: true },
  });
  await prisma.mealSlot.create({
    data: {
      householdId: user.householdId,
      name: parsed.data,
      order: (last._max.order ?? -1) + 1,
    },
  });
  revalidatePath("/profile");
  return { error: null, data: { ok: true } };
}

export async function renameMealSlot(slotId: string, name: string): Promise<ActionResult> {
  const user = await requireSlotEditor();
  if (!user) return { error: "Недостаточно прав" };

  const parsed = mealSlotNameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Некорректное название" };

  // Обновляем только в своём household — updateMany с householdId в фильтре не даст
  // тронуть чужой слот, даже если id угадан.
  const result = await prisma.mealSlot.updateMany({
    where: { id: slotId, householdId: user.householdId, deletedAt: null },
    data: { name: parsed.data },
  });
  if (result.count === 0) return { error: "Слот не найден" };

  revalidatePath("/profile");
  return { error: null };
}

// Удаление слота — soft-delete (см. раздел 5): старые MenuDayMeal в прошлых неделях остаются
// видны, но слот больше не предлагается при планировании.
export async function deleteMealSlot(slotId: string): Promise<ActionResult> {
  const user = await requireSlotEditor();
  if (!user) return { error: "Недостаточно прав" };

  const result = await prisma.mealSlot.updateMany({
    where: { id: slotId, householdId: user.householdId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return { error: "Слот не найден" };

  revalidatePath("/profile");
  return { error: null };
}

// Новый порядок слотов после drag-and-drop — order задаётся позицией id в массиве.
export async function reorderMealSlots(orderedIds: string[]): Promise<ActionResult> {
  const user = await requireSlotEditor();
  if (!user) return { error: "Недостаточно прав" };

  const parsed = mealSlotOrderSchema.safeParse(orderedIds);
  if (!parsed.success) return { error: "Некорректный порядок" };

  const slots = await prisma.mealSlot.findMany({
    where: { householdId: user.householdId, deletedAt: null },
    select: { id: true },
  });
  const ownIds = new Set(slots.map((s) => s.id));
  if (parsed.data.length !== ownIds.size || parsed.data.some((id) => !ownIds.has(id))) {
    return { error: "Набор слотов не совпадает" };
  }

  await prisma.$transaction(
    parsed.data.map((id, order) =>
      prisma.mealSlot.update({ where: { id }, data: { order } }),
    ),
  );
  revalidatePath("/profile");
  return { error: null };
}
