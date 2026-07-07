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

// Сколько уникальных ингредиентов рецепта уже есть в инвентаре из общего числа.
export function matchCounts(
  recipeIngredientIds: string[],
  pantry: ReadonlySet<string>,
): { have: number; total: number } {
  const unique = new Set(recipeIngredientIds);
  let have = 0;
  for (const id of unique) {
    if (pantry.has(id)) have += 1;
  }
  return { have, total: unique.size };
}

export function matchPercent(
  recipeIngredientIds: string[],
  pantryIngredientIds: Iterable<string>,
): number {
  const { have, total } = matchCounts(recipeIngredientIds, new Set(pantryIngredientIds));
  return total === 0 ? 0 : Math.round((have / total) * 100);
}
