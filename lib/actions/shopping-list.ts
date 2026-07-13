"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { isoToDate, startOfWeekIso, todayIso } from "@/lib/dates";
import type { FormState } from "@/lib/form-state";
import { fieldIssues } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";
import {
  aggregateWeekNeeds,
  existingShoppingItemSelect,
  mealNeedsSelect,
  sameContributions,
  toMealNeedsSource,
} from "@/lib/shopping-list";
import type { ManualShoppingItemInput } from "@/lib/types";
import { manualShoppingItemInputSchema } from "@/lib/zod-schemas";

import { ensureMenuWeek } from "./menu";

// Список покупок доступен на запись всем ролям household (см. CLAUDE.md §5,
// RLS shopping_list_items) — достаточно залогиненного пользователя.

export type ManualItemValues = { name: string; quantity: string };
export type ManualItemSaved = { savedId: string };

type ManualItemState = FormState<ManualItemValues, ManualItemSaved>;

export async function addManualShoppingItem(
  _prev: ManualItemState,
  formData: FormData,
): Promise<ManualItemState> {
  const user = await requireUser();

  const raw = {
    name: String(formData.get("name") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
  };
  const parsed = manualShoppingItemInputSchema.safeParse({
    name: raw.name,
    quantity: Number(raw.quantity) || 0,
    unit: String(formData.get("unit") ?? ""),
    manualCategory: String(formData.get("manualCategory") ?? "OTHER"),
  });
  if (!parsed.success) {
    return { error: null, fieldErrors: fieldIssues(parsed.error.issues), values: raw };
  }

  const saved = await createManualShoppingItem(user.householdId, parsed.data);

  revalidatePath("/shopping-list");
  return { error: null, data: { savedId: saved.id } };
}

/**
 * Ручная позиция списка покупок — общий путь записи для server action и (в будущем)
 * внешних клиентов. Живёт на текущей неделе; MenuWeek заводится тем же лениво-upsert'ом
 * (ensureMenuWeek), что и при назначении рецепта в lib/actions/menu.ts. Штучные количества
 * округляются до целого — дробных штук не бывает.
 */
export async function createManualShoppingItem(
  householdId: string,
  input: ManualShoppingItemInput,
): Promise<{ id: string }> {
  const quantity =
    input.unit === "PCS" ? Math.max(1, Math.round(input.quantity)) : input.quantity;
  const weekStartDate = isoToDate(startOfWeekIso(todayIso()));

  return prisma.$transaction(async (tx) => {
    const week = await ensureMenuWeek(tx, householdId, weekStartDate);
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

/**
 * Синхронизация позиций недели с текущим меню (см. CLAUDE.md §6, поток "список покупок").
 * Вызывается при чтении списка (lib/queries/shopping-list.ts), а не из каждого экшена
 * меню/рецептов: потребность меняют и назначение/снятие рецепта, и правка servings, и
 * редактирование/удаление самого рецепта — пересчёт на чтении покрывает все источники разом.
 * Идёт diff'ом: без изменений в меню повторное открытие экрана не пишет в БД вовсе.
 *
 * pg_advisory_xact_lock сериализует синхронизации одной недели: без него два параллельных
 * вызова (например, два участника household открывают список почти одновременно) читают
 * одно и то же "до"-состояние, оба решают переписать вклады одного и того же ингредиента, и
 * оба выполняют deleteMany+createMany по ShoppingListItemMeal — тогда второй createMany
 * добавляет дублирующий набор строк поверх уже вставленных первым. Лок держится только на
 * время транзакции и снимается сам при коммите/откате, поэтому и сами чтения (mealRows/
 * existing) идут внутри той же транзакции — иначе второй вызов мог бы прочитать состояние
 * ещё до коммита первого и всё равно продублировать запись.
 */
export async function syncWeekItems(householdId: string, weekId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${weekId}))`;

    const [mealRows, existing] = await Promise.all([
      tx.menuDayMeal.findMany({
        where: { menuDay: { menuWeekId: weekId } },
        select: mealNeedsSelect,
      }),
      tx.shoppingListItem.findMany({
        where: { weekId, isManual: false },
        select: existingShoppingItemSelect,
      }),
    ]);

    const needs = aggregateWeekNeeds(mealRows.map(toMealNeedsSource));

    // isManual: false ⇒ ingredientId всегда задан (см. createManualShoppingItem) — этим
    // строкам просто не из чего взяться с null-ингредиентом.
    const stale = existing.filter((item) => !needs.has(item.ingredientId as string));

    // Уже купленное или перенесённое в запасы не выбрасываем молча — рецепт с этим
    // ингредиентом мог уйти из плана раньше, чем позицию разобрали в "Добавить в запасы".
    // Отвязываем от ингредиента и текущего плана, превращая в обычную ручную позицию: так
    // unique(weekId, ingredientId) не мешает, если тот же продукт снова понадобится
    // в этой неделе, а купленное количество не теряется.
    const staleToOrphan = stale.filter((item) => item.isBought || item.addedToPantry);
    const staleToDelete = stale.filter((item) => !item.isBought && !item.addedToPantry);

    const byIngredient = new Map(
      existing.flatMap((item) => (item.ingredientId ? [[item.ingredientId, item] as const] : [])),
    );
    const changed = [...needs.values()].filter((need) => {
      const current = byIngredient.get(need.ingredientId);
      return (
        !current ||
        current.quantity !== need.total ||
        current.unit !== need.unit ||
        current.name !== need.name ||
        !sameContributions(current, need)
      );
    });

    if (staleToDelete.length === 0 && staleToOrphan.length === 0 && changed.length === 0) return;

    if (staleToDelete.length > 0) {
      await tx.shoppingListItem.deleteMany({
        where: { id: { in: staleToDelete.map((s) => s.id) } },
      });
    }

    if (staleToOrphan.length > 0) {
      await Promise.all(
        staleToOrphan.map((item) =>
          tx.shoppingListItem.update({
            where: { id: item.id },
            data: {
              isManual: true,
              ingredientId: null,
              manualCategory: item.ingredient?.category ?? "OTHER",
            },
          }),
        ),
      );
      await tx.shoppingListItemMeal.deleteMany({
        where: { shoppingListItemId: { in: staleToOrphan.map((s) => s.id) } },
      });
    }

    const upsertedIds: string[] = [];
    const contributions: {
      shoppingListItemId: string;
      menuDayMealId: string;
      quantity: number;
    }[] = [];
    for (const need of changed) {
      const current = byIngredient.get(need.ingredientId);
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
        update: {
          name: need.name,
          quantity: need.total,
          unit: need.unit,
          // Потребность выросла — прежняя отметка "куплено" могла не покрывать разницу,
          // сбрасываем её, чтобы недостающее не потерялось молча.
          ...(current && need.total > current.quantity
            ? { isBought: false, addedToPantry: false }
            : {}),
        },
        select: { id: true },
      });
      upsertedIds.push(item.id);
      for (const c of need.contributions) {
        contributions.push({
          shoppingListItemId: item.id,
          menuDayMealId: c.menuDayMealId,
          quantity: c.quantity,
        });
      }
    }
    if (upsertedIds.length > 0) {
      await tx.shoppingListItemMeal.deleteMany({
        where: { shoppingListItemId: { in: upsertedIds } },
      });
      await tx.shoppingListItemMeal.createMany({ data: contributions });
    }
  });
}
