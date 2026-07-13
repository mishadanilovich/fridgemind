"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { isoToDate, startOfWeekIso, todayIso } from "@/lib/dates";
import type { ActionResult, FormState } from "@/lib/form-state";
import { fieldIssues, firstIssue } from "@/lib/form-state";
import { upsertPantryItemQuantity } from "@/lib/pantry-quantity";
import { prisma } from "@/lib/prisma";
import {
  aggregateWeekNeeds,
  existingShoppingItemSelect,
  mealNeedsSelect,
  sameContributions,
  toMealNeedsSource,
} from "@/lib/shopping-list";
import type { ManualShoppingItemInput } from "@/lib/types";
import { normalizePcsQuantity, UNIT_TO_TYPE } from "@/lib/units";
import {
  addBoughtToPantrySchema,
  manualShoppingItemInputSchema,
  shoppingItemBoughtSchema,
  shoppingItemUpdateSchema,
} from "@/lib/zod-schemas";

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
  const quantity = normalizePcsQuantity(input.quantity, input.unit);
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
 * Мгновенная отметка "куплено" — без подтверждений (см. CLAUDE.md §6, поток "отметил, что
 * купил"): галочка и boughtByUserId, инвентарь не трогается. addedToPantry при снятии
 * галочки намеренно не сбрасывается: перенос в запасы уже состоялся, и сброс сделал бы
 * позицию кандидатом на повторный перенос — двойное пополнение инвентаря (легче всего
 * ловится в гонке с чужим массовым переносом). Флаг снимается только там, где потребность
 * реально выросла (syncWeekItems, updateShoppingItem).
 */
export async function toggleShoppingItemBought(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = shoppingItemBoughtSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };
  const { itemId, isBought } = parsed.data;

  const updated = await prisma.shoppingListItem.updateMany({
    where: { id: itemId, householdId: user.householdId },
    data: isBought
      ? { isBought: true, boughtByUserId: user.id }
      : { isBought: false, boughtByUserId: null },
  });
  if (updated.count === 0) return { error: "Позиция не найдена" };

  revalidatePath("/shopping-list");
  return { error: null };
}

export type ShoppingItemEditValues = { name: string; quantity: string };

type ShoppingItemEditState = FormState<ShoppingItemEditValues, { savedId: string }>;

/**
 * Редактирование позиции прямо в списке (см. CLAUDE.md §6): название и единица меняются
 * только у ручных позиций (у позиций из меню они идут из справочника), количество — у любых.
 * Правка количества не пересчитывает недельный план и переживает syncWeekItems — см. диф
 * там же. Рост количества снимает isBought/addedToPantry (то же правило, что в syncWeekItems):
 * прежняя покупка и перенос не покрывают разницу — иначе излишек молча терялся бы, не попадая
 * ни в список к покупке, ни в инвентарь.
 */
export async function updateShoppingItem(
  _prev: ShoppingItemEditState,
  formData: FormData,
): Promise<ShoppingItemEditState> {
  const user = await requireUser();

  const itemId = String(formData.get("itemId") ?? "");
  const item = await prisma.shoppingListItem.findFirst({
    where: { id: itemId, householdId: user.householdId },
    select: { id: true, isManual: true, name: true, unit: true, quantity: true },
  });
  if (!item) return { error: "Позиция не найдена" };

  const raw = {
    name: item.isManual ? String(formData.get("name") ?? "") : item.name,
    quantity: String(formData.get("quantity") ?? ""),
  };
  const parsed = shoppingItemUpdateSchema.safeParse({
    itemId,
    name: raw.name,
    quantity: Number(raw.quantity) || 0,
    unit: item.isManual ? String(formData.get("unit") ?? "") : item.unit,
  });
  if (!parsed.success) {
    return { error: null, fieldErrors: fieldIssues(parsed.error.issues), values: raw };
  }

  const quantity = normalizePcsQuantity(parsed.data.quantity, parsed.data.unit);
  const grewReset =
    quantity > item.quantity ? { isBought: false, boughtByUserId: null, addedToPantry: false } : {};
  await prisma.shoppingListItem.updateMany({
    where: { id: item.id, householdId: user.householdId },
    data: item.isManual
      ? { name: parsed.data.name, quantity, unit: parsed.data.unit, ...grewReset }
      : { quantity, ...grewReset },
  });

  revalidatePath("/shopping-list");
  return { error: null, data: { savedId: item.id } };
}

/**
 * Удаление позиции — только для ручных: позицию из меню syncWeekItems пересоздал бы при
 * следующем чтении, пока рецепт стоит в плане (убирается она правкой меню или галочкой
 * "куплено"). UI кнопку для них не показывает, серверный фильтр — вторая линия.
 */
export async function deleteShoppingItem(itemId: string): Promise<ActionResult> {
  const user = await requireUser();

  const deleted = await prisma.shoppingListItem.deleteMany({
    where: { id: itemId, householdId: user.householdId, isManual: true },
  });
  if (deleted.count === 0) return { error: "Позиция не найдена" };

  revalidatePath("/shopping-list");
  return { error: null };
}

/**
 * Массовый перенос купленного в инвентарь (см. CLAUDE.md §6, поток "массовое обновление
 * инвентаря"): каждая подтверждённая позиция пополняет свой PantryItem и помечается
 * addedToPantry. Количество 0 — позиция пропущена и появится в шите переноса снова.
 * Ручные позиции не участвуют — им нечего добавлять в инвентарь.
 *
 * Претензия на позицию идёт updateMany с фильтром addedToPantry: false до пополнения запасов:
 * два участника, подтвердившие перенос одновременно, конкурируют за row lock, и проигравший
 * увидит уже addedToPantry = true (count 0) — двойного пополнения не будет.
 */
export async function addBoughtToPantry(input: unknown): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = addBoughtToPantrySchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const toTransfer = parsed.data.items.filter((item) => item.quantity > 0);
  if (toTransfer.length > 0) {
    await prisma.$transaction(async (tx) => {
      const rows = await tx.shoppingListItem.findMany({
        where: {
          id: { in: toTransfer.map((item) => item.itemId) },
          householdId: user.householdId,
          isBought: true,
          isManual: false,
          ingredientId: { not: null },
        },
        select: { id: true, unit: true, ingredient: true },
      });
      const quantityById = new Map(toTransfer.map((item) => [item.itemId, item.quantity]));

      for (const row of rows) {
        const claimed = await tx.shoppingListItem.updateMany({
          where: { id: row.id, addedToPantry: false },
          data: { addedToPantry: true },
        });
        if (claimed.count === 0 || !row.ingredient) continue;

        await upsertPantryItemQuantity(tx, {
          householdId: user.householdId,
          ingredient: row.ingredient,
          quantity: quantityById.get(row.id) ?? 0,
          claimedUnitType: UNIT_TO_TYPE[row.unit],
          addedVia: "MANUAL",
        });
      }
    });
  }

  revalidatePath("/shopping-list");
  revalidatePath("/inventory");
  return { error: null };
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
    // quantity намеренно не сравнивается: total — это всегда сумма вкладов, поэтому расхождение
    // при совпадающих вкладах может значить только ручную правку количества в списке
    // (см. CLAUDE.md §6, поток "редактирование позиции") — её не затираем. Любое реальное
    // изменение плана меняет вклады, попадает в changed и переписывает quantity на need.total.
    const changed = [...needs.values()].filter((need) => {
      const current = byIngredient.get(need.ingredientId);
      return (
        !current ||
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
