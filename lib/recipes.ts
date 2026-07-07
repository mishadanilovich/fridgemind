// Чистая бизнес-логика рецептов: пересчёт количеств под число порций и процент совпадения
// с домашним инвентарём (см. CLAUDE.md, раздел 5 "Порции" и раздел 3, MVP-пункт 8).
// Выделено отдельно от UI/actions, чтобы покрывать юнит-тестами (раздел 10).

import type { UnitType } from "./types";

// Пропорциональный пересчёт количества ингредиента под фактическое число порций.
// Округление до целого для COUNT (штуки нельзя дробить), без строгого округления
// для WEIGHT/VOLUME — оценка и так примерная (раздел 7, п.2).
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

/**
 * Процент совпадения ингредиентов рецепта с тем, что есть дома — по наличию, а не количеству
 * (раздел 5: смена порций на этот процент не влияет). Сравнение точное, по ingredientId.
 * Рецепт без ингредиентов → 0 %.
 */
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
