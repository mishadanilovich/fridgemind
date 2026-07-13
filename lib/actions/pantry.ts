"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import type { ActionResult, FormState } from "@/lib/form-state";
import { fieldIssues, firstIssue } from "@/lib/form-state";
import { Prisma } from "@/lib/generated/prisma/client";
import { upsertPantryItemQuantity } from "@/lib/pantry-quantity";
import { prisma } from "@/lib/prisma";
import type { Ingredient } from "@/lib/types";
import type { RecognizedProduct } from "@/lib/zod-schemas";
import {
  confirmRecognizedProductsSchema,
  pantryItemAddSchema,
  pantryItemUpdateSchema,
} from "@/lib/zod-schemas";

// Инвентарь доступен на запись всем ролям household (см. CLAUDE.md §5, RLS pantry_items) —
// достаточно залогиненного пользователя, роль не проверяется.

export type PantrySaved = { savedId: string };

export async function addPantryItem(
  _prev: FormState<Record<string, never>, PantrySaved>,
  formData: FormData,
): Promise<FormState<Record<string, never>, PantrySaved>> {
  const user = await requireUser();

  const parsed = pantryItemAddSchema.safeParse({
    ingredientId: String(formData.get("ingredientId") ?? ""),
    quantity: Number(formData.get("quantity")) || 0,
  });
  if (!parsed.success) {
    return { error: null, fieldErrors: fieldIssues(parsed.error.issues) };
  }
  const data = parsed.data;

  // Единица выводится из справочника на сервере — клиентскому вводу не доверяем.
  const ingredient = await prisma.ingredient.findUnique({ where: { id: data.ingredientId } });
  if (!ingredient) {
    return { error: null, fieldErrors: { ingredientId: "Выберите продукт" } };
  }

  const saved = await upsertPantryItemQuantity(prisma, {
    householdId: user.householdId,
    ingredient,
    quantity: data.quantity,
    claimedUnitType: ingredient.defaultUnitType,
    addedVia: "MANUAL",
  });

  revalidatePath("/inventory");
  return { error: null, data: { savedId: saved.id } };
}

export async function updatePantryItem(
  _prev: FormState<Record<string, never>, PantrySaved>,
  formData: FormData,
): Promise<FormState<Record<string, never>, PantrySaved>> {
  const user = await requireUser();

  const parsed = pantryItemUpdateSchema.safeParse({
    pantryItemId: String(formData.get("pantryItemId") ?? ""),
    quantity: Number(formData.get("quantity")) || 0,
  });
  if (!parsed.success) {
    return { error: null, fieldErrors: fieldIssues(parsed.error.issues) };
  }
  const data = parsed.data;

  const updated = await prisma.pantryItem.updateMany({
    where: { id: data.pantryItemId, householdId: user.householdId },
    data: { quantity: data.quantity },
  });
  if (updated.count === 0) return { error: "Позиция не найдена" };

  revalidatePath("/inventory");
  return { error: null, data: { savedId: data.pantryItemId } };
}

// Ингредиент для распознанного продукта: сопоставленный моделью id → поиск по имени (модель
// могла не знать про недавно созданный пункт) → создание нового пункта справочника.
async function resolveIngredient(product: RecognizedProduct): Promise<Ingredient> {
  if (product.matchedIngredientId !== null) {
    const matched = await prisma.ingredient.findUnique({
      where: { id: product.matchedIngredientId },
    });
    if (matched) return matched;
  }
  const byName = await prisma.ingredient.findFirst({
    where: { name: { equals: product.name, mode: "insensitive" } },
  });
  if (byName) return byName;
  try {
    return await prisma.ingredient.create({
      data: {
        name: product.name,
        defaultUnitType: product.unitType,
        category: product.category,
      },
    });
  } catch (e) {
    // Одноимённый продукт создали параллельно (name @unique) — забираем победителя гонки.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const raced = await prisma.ingredient.findFirst({
        where: { name: { equals: product.name, mode: "insensitive" } },
      });
      if (raced) return raced;
    }
    throw e;
  }
}

// Сохранение подтверждённого пользователем распознанного списка: новые продукты попадают
// в справочник, количества суммируются с уже имеющимися запасами (addedVia: PHOTO).
export async function confirmRecognizedProducts(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = confirmRecognizedProductsSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  // Справочник пополняется до транзакции: ошибку внутри interactive-транзакции (в т.ч.
  // P2002-гонку) Postgres не даёт обработать без отката всей транзакции, а созданный
  // глобальный пункт справочника безвреден, даже если upsert'ы ниже не удадутся.
  const resolved: { ingredient: Ingredient; product: RecognizedProduct }[] = [];
  for (const product of parsed.data.products) {
    resolved.push({ ingredient: await resolveIngredient(product), product });
  }

  await prisma.$transaction(async (tx) => {
    for (const { ingredient, product } of resolved) {
      await upsertPantryItemQuantity(tx, {
        householdId: user.householdId,
        ingredient,
        quantity: product.quantity,
        claimedUnitType: product.unitType,
        addedVia: "PHOTO",
      });
    }
  });

  revalidatePath("/inventory");
  return { error: null };
}

export async function deletePantryItem(pantryItemId: string): Promise<ActionResult> {
  const user = await requireUser();

  const deleted = await prisma.pantryItem.deleteMany({
    where: { id: pantryItemId, householdId: user.householdId },
  });
  if (deleted.count === 0) return { error: "Позиция не найдена" };

  revalidatePath("/inventory");
  return { error: null };
}
