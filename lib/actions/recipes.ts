"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import type { ActionResult, FormState } from "@/lib/form-state";
import { fieldIssues, firstIssue } from "@/lib/form-state";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { orphanedStoragePaths, RECIPE_PHOTOS_BUCKET } from "@/lib/recipe-photos";
import { createStorageAdminClient } from "@/lib/supabase-admin";
import { type RecipeInput, recipeInputSchema } from "@/lib/zod-schemas";

// Запись рецептов — только Организатору/Редактору (см. CLAUDE.md §5, RLS recipes).

export type SaveRecipeResult =
  | { error: string; recipeId?: undefined }
  | { error: null; recipeId: string };

// Диф старых/новых photoUrl после успешного сохранения: файлы, на которые рецепт больше не
// ссылается, удаляются из Storage best-effort — неудача не откатывает сохранение, файл просто
// останется сиротой, как до чистки (issue #3). При soft-delete рецепта файлы НЕ трогаются:
// история меню открывает удалённый рецепт read-only вместе с фото (issue #5).
async function removeOrphanedPhotos(
  oldUrls: (string | null)[],
  keptUrls: (string | null)[],
): Promise<void> {
  const paths = orphanedStoragePaths(oldUrls, keptUrls);
  if (paths.length === 0) return;
  try {
    await createStorageAdminClient().from(RECIPE_PHOTOS_BUCKET).remove(paths);
  } catch {
    // намеренно проглатываем: best-effort
  }
}

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
        photoUrl: data.photoUrl,
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

  // updateMany вместо findFirst+update: ownership-проверка и мутация — одна атомарная операция
  // внутри транзакции, без разрыва между "проверили" и "изменили" (см. code review PR #2).
  // findFirst здесь только собирает старые photoUrl для чистки Storage — гейтом остаётся
  // updateMany, поэтому от его результата зависит лишь best-effort диф, не сама мутация.
  const oldPhotoUrls = await prisma.$transaction(async (tx) => {
    const existing = await tx.recipe.findFirst({
      where: { id: recipeId, householdId: user.householdId, deletedAt: null },
      select: { photoUrl: true, steps: { select: { photoUrl: true } } },
    });
    const updated = await tx.recipe.updateMany({
      where: { id: recipeId, householdId: user.householdId, deletedAt: null },
      data: {
        title: data.title,
        photoUrl: data.photoUrl,
        baseServings: data.baseServings,
        cookTimeMinutes: data.cookTimeMinutes ?? null,
        cookingMethods: data.cookingMethods,
      },
    });
    if (updated.count === 0) return null;

    await tx.recipeStep.deleteMany({ where: { recipeId } });
    await tx.recipeIngredient.deleteMany({ where: { recipeId } });
    await writeChildren(tx, recipeId, data);
    return existing ? [existing.photoUrl, ...existing.steps.map((s) => s.photoUrl)] : [];
  });
  if (oldPhotoUrls === null) return { error: "Рецепт не найден" };

  await removeOrphanedPhotos(oldPhotoUrls, [
    data.photoUrl,
    ...data.steps.map((s) => s.photoUrl ?? null),
  ]);

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/recipes/${recipeId}/edit`);
  return { error: null, recipeId };
}

// Форма создания/редактирования (useActionState): вложенные ингредиенты/шаги приходят JSON-
// строкой в скрытом поле payload; recipeId непустой — режим редактирования. Ошибки валидации
// возвращаются пополево (fieldErrors), остальные — общим error. Успех — redirect на рецепт.
export async function saveRecipe(_prev: FormState, formData: FormData): Promise<FormState> {
  const recipeId = String(formData.get("recipeId") ?? "").trim();

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Не удалось прочитать форму" };
  }

  const parsed = recipeInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: null, fieldErrors: fieldIssues(parsed.error.issues) };
  }

  const result = recipeId
    ? await updateRecipe(recipeId, parsed.data)
    : await createRecipe(parsed.data);
  if (result.error) return { error: result.error };

  redirect(`/recipes/${result.recipeId}`);
}

// Число будущих (не съеденных) приёмов пищи, которые удаление уберёт из плана — для
// предупреждения. Отмеченные "скушано" сюда не входят: soft-delete их сохраняет (issue #5).
export async function getRecipeUsage(recipeId: string): Promise<number> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return 0;
  return prisma.menuDayMeal.count({
    where: { recipeId, isEaten: false, recipe: { householdId: user.householdId } },
  });
}

export async function deleteRecipe(recipeId: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  // Soft-delete вместо жёсткого удаления (см. CLAUDE.md §5, GitHub issue #5): рецепт помечается
  // deletedAt и пропадает из списков/планов, но строка и её ингредиенты/шаги остаются в БД —
  // чтобы уже отмеченные "скушано" приёмы пищи в прошлых неделях сохранили полную историю.
  // Гибрид: будущие (не съеденные) MenuDayMeal всё же убираем из плана, eaten-записи не трогаем.
  // Ownership-проверка и мутация — одна атомарная транзакция; deletedAt: null защищает от
  // повторного удаления, scoped householdId — от гонки/чужого id.
  const notOwned = await prisma.$transaction(async (tx) => {
    const updated = await tx.recipe.updateMany({
      where: { id: recipeId, householdId: user.householdId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (updated.count === 0) return true;

    await tx.menuDayMeal.deleteMany({
      where: { recipeId, isEaten: false, recipe: { householdId: user.householdId } },
    });
    return false;
  });
  if (notOwned) return { error: "Рецепт не найден" };

  revalidatePath("/recipes");
  return { error: null };
}
