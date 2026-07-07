"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import type { ActionResult, FormState } from "@/lib/form-state";
import { firstIssue } from "@/lib/form-state";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { type RecipeInput, recipeInputSchema } from "@/lib/zod-schemas";

// Запись рецептов — только Организатору/Редактору (см. CLAUDE.md §5, RLS recipes).

export type SaveRecipeResult =
  | { error: string; recipeId?: undefined }
  | { error: null; recipeId: string };

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
    await tx.recipeStep.deleteMany({ where: { recipeId } });
    await tx.recipeIngredient.deleteMany({ where: { recipeId } });
    await writeChildren(tx, recipeId, data);
  });

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  return { error: null, recipeId };
}

// Форма создания/редактирования (useActionState): вложенные ингредиенты/шаги приходят JSON-
// строкой в скрытом поле payload; recipeId непустой — режим редактирования. При успехе —
// redirect на карточку рецепта, иначе ошибка через FormState.
export async function saveRecipe(_prev: FormState, formData: FormData): Promise<FormState> {
  const recipeId = String(formData.get("recipeId") ?? "").trim();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Не удалось прочитать форму" };
  }

  const result = recipeId
    ? await updateRecipe(recipeId, payload)
    : await createRecipe(payload);
  if (result.error) return { error: result.error };

  redirect(`/recipes/${result.recipeId}`);
}

// Число приёмов пищи в меню, использующих рецепт — для предупреждения перед удалением.
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

  // MenuDayMeal.recipe без onDelete cascade — снимаем рецепт из меню сами, иначе БД отклонит.
  await prisma.$transaction([
    prisma.menuDayMeal.deleteMany({ where: { recipeId } }),
    prisma.recipe.delete({ where: { id: recipeId } }),
  ]);

  revalidatePath("/recipes");
  return { error: null };
}
