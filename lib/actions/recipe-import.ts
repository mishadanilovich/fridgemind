"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { firstIssue } from "@/lib/form-state";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildImportPreview,
  findUnitConflicts,
  type ImportPreview,
  type ImportRecipe,
  type ImportResolution,
  mergeResolvedIngredients,
  parseImportJson,
  recipeImportConfirmSchema,
} from "@/lib/recipe-import";
import type { ProductCategory, Unit, UnitType } from "@/lib/types";
import { UNIT_TO_TYPE } from "@/lib/units";

// Импорт рецептов — только Организатору/Редактору (см. CLAUDE.md §5, RLS recipes).

const norm = (name: string) => name.trim().toLowerCase();

type CatalogEntry = { id: string; name: string; defaultUnitType: UnitType };

// Каталог глобальный и для personal-use небольшой — читаем целиком и строим индекс по имени
// (в нижнем регистре), чтобы сопоставлять точным совпадением без учёта регистра. defaultUnitType
// нужен для проверки единиц (см. findUnitConflicts).
async function loadIngredientIndex(): Promise<Map<string, CatalogEntry>> {
  const all = await prisma.ingredient.findMany({
    select: { id: true, name: true, defaultUnitType: true },
  });
  return new Map(all.map((i) => [norm(i.name), i]));
}

function catalogTypeByName(index: Map<string, CatalogEntry>): Map<string, UnitType> {
  return new Map([...index].map(([key, entry]) => [key, entry.defaultUnitType]));
}

export type PrepareImportResult =
  | { error: string; preview?: undefined }
  | { error: null; preview: ImportPreview };

// Шаг 1: разобрать JSON, сопоставить ингредиенты со справочником, вернуть превью. Ничего не
// сохраняется (см. CLAUDE.md §5, "Логика импорта").
export async function prepareRecipeImport(rawJson: string): Promise<PrepareImportResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsed = parseImportJson(rawJson);
  if (!parsed.ok) return { error: parsed.error };

  const index = await loadIngredientIndex();

  // Единицы важнее сопоставления имён: файл с несогласованными единицами нельзя импортировать,
  // поэтому блокируем ещё до превью — иначе пользователь дошёл бы до "Импортировать" впустую.
  const conflicts = findUnitConflicts(parsed.recipes, catalogTypeByName(index));
  if (conflicts.length > 0) return { error: conflicts[0]! };

  const preview = buildImportPreview(parsed.recipes, new Set(index.keys()));
  return { error: null, preview };
}

export type ConfirmImportResult =
  | { error: string; createdCount?: undefined }
  | { error: null; createdCount: number };

// Существующий продукт из резолвинга — проверяем, что id реально есть в каталоге (id с клиента).
// Новый — создаём (или забираем победителя гонки по name @unique), unitType из единицы в файле.
async function resolveNewIngredientId(
  name: string,
  unit: Unit,
  category: ProductCategory,
): Promise<string> {
  const existing = await prisma.ingredient.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  try {
    const created = await prisma.ingredient.create({
      data: { name, defaultUnitType: UNIT_TO_TYPE[unit], category },
      select: { id: true },
    });
    return created.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const raced = await prisma.ingredient.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
        select: { id: true },
      });
      if (raced) return raced.id;
    }
    throw e;
  }
}

// Шаг 2: создать рецепты. JSON парсится заново (источник истины, клиенту не доверяем),
// несовпавшие имена берутся из резолвингов. Новые Ingredient создаются ДО транзакции — как в
// confirmRecognizedProducts: ошибку/гонку внутри interactive-транзакции Postgres не даёт
// обработать без её отката, а лишний глобальный продукт безвреден.
export async function confirmRecipeImport(input: unknown): Promise<ConfirmImportResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsedInput = recipeImportConfirmSchema.safeParse(input);
  if (!parsedInput.success) return { error: firstIssue(parsedInput.error.issues) };

  const parsed = parseImportJson(parsedInput.data.json);
  if (!parsed.ok) return { error: parsed.error };
  const recipes = parsed.recipes;
  const resolutions = parsedInput.data.resolutions as Record<string, ImportResolution>;

  const index = await loadIngredientIndex();

  // Та же проверка единиц, что и в prepare, но здесь она авторитетна: клиент мог прислать JSON
  // мимо экрана превью.
  const conflicts = findUnitConflicts(recipes, catalogTypeByName(index));
  if (conflicts.length > 0) return { error: conflicts[0]! };

  const typeById = new Map([...index.values()].map((i) => [i.id, i.defaultUnitType]));

  // Имя (нижний регистр) → Ingredient.id. Совпавшие берём из каталога, несовпавшие — из
  // резолвингов. unit несовпавшего берём из первого вхождения в файле (для unitType нового).
  const idByName = new Map<string, string>();
  const firstUnit = new Map<string, Unit>();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = norm(ing.name);
      if (!firstUnit.has(key)) firstUnit.set(key, ing.unit);
      if (index.has(key)) idByName.set(key, index.get(key)!.id);
    }
  }

  for (const [key, unit] of firstUnit) {
    if (idByName.has(key)) continue;
    const resolution = resolutions[key];
    if (!resolution) return { error: "Не для всех новых продуктов выбрана категория или продукт" };
    if (resolution.mode === "existing") {
      const chosenType = typeById.get(resolution.ingredientId);
      if (!chosenType) return { error: "Выбран несуществующий продукт" };
      // Сопоставлять можно только с продуктом тех же единиц — иначе тот же баг, что и с
      // несогласованными единицами в файле.
      if (chosenType !== UNIT_TO_TYPE[unit]) {
        return { error: `«${displayName(recipes, key)}» нельзя сопоставить: у выбранного продукта другие единицы измерения.` };
      }
      idByName.set(key, resolution.ingredientId);
    } else {
      const name = displayName(recipes, key);
      idByName.set(key, await resolveNewIngredientId(name, unit, resolution.category));
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const recipe of recipes) {
      const created = await tx.recipe.create({
        data: {
          householdId: user.householdId,
          title: recipe.title,
          photoUrl: null,
          baseServings: recipe.baseServings,
          cookTimeMinutes: recipe.cookTimeMinutes ?? null,
          cookingMethods: recipe.cookingMethods,
        },
        select: { id: true },
      });
      await tx.recipeStep.createMany({
        data: recipe.steps.map((instruction, order) => ({ recipeId: created.id, order, instruction })),
      });
      const rows = mergeResolvedIngredients(
        recipe.ingredients.map((ing) => ({
          ingredientId: idByName.get(norm(ing.name))!,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      );
      await tx.recipeIngredient.createMany({
        data: rows.map((row) => ({ recipeId: created.id, ...row })),
      });
    }
  });

  revalidatePath("/recipes");
  return { error: null, createdCount: recipes.length };
}

// Оригинальное написание несовпавшего имени (для нового Ingredient) — первое вхождение в файле.
function displayName(recipes: ImportRecipe[], key: string): string {
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      if (norm(ing.name) === key) return ing.name.trim();
    }
  }
  return key;
}
