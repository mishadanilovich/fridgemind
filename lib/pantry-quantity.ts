import type { Prisma } from "./generated/prisma/client";
import type { Ingredient, PantryItemSource, UnitType } from "./types";
import { FALLBACK_QUANTITY_BY_TYPE, normalizePcsQuantity, UNIT_TYPE_TO_UNIT } from "./units";

export type PantryUpsertArgs = {
  householdId: string;
  ingredient: Ingredient;
  quantity: number;
  /** unitType, под которым количество было введено/оценено. */
  claimedUnitType: UnitType;
  addedVia: PantryItemSource;
};

// Единственная точка записи количества в PantryItem: единица всегда из справочника; количество,
// оценённое под другим unitType, не переносится (WEIGHT/VOLUME/COUNT не конвертируются) и
// заменяется безопасным минимумом; штучные значения округляются; повторное добавление продукта
// атомарно пополняет количество по (householdId, ingredientId). Общий помощник экшенов
// инвентаря (lib/actions/pantry.ts) и массового переноса купленного (lib/actions/shopping-list.ts);
// живёт отдельным модулем, потому что из "use server"-файла вспомогательную функцию не
// экспортировать — она стала бы публичным server action без проверки прав.
export function upsertPantryItemQuantity(
  db: Prisma.TransactionClient,
  { householdId, ingredient, quantity, claimedUnitType, addedVia }: PantryUpsertArgs,
) {
  const unit = UNIT_TYPE_TO_UNIT[ingredient.defaultUnitType];
  const trusted =
    claimedUnitType === ingredient.defaultUnitType
      ? quantity
      : FALLBACK_QUANTITY_BY_TYPE[ingredient.defaultUnitType];
  const normalized = normalizePcsQuantity(trusted, unit);
  return db.pantryItem.upsert({
    where: { householdId_ingredientId: { householdId, ingredientId: ingredient.id } },
    create: { householdId, ingredientId: ingredient.id, quantity: normalized, unit, addedVia },
    update: { quantity: { increment: normalized } },
  });
}

export type PantryDeductArgs = {
  householdId: string;
  ingredientId: string;
  quantity: number;
};

// Парная к upsertPantryItemQuantity точка уменьшения запасов (списание после "скушано").
// Декремент атомарный на уровне SQL: read-then-write двумя запросами терял бы обновление
// при одновременном списании одного продукта двумя участниками household. Ниже нуля не
// опускается (строка с нулём остаётся — видно, что продукт закончился); продукта нет в
// инвентаре — 0 строк, списывать нечего. updated_at ставится вручную: @updatedAt Prisma
// проставляет только через свой Client API, не в raw-запросах.
export function deductPantryItemQuantity(
  db: Prisma.TransactionClient,
  { householdId, ingredientId, quantity }: PantryDeductArgs,
) {
  return db.$executeRaw`
    update public.pantry_items
    set quantity = greatest(0, quantity - ${quantity}), updated_at = now()
    where household_id = ${householdId} and ingredient_id = ${ingredientId}
  `;
}
