"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { dateToIso } from "@/lib/dates";
import type { ActionResult } from "@/lib/form-state";
import { firstIssue } from "@/lib/form-state";
import { deductPantryItemQuantity } from "@/lib/pantry-quantity";
import { prisma } from "@/lib/prisma";
import type { EatDeductionView } from "@/lib/types";
import { mealDeductSchema } from "@/lib/zod-schemas";

// Отметка "скушано" и списание запасов доступны всем ролям household (см. CLAUDE.md §5) —
// достаточно залогиненного пользователя, роль не проверяется.

function revalidateMealScreens(dateIso: string) {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath(`/menu/${dateIso}`);
}

export type MarkEatenResult = ActionResult & { data?: EatDeductionView };

/**
 * Мгновенная отметка "скушано" — без подтверждений (см. CLAUDE.md §6, поток "отметил, что
 * скушал"). Возвращает payload для необязательного шита "Списать использованные продукты?":
 * ингредиенты рецепта в количествах на baseServings — клиент пересчитывает их под степпер
 * порций сам (scaleIngredient). Повторный вызов по уже съеденному приёму не перезаписывает
 * eatenAt/eatenByUserId, но payload всё равно возвращает.
 */
export async function markMealEaten(mealId: string): Promise<MarkEatenResult> {
  const user = await requireUser();

  const meal = await prisma.menuDayMeal.findFirst({
    where: { id: mealId, menuDay: { menuWeek: { householdId: user.householdId } } },
    select: {
      id: true,
      servings: true,
      isEaten: true,
      menuDay: { select: { date: true } },
      recipe: {
        select: {
          title: true,
          photoUrl: true,
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
    },
  });
  if (!meal) return { error: "Приём пищи не найден" };

  if (!meal.isEaten) {
    // updateMany вместо update: приём могли параллельно убрать из слота — P2025 уронил бы
    // экран вместо спокойного результата (сам payload при этом уже прочитан выше).
    await prisma.menuDayMeal.updateMany({
      where: { id: meal.id },
      data: { isEaten: true, eatenAt: new Date(), eatenByUserId: user.id },
    });
    revalidateMealScreens(dateToIso(meal.menuDay.date));
  }

  return {
    error: null,
    data: {
      mealId: meal.id,
      recipeTitle: meal.recipe.title,
      photoUrl: meal.recipe.photoUrl,
      servings: meal.servings,
      baseServings: meal.recipe.baseServings,
      ingredients: meal.recipe.ingredients.map((ri) => ({
        ingredientId: ri.ingredientId,
        name: ri.ingredient.name,
        unit: ri.unit,
        quantity: ri.quantity,
      })),
    },
  };
}

/**
 * Подтверждение списания из шита: запасы уменьшаются ровно на подтверждённые количества
 * (не ниже нуля, позиция с нулём остаётся в инвентаре — видно, что продукт закончился),
 * а MenuDayMeal.servings обновляется на выбранное в степпере значение — в истории остаётся
 * реальное число порций (см. CLAUDE.md §6). Продукты, которых нет в инвентаре, молча
 * пропускаются — списывать нечего.
 */
export async function deductMealIngredients(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = mealDeductSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };
  const { mealId, servings, items } = parsed.data;

  const dateIso = await prisma.$transaction(async (tx) => {
    const meal = await tx.menuDayMeal.findFirst({
      where: { id: mealId, menuDay: { menuWeek: { householdId: user.householdId } } },
      select: { id: true, menuDay: { select: { date: true } } },
    });
    if (!meal) return null;

    await tx.menuDayMeal.updateMany({ where: { id: meal.id }, data: { servings } });

    for (const item of items) {
      if (item.quantity <= 0) continue;
      await deductPantryItemQuantity(tx, {
        householdId: user.householdId,
        ingredientId: item.ingredientId,
        quantity: item.quantity,
      });
    }

    return dateToIso(meal.menuDay.date);
  });
  if (dateIso === null) return { error: "Приём пищи не найден" };

  revalidateMealScreens(dateIso);
  // Остатки изменились — пересчитываются и "есть/нужно" по дню, и список покупок.
  revalidatePath("/inventory");
  revalidatePath("/shopping-list");
  return { error: null };
}
