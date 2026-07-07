import type { UnitType } from "./types";

// Округление до целого только для COUNT — штуки нельзя дробить (см. CLAUDE.md, раздел 5).
export function scaleIngredient(
  quantity: number,
  servings: number,
  baseServings: number,
  unitType: UnitType,
): number {
  if (baseServings <= 0) return quantity;
  const scaled = (quantity * servings) / baseServings;
  return unitType === "COUNT" ? Math.round(scaled) : scaled;
}

export function matchPercent(
  recipeIngredientIds: string[],
  pantryIngredientIds: Iterable<string>,
): number {
  if (recipeIngredientIds.length === 0) return 0;
  const pantry = new Set(pantryIngredientIds);
  const unique = new Set(recipeIngredientIds);
  let have = 0;
  for (const id of unique) {
    if (pantry.has(id)) have += 1;
  }
  return Math.round((have / unique.size) * 100);
}
