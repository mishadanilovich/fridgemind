"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/lib/form-state";
import { firstIssue } from "@/lib/form-state";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { type RecipeInput, recipeInputSchema } from "@/lib/zod-schemas";

// CRUD рецептов — запись только Организатору/Редактору (см. CLAUDE.md §5, RLS recipes).
// Дизайн: экран создания/редактирования и просмотра — FridgeMind.dc.html (showCreate/showRecipe).

export type SaveRecipeResult =
  | { error: string; recipeId?: undefined }
  | { error: null; recipeId: string };

// Записывает шаги и ингредиенты рецепта в рамках открытой транзакции (общее для create/update).
async function writeChildren(
  tx: Prisma.TransactionClient,
  recipeId: string,
  input: RecipeInput,
): Promise<void> {
  await tx.recipeStep.createMany({
    data: input.steps.map((s) => ({
      recipeId,
      order: s.order,
      instruction: s.instruction,
      photoUrl: s.photoUrl ?? null,
    })),
  });
  await tx.recipeIngredient.createMany({
    data: input.ingredients.map((i) => ({
      recipeId,
      ingredientId: i.ingredientId,
      quantity: i.quantity,
      unit: i.unit,
    })),
  });
}

export async function createRecipe(input: unknown): Promise<SaveRecipeResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };
  const data = parsed.data;

  const recipe = await prisma.$transaction(async (tx) => {
    const created = await tx.recipe.create({
      data: {
        householdId: user.householdId,
        title: data.title,
        photoUrl: data.photoUrl ?? null,
        baseServings: data.baseServings,
        cookTimeMinutes: data.cookTimeMinutes ?? null,
        cookingMethods: data.cookingMethods,
      },
    });
    await writeChildren(tx, created.id, data);
    return created;
  });

  revalidatePath("/recipes");
  return { error: null, recipeId: recipe.id };
}

export async function updateRecipe(recipeId: string, input: unknown): Promise<SaveRecipeResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };
  const data = parsed.data;

  // Проверяем принадлежность рецепта household перед изменением (updateMany в фильтре
  // не даст тронуть чужой, но нам нужно и переписать детей — поэтому сверяем явно).
  const owned = await prisma.recipe.findFirst({
    where: { id: recipeId, householdId: user.householdId },
    select: { id: true },
  });
  if (!owned) return { error: "Рецепт не найден" };

  await prisma.$transaction(async (tx) => {
    await tx.recipe.update({
      where: { id: recipeId },
      data: {
        title: data.title,
        photoUrl: data.photoUrl ?? null,
        baseServings: data.baseServings,
        cookTimeMinutes: data.cookTimeMinutes ?? null,
        cookingMethods: data.cookingMethods,
      },
    });
    // Простой replace вложенных сущностей вместо диффа (см. план этапа 4, Фаза C).
    await tx.recipeStep.deleteMany({ where: { recipeId } });
    await tx.recipeIngredient.deleteMany({ where: { recipeId } });
    await writeChildren(tx, recipeId, data);
  });

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  return { error: null, recipeId };
}

// Сколько приёмов пищи в меню используют рецепт — для предупреждения перед удалением
// (дизайн showDelRecipe: «пропадёт из меню на неделю»).
export async function getRecipeUsage(recipeId: string): Promise<number> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return 0;
  return prisma.menuDayMeal.count({
    where: { recipeId, recipe: { householdId: user.householdId } },
  });
}

export async function deleteRecipe(recipeId: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const owned = await prisma.recipe.findFirst({
    where: { id: recipeId, householdId: user.householdId },
    select: { id: true },
  });
  if (!owned) return { error: "Рецепт не найден" };

  // MenuDayMeal.recipe без onDelete cascade — удаляем зависимые приёмы пищи сами, иначе БД
  // отклонит удаление. Дизайн подтверждает: рецепт исчезает и из меню на неделю.
  await prisma.$transaction([
    prisma.menuDayMeal.deleteMany({ where: { recipeId } }),
    prisma.recipe.delete({ where: { id: recipeId } }),
  ]);

  revalidatePath("/recipes");
  return { error: null };
}
