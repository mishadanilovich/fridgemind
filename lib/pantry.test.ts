import { describe, expect, it } from "vitest";

import { groupPantryItems } from "./pantry";
import type { PantryItemView, ProductCategory } from "./types";

let seq = 0;
function item(name: string, category: ProductCategory): PantryItemView {
  seq += 1;
  return {
    id: `p-${seq}`,
    householdId: "hh-1",
    ingredientId: `ing-${seq}`,
    quantity: 100,
    unit: "G",
    addedVia: "MANUAL",
    createdAt: new Date(),
    updatedAt: new Date(),
    ingredient: {
      id: `ing-${seq}`,
      name,
      defaultUnitType: "WEIGHT",
      category,
      createdAt: new Date(),
    },
  };
}

describe("groupPantryItems", () => {
  it("groups by category in PRODUCT_CATEGORIES order, skipping empty ones", () => {
    const groups = groupPantryItems([
      item("Стиральный порошок", "HOUSEHOLD_CHEMICALS"),
      item("Морковь", "VEGETABLES_FRUITS"),
      item("Молоко", "DAIRY"),
    ]);
    expect(groups.map((g) => g.category)).toEqual([
      "DAIRY",
      "VEGETABLES_FRUITS",
      "HOUSEHOLD_CHEMICALS",
    ]);
  });

  it("sorts items alphabetically within a group", () => {
    const groups = groupPantryItems([
      item("Сыр", "DAIRY"),
      item("Йогурт", "DAIRY"),
      item("Молоко", "DAIRY"),
    ]);
    expect(groups[0]?.items.map((i) => i.ingredient.name)).toEqual(["Йогурт", "Молоко", "Сыр"]);
  });

  it("returns no groups for empty pantry", () => {
    expect(groupPantryItems([])).toEqual([]);
  });
});
