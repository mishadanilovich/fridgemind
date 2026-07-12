import { dateToIso, isoToDate, startOfWeekIso, todayIso } from "@/lib/dates";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DayIngredientView, IngredientNeed, MealNeedsSource } from "@/lib/shopping-list";
import { aggregateWeekNeeds, compareDayIngredients } from "@/lib/shopping-list";
import type { ManualShoppingItemInput, ShoppingItemView } from "@/lib/types";

const mealNeedsSelect = {
  id: true,
  servings: true,
  recipe: {
    select: {
      baseServings: true,
      ingredients: {
        select: {
          ingredientId: true,
          quantity: true,
          unit: true,
          ingredient: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.MenuDayMealSelect;

type MealNeedsRow = Prisma.MenuDayMealGetPayload<{ select: typeof mealNeedsSelect }>;

function toMealNeedsSource(row: MealNeedsRow): MealNeedsSource {
  return {
    id: row.id,
    servings: row.servings,
    recipe: {
      baseServings: row.recipe.baseServings,
      ingredients: row.recipe.ingredients.map((ri) => ({
        ingredientId: ri.ingredientId,
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
    },
  };
}

type ExistingItem = {
  id: string;
  ingredientId: string | null;
  name: string;
  quantity: number;
  meals: { menuDayMealId: string; quantity: number }[];
};

function sameContributions(existing: ExistingItem, need: IngredientNeed): boolean {
  if (existing.meals.length !== need.contributions.length) return false;
  const byMeal = new Map(existing.meals.map((m) => [m.menuDayMealId, m.quantity]));
  return need.contributions.every((c) => byMeal.get(c.menuDayMealId) === c.quantity);
}

// Синхронизация позиций недели с текущим меню (см. CLAUDE.md §6, поток "список покупок").
// Вызывается при чтении списка, а не из каждого экшена меню/рецептов: потребность меняют
// и назначение/снятие рецепта, и правка servings, и редактирование/удаление самого рецепта —
// пересчёт на чтении покрывает все источники разом. Идёт diff'ом: без изменений в меню
// повторное открытие экрана не пишет в БД вовсе. isBought/addedToPantry живут на позиции
// и переживают пересчёт количества; ручные позиции (isManual) не трогаются.
async function syncWeekItems(householdId: string, weekId: string): Promise<void> {
  const [mealRows, existing] = await Promise.all([
    prisma.menuDayMeal.findMany({
      where: { menuDay: { menuWeekId: weekId } },
      select: mealNeedsSelect,
    }),
    prisma.shoppingListItem.findMany({
      where: { weekId, isManual: false },
      select: {
        id: true,
        ingredientId: true,
        name: true,
        quantity: true,
        meals: { select: { menuDayMealId: true, quantity: true } },
      },
    }),
  ]);

  const needs = aggregateWeekNeeds(mealRows.map(toMealNeedsSource));

  const stale = existing.filter(
    (item) => item.ingredientId === null || !needs.has(item.ingredientId),
  );
  const byIngredient = new Map(
    existing.flatMap((item) => (item.ingredientId ? [[item.ingredientId, item] as const] : [])),
  );
  const changed = [...needs.values()].filter((need) => {
    const current = byIngredient.get(need.ingredientId);
    return (
      !current ||
      current.quantity !== need.total ||
      current.name !== need.name ||
      !sameContributions(current, need)
    );
  });

  if (stale.length === 0 && changed.length === 0) return;

  await prisma.$transaction(async (tx) => {
    if (stale.length > 0) {
      await tx.shoppingListItem.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    }
    for (const need of changed) {
      const item = await tx.shoppingListItem.upsert({
        where: { weekId_ingredientId: { weekId, ingredientId: need.ingredientId } },
        create: {
          householdId,
          weekId,
          ingredientId: need.ingredientId,
          name: need.name,
          quantity: need.total,
          unit: need.unit,
        },
        update: { name: need.name, quantity: need.total, unit: need.unit },
        select: { id: true },
      });
      await tx.shoppingListItemMeal.deleteMany({ where: { shoppingListItemId: item.id } });
      await tx.shoppingListItemMeal.createMany({
        data: need.contributions.map((c) => ({
          shoppingListItemId: item.id,
          menuDayMealId: c.menuDayMealId,
          quantity: c.quantity,
        })),
      });
    }
  });
}

/**
 * Позиции списка покупок недели, с вкладами по дням и текущими остатками инвентаря.
 * Перед чтением пересинхронизирует позиции с меню недели. Недели без единого назначенного
 * рецепта и без ручных позиций в БД нет — тогда список пуст.
 */
export async function getShoppingListView(
  householdId: string,
  weekStartIso: string,
): Promise<ShoppingItemView[]> {
  const week = await prisma.menuWeek.findUnique({
    where: {
      householdId_weekStartDate: { householdId, weekStartDate: isoToDate(weekStartIso) },
    },
    select: { id: true },
  });
  if (!week) return [];

  await syncWeekItems(householdId, week.id);

  const rows = await prisma.shoppingListItem.findMany({
    where: { weekId: week.id },
    select: {
      id: true,
      name: true,
      quantity: true,
      unit: true,
      isBought: true,
      isManual: true,
      manualCategory: true,
      ingredientId: true,
      ingredient: { select: { category: true } },
      meals: {
        select: {
          quantity: true,
          menuDayMeal: { select: { menuDay: { select: { date: true } } } },
        },
      },
    },
  });

  const pantry = await prisma.pantryItem.findMany({
    where: {
      householdId,
      ingredientId: { in: rows.flatMap((r) => (r.ingredientId ? [r.ingredientId] : [])) },
    },
    select: { ingredientId: true, quantity: true },
  });
  const pantryByIngredient = new Map(pantry.map((p) => [p.ingredientId, p.quantity]));

  return rows.map((row) => {
    const perDay: Record<string, number> = {};
    for (const contribution of row.meals) {
      const day = dateToIso(contribution.menuDayMeal.menuDay.date);
      perDay[day] = (perDay[day] ?? 0) + contribution.quantity;
    }
    return {
      id: row.id,
      name: row.name,
      unit: row.unit,
      category: row.ingredient?.category ?? row.manualCategory ?? "OTHER",
      isManual: row.isManual,
      isBought: row.isBought,
      quantity: row.quantity,
      pantryQuantity: row.ingredientId ? (pantryByIngredient.get(row.ingredientId) ?? 0) : 0,
      perDay,
    };
  });
}

/**
 * Ручная позиция списка покупок — общий путь записи для server action и POST /api/shopping-list.
 * Живёт на текущей неделе; MenuWeek заводится тем же лениво-upsert'ом, что и при назначении
 * рецепта. Штучные количества округляются до целого — дробных штук не бывает.
 */
export async function createManualShoppingItem(
  householdId: string,
  input: ManualShoppingItemInput,
): Promise<{ id: string }> {
  const quantity =
    input.unit === "PCS" ? Math.max(1, Math.round(input.quantity)) : input.quantity;
  const weekStartDate = isoToDate(startOfWeekIso(todayIso()));

  return prisma.$transaction(async (tx) => {
    const week = await tx.menuWeek.upsert({
      where: { householdId_weekStartDate: { householdId, weekStartDate } },
      create: { householdId, weekStartDate },
      update: {},
      select: { id: true },
    });
    return tx.shoppingListItem.create({
      data: {
        householdId,
        weekId: week.id,
        name: input.name,
        quantity,
        unit: input.unit,
        isManual: true,
        manualCategory: input.manualCategory,
      },
      select: { id: true },
    });
  });
}

/** Ингредиенты всех приёмов пищи дня с отметкой "есть дома"/"нужно купить" (MVP-пункт 6). */
export async function getDayIngredients(
  householdId: string,
  dateIso: string,
): Promise<DayIngredientView[]> {
  const meals = await prisma.menuDayMeal.findMany({
    where: { menuDay: { date: isoToDate(dateIso), menuWeek: { householdId } } },
    select: mealNeedsSelect,
  });
  if (meals.length === 0) return [];

  const sources = meals.map(toMealNeedsSource);
  const ingredientIds = [
    ...new Set(sources.flatMap((m) => m.recipe.ingredients.map((ri) => ri.ingredientId))),
  ];
  const pantry = await prisma.pantryItem.findMany({
    where: { householdId, ingredientId: { in: ingredientIds } },
    select: { ingredientId: true, quantity: true },
  });

  return compareDayIngredients(sources, new Map(pantry.map((p) => [p.ingredientId, p.quantity])));
}
