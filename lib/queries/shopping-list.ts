import { syncWeekItems } from "@/lib/actions/shopping-list";
import { dateToIso, isoToDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import type { DayIngredientView } from "@/lib/shopping-list";
import { compareDayIngredients, mealNeedsSelect, toMealNeedsSource } from "@/lib/shopping-list";
import type { ShoppingItemView } from "@/lib/types";

/**
 * Позиции списка покупок недели, с вкладами по дням и текущими остатками инвентаря.
 * Перед чтением пересинхронизирует позиции с меню недели (syncWeekItems, lib/actions/
 * shopping-list.ts — единственное исключение из read-only характера этого модуля: раз
 * ни одно действие меню/рецептов не поддерживает список покупок инкрементально, чтение
 * само доводит его до актуального состояния). Недели без единого назначенного рецепта
 * и без ручных позиций в БД нет — тогда список пуст.
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
      addedToPantry: true,
      isManual: true,
      manualCategory: true,
      ingredientId: true,
      ingredient: { select: { category: true } },
      boughtBy: { select: { name: true } },
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
      addedToPantry: row.addedToPantry,
      boughtByName: row.boughtBy?.name ?? null,
      quantity: row.quantity,
      pantryQuantity: row.ingredientId ? (pantryByIngredient.get(row.ingredientId) ?? 0) : 0,
      perDay,
    };
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
