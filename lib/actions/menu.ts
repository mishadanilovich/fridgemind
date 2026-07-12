"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { dateToIso, isoToDate, startOfWeekIso } from "@/lib/dates";
import { type ActionResult, firstIssue } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";
import { menuAssignSchema } from "@/lib/zod-schemas";

// Планирование меню (назначить/убрать рецепт в слоте) — только Организатор/Редактор
// (см. CLAUDE.md §5, RLS menu_day_meals).

function revalidateMenu(dateIso: string) {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath(`/menu/${dateIso}`);
}

export async function assignMeal(input: unknown): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsed = menuAssignSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };
  const { date, mealSlotId, recipeId, servings } = parsed.data;

  // Неделя и день создаются лениво — до первого назначения рецепта их в БД нет.
  const weekStartDate = isoToDate(startOfWeekIso(date));

  const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
    // Слот и рецепт — обязательно свои и не удалённые: id приходит с клиента, доверять ему
    // нельзя. Проверка идёт в той же транзакции, что и запись, чтобы между ними не попало
    // чужое чтение-запись, но от soft-delete, закоммиченного параллельно, она не защищает:
    // под READ COMMITTED без FOR UPDATE строку никто не держит. Такой приём пищи просто
    // окажется в удалённом слоте — buildDaySlots его показывает, а не теряет (см. lib/menu.ts).
    const [slot, recipe] = await Promise.all([
      tx.mealSlot.findFirst({
        where: { id: mealSlotId, householdId: user.householdId, deletedAt: null },
        select: { id: true },
      }),
      tx.recipe.findFirst({
        where: { id: recipeId, householdId: user.householdId, deletedAt: null },
        select: { id: true },
      }),
    ]);
    if (!slot) return { error: "Приём пищи не найден" };
    if (!recipe) return { error: "Рецепт не найден" };

    const week = await tx.menuWeek.upsert({
      where: {
        householdId_weekStartDate: { householdId: user.householdId, weekStartDate },
      },
      create: { householdId: user.householdId, weekStartDate },
      update: {},
      select: { id: true },
    });

    const day = await tx.menuDay.upsert({
      where: { menuWeekId_date: { menuWeekId: week.id, date: isoToDate(date) } },
      create: { menuWeekId: week.id, date: isoToDate(date) },
      update: {},
      select: { id: true },
    });

    // Замена рецепта в уже занятом слоте — это тот же upsert: одна запись на (день, слот).
    await tx.menuDayMeal.upsert({
      where: { menuDayId_mealSlotId: { menuDayId: day.id, mealSlotId } },
      create: { menuDayId: day.id, mealSlotId, recipeId, servings },
      update: { recipeId, servings },
    });

    return { error: null };
  });

  if (result.error) return result;

  revalidateMenu(date);
  return { error: null };
}

// "Убрать" рецепт из слота (см. CLAUDE.md §6, поток "убрать рецепт из дня меню"): запись
// MenuDayMeal удаляется, слот возвращается в пустое состояние. Уже отмеченное "скушано"
// удалению не мешает, но ранее подтверждённое списание из инвентаря не отменяется.
export async function removeMeal(mealId: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  // Дата нужна только для revalidatePath; само удаление — deleteMany со scope по household,
  // а не delete по id: тот бросил бы P2025, если запись уже убрал другой участник household
  // (или второй клик по той же кнопке), а необработанное исключение вместо { error } уронило бы
  // экран. deleteMany просто вернёт count = 0.
  const meal = await prisma.menuDayMeal.findFirst({
    where: { id: mealId, menuDay: { menuWeek: { householdId: user.householdId } } },
    select: { menuDay: { select: { date: true } } },
  });
  if (!meal) return { error: "Приём пищи не найден" };

  const deleted = await prisma.menuDayMeal.deleteMany({
    where: { id: mealId, menuDay: { menuWeek: { householdId: user.householdId } } },
  });
  if (deleted.count === 0) return { error: "Приём пищи не найден" };

  revalidateMenu(dateToIso(meal.menuDay.date));
  return { error: null };
}
