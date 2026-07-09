"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import type { ActionResult, FormState } from "@/lib/form-state";
import { fieldIssues, firstIssue } from "@/lib/form-state";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { UNIT_TYPE_TO_UNIT } from "@/lib/units";
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
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = pantryItemAddSchema.safeParse({
    ingredientId: String(formData.get("ingredientId") ?? ""),
    quantity: Number(formData.get("quantity")) || 0,
    unit: formData.get("unit"),
  });
  if (!parsed.success) {
    return { error: null, fieldErrors: fieldIssues(parsed.error.issues) };
  }
  const data = parsed.data;

  // Продукт уже есть в запасах — пополняем количество, а не создаём дубль строки.
  const existing = await prisma.pantryItem.findFirst({
    where: { householdId: user.householdId, ingredientId: data.ingredientId },
  });
  const saved = existing
    ? await prisma.pantryItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: data.quantity }, unit: data.unit },
      })
    : await prisma.pantryItem.create({
        data: {
          householdId: user.householdId,
          ingredientId: data.ingredientId,
          quantity: data.quantity,
          unit: data.unit,
          addedVia: "MANUAL",
        },
      });

  revalidatePath("/inventory");
  return { error: null, data: { savedId: saved.id } };
}

export async function updatePantryItem(
  _prev: FormState<Record<string, never>, PantrySaved>,
  formData: FormData,
): Promise<FormState<Record<string, never>, PantrySaved>> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
async function resolveIngredient(tx: Prisma.TransactionClient, product: RecognizedProduct) {
  if (product.matchedIngredientId !== null) {
    const matched = await tx.ingredient.findUnique({ where: { id: product.matchedIngredientId } });
    if (matched) return matched;
  }
  const byName = await tx.ingredient.findFirst({
    where: { name: { equals: product.name, mode: "insensitive" } },
  });
  if (byName) return byName;
  return tx.ingredient.create({
    data: {
      name: product.name,
      defaultUnitType: product.unitType,
      category: product.category,
    },
  });
}

// Сохранение подтверждённого пользователем распознанного списка: новые продукты попадают
// в справочник, количества суммируются с уже имеющимися запасами (addedVia: PHOTO).
export async function confirmRecognizedProducts(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = confirmRecognizedProductsSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  await prisma.$transaction(async (tx) => {
    for (const product of parsed.data.products) {
      const ingredient = await resolveIngredient(tx, product);
      // Тип единицы существующего пункта справочника важнее догадки модели.
      const unit = UNIT_TYPE_TO_UNIT[ingredient.defaultUnitType];
      const quantity = unit === "PCS" ? Math.max(1, Math.round(product.quantity)) : product.quantity;
      await tx.pantryItem.upsert({
        where: {
          householdId_ingredientId: { householdId: user.householdId, ingredientId: ingredient.id },
        },
        create: {
          householdId: user.householdId,
          ingredientId: ingredient.id,
          quantity,
          unit,
          addedVia: "PHOTO",
        },
        update: { quantity: { increment: quantity } },
      });
    }
  });

  revalidatePath("/inventory");
  return { error: null };
}

export async function deletePantryItem(pantryItemId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const deleted = await prisma.pantryItem.deleteMany({
    where: { id: pantryItemId, householdId: user.householdId },
  });
  if (deleted.count === 0) return { error: "Позиция не найдена" };

  revalidatePath("/inventory");
  return { error: null };
}
