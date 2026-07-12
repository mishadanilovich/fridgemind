"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { type ActionResult, firstIssue, type FormState } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";
import { mealSlotNameSchema, mealSlotOrderSchema } from "@/lib/zod-schemas";

// Управление слотами приёма пищи — только Организатор/Редактор (см. раздел 5, RLS meal_slots).

const NAME_TAKEN = "Такой приём пищи уже есть";

// Набор и порядок слотов виден не только в профиле: из них состоят экраны "Сегодня",
// "Меню на неделю" и просмотр дня.
function revalidateSlots() {
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/menu", "layout");
}

// Добавление слота — форма через useActionState (см. CLAUDE.md §10), поэтому сигнатура
// (prevState, formData). Успех помечаем data.ok, чтобы клиент очистил поле после добавления.
export async function createMealSlot(
  _prev: FormState<Record<string, never>, { ok: true }>,
  formData: FormData,
): Promise<FormState<Record<string, never>, { ok: true }>> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsed = mealSlotNameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };
  const name = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const taken = await tx.mealSlot.findFirst({
      where: {
        householdId: user.householdId,
        deletedAt: null,
        name: { equals: name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (taken) return { error: NAME_TAKEN };

    const last = await tx.mealSlot.aggregate({
      where: { householdId: user.householdId, deletedAt: null },
      _max: { order: true },
    });
    const order = (last._max.order ?? -1) + 1;

    // Слот с таким именем уже был и удалён — воскрешаем ту же запись, а не заводим вторую
    // (см. CLAUDE.md §5, "Защита от дублей при пересоздании"). Иначе к старому id остались бы
    // привязаны MenuDayMeal текущей/будущей недели, и в одном дне было бы видно два "Ужина".
    const deleted = await tx.mealSlot.findFirst({
      where: {
        householdId: user.householdId,
        deletedAt: { not: null },
        name: { equals: name, mode: "insensitive" },
      },
      orderBy: { deletedAt: "desc" },
      select: { id: true },
    });
    if (deleted) {
      await tx.mealSlot.update({
        where: { id: deleted.id },
        data: { name, order, deletedAt: null },
      });
      return { error: null };
    }

    await tx.mealSlot.create({ data: { householdId: user.householdId, name, order } });
    return { error: null };
  });
  if (result.error) return { error: result.error };

  revalidateSlots();
  return { error: null, data: { ok: true } };
}

export async function renameMealSlot(slotId: string, name: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsed = mealSlotNameSchema.safeParse(name);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
    // Имя занято другим активным слотом household — двух "Ужинов" в одном дне быть не должно
    // (удалённые не мешают: их не видно при планировании).
    const taken = await tx.mealSlot.findFirst({
      where: {
        householdId: user.householdId,
        deletedAt: null,
        id: { not: slotId },
        name: { equals: parsed.data, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (taken) return { error: NAME_TAKEN };

    // Обновляем только в своём household — updateMany с householdId в фильтре не даст
    // тронуть чужой слот, даже если id угадан.
    const updated = await tx.mealSlot.updateMany({
      where: { id: slotId, householdId: user.householdId, deletedAt: null },
      data: { name: parsed.data },
    });
    if (updated.count === 0) return { error: "Слот не найден" };

    return { error: null };
  });
  if (result.error) return result;

  revalidateSlots();
  return { error: null };
}

// Удаление слота — soft-delete (см. раздел 5): старые MenuDayMeal в прошлых неделях остаются
// видны, но слот больше не предлагается при планировании.
export async function deleteMealSlot(slotId: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const result = await prisma.mealSlot.updateMany({
    where: { id: slotId, householdId: user.householdId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (result.count === 0) return { error: "Слот не найден" };

  revalidateSlots();
  return { error: null };
}

// Новый порядок слотов после drag-and-drop — order задаётся позицией id в массиве.
export async function reorderMealSlots(orderedIds: string[]): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
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
  revalidateSlots();
  return { error: null };
}
