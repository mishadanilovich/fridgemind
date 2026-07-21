import { dateToIso, isoToDate, weekDatesIso } from "@/lib/dates";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { DayMeal } from "@/lib/menu";
import { buildDaySlots } from "@/lib/menu";
import { prisma } from "@/lib/prisma";
import type { MenuDayView, MenuTemplateCardView, PickerRecipeView } from "@/lib/types";

const mealSelect = {
  id: true,
  recipeId: true,
  servings: true,
  isEaten: true,
  mealSlot: { select: { id: true, name: true } },
  recipe: {
    select: {
      title: true,
      photoUrl: true,
      cookTimeMinutes: true,
      cookingMethods: true,
    },
  },
} satisfies Prisma.MenuDayMealSelect;

type MealRow = Prisma.MenuDayMealGetPayload<{ select: typeof mealSelect }>;

function toDayMeal(row: MealRow): DayMeal {
  return {
    slotId: row.mealSlot.id,
    slotName: row.mealSlot.name,
    meal: {
      id: row.id,
      recipeId: row.recipeId,
      title: row.recipe.title,
      photoUrl: row.recipe.photoUrl,
      cookTimeMinutes: row.recipe.cookTimeMinutes,
      cookingMethods: row.recipe.cookingMethods,
      servings: row.servings,
      isEaten: row.isEaten,
    },
  };
}

function activeSlots(householdId: string) {
  return prisma.mealSlot.findMany({
    where: { householdId, deletedAt: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
}

// Неделя/дни создаются лениво — при первом назначении рецепта (см. lib/actions/menu.ts), поэтому
// на чтении их может не быть вовсе: тогда у всех дней просто пустые слоты.
export async function getWeekBoard(
  householdId: string,
  weekStartIso: string,
  canEdit: boolean,
): Promise<MenuDayView[]> {
  const [slots, days] = await Promise.all([
    activeSlots(householdId),
    prisma.menuDay.findMany({
      where: {
        menuWeek: { householdId, weekStartDate: isoToDate(weekStartIso) },
      },
      select: { date: true, meals: { select: mealSelect } },
    }),
  ]);

  const mealsByDate = new Map(days.map((day) => [dateToIso(day.date), day.meals.map(toDayMeal)]));

  return weekDatesIso(weekStartIso).map((date) => ({
    date,
    slots: buildDaySlots(slots, mealsByDate.get(date) ?? [], canEdit),
  }));
}

export async function getDayBoard(
  householdId: string,
  dateIso: string,
  canEdit: boolean,
): Promise<MenuDayView> {
  const [slots, day] = await Promise.all([
    activeSlots(householdId),
    prisma.menuDay.findFirst({
      where: { date: isoToDate(dateIso), menuWeek: { householdId } },
      select: { meals: { select: mealSelect } },
    }),
  ]);

  return {
    date: dateIso,
    slots: buildDaySlots(slots, (day?.meals ?? []).map(toDayMeal), canEdit),
  };
}

/** Шаблоны меню household для экрана "Шаблоны" (см. CLAUDE.md §5). Новые — сверху. */
export async function getMenuTemplates(householdId: string): Promise<MenuTemplateCardView[]> {
  const templates = await prisma.menuTemplate.findMany({
    where: { householdId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, _count: { select: { meals: true } } },
  });
  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    createdAtIso: dateToIso(t.createdAt),
    mealCount: t._count.meals,
  }));
}

/** Активные рецепты household для шторки выбора рецепта на слот. */
export async function getPickerRecipes(householdId: string): Promise<PickerRecipeView[]> {
  return prisma.recipe.findMany({
    where: { householdId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      photoUrl: true,
      cookTimeMinutes: true,
      cookingMethods: true,
      baseServings: true,
    },
  });
}
