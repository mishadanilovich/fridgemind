import { describe, expect, it } from "vitest";

import type { MealNeedsSource } from "./shopping-list";
import {
  aggregateWeekNeeds,
  buildShoppingGroups,
  compareDayIngredients,
  neededQuantity,
} from "./shopping-list";
import type { ShoppingItemView, Unit } from "./types";

type IngredientRow = MealNeedsSource["recipe"]["ingredients"][number];

function ing(ingredientId: string, quantity: number, unit: Unit = "G"): IngredientRow {
  return { ingredientId, name: `Продукт ${ingredientId}`, quantity, unit };
}

function meal(
  id: string,
  servings: number,
  baseServings: number,
  ingredients: IngredientRow[],
): MealNeedsSource {
  return { id, servings, recipe: { baseServings, ingredients } };
}

function item(overrides: Partial<ShoppingItemView>): ShoppingItemView {
  // По умолчанию quantity = сумме вкладов по дням — инвариант syncWeekItems; расхождение
  // задаётся явно в тестах ручной правки количества.
  const perDay = overrides.perDay ?? {};
  const weekTotal = Object.values(perDay).reduce((sum, quantity) => sum + quantity, 0);
  return {
    id: "item",
    name: "Продукт",
    unit: "G",
    category: "OTHER",
    isManual: false,
    isBought: false,
    addedToPantry: false,
    boughtByName: null,
    quantity: weekTotal,
    pantryQuantity: 0,
    perDay,
    ...overrides,
  };
}

describe("aggregateWeekNeeds", () => {
  it("пересчитывает количества под servings и суммирует по продукту", () => {
    const needs = aggregateWeekNeeds([
      meal("m1", 2, 4, [ing("milk", 1000, "ML")]),
      meal("m2", 6, 3, [ing("milk", 200, "ML")]),
    ]);

    const milk = needs.get("milk");
    expect(milk?.total).toBe(500 + 400);
    expect(milk?.contributions).toEqual([
      { menuDayMealId: "m1", quantity: 500 },
      { menuDayMealId: "m2", quantity: 400 },
    ]);
  });

  it("округляет штучные количества на уровне каждого приёма пищи", () => {
    const needs = aggregateWeekNeeds([
      meal("m1", 3, 2, [ing("egg", 3, "PCS")]),
      meal("m2", 1, 2, [ing("egg", 3, "PCS")]),
    ]);

    // 4.5 → 5 и 1.5 → 2 по отдельности, а не round(6) от суммы.
    expect(needs.get("egg")?.total).toBe(5 + 2);
  });

  it("не пишет нулевой вклад (COUNT, округлившийся до нуля)", () => {
    const needs = aggregateWeekNeeds([meal("m1", 1, 4, [ing("lemon", 1, "PCS")])]);

    expect(needs.has("lemon")).toBe(false);
  });

  it("продукты разных рецептов не смешиваются между собой", () => {
    const needs = aggregateWeekNeeds([
      meal("m1", 2, 2, [ing("flour", 300), ing("butter", 50)]),
    ]);

    expect(needs.get("flour")?.total).toBe(300);
    expect(needs.get("butter")?.total).toBe(50);
  });
});

describe("neededQuantity", () => {
  const perDay = { "2026-07-06": 300, "2026-07-08": 200 };

  it("вся неделя: сумма вкладов минус остаток дома", () => {
    expect(neededQuantity(item({ perDay, pantryQuantity: 100 }), null)).toBe(400);
  });

  it("не опускается ниже нуля, когда запасов больше потребности", () => {
    expect(neededQuantity(item({ perDay, pantryQuantity: 900 }), null)).toBe(0);
  });

  it("фильтр по дням суммирует только выбранные дни", () => {
    expect(neededQuantity(item({ perDay, pantryQuantity: 50 }), ["2026-07-08"])).toBe(150);
    expect(neededQuantity(item({ perDay }), ["2026-07-07"])).toBe(0);
  });

  it("ручная позиция не зависит ни от фильтра, ни от запасов", () => {
    const manual = item({ isManual: true, quantity: 2, pantryQuantity: 99 });
    expect(neededQuantity(manual, null)).toBe(2);
    expect(neededQuantity(manual, ["2026-07-07"])).toBe(2);
  });

  it("правленное вручную количество видно в недельном виде, дни считают по вкладам", () => {
    const edited = item({ perDay, quantity: 800, pantryQuantity: 100 });
    expect(neededQuantity(edited, null)).toBe(700);
    expect(neededQuantity(edited, ["2026-07-08"])).toBe(100);
  });
});

describe("buildShoppingGroups", () => {
  it("скрывает полностью покрытые запасами позиции и пустые категории", () => {
    const groups = buildShoppingGroups(
      [
        item({ id: "a", category: "DAIRY", perDay: { d1: 500 }, pantryQuantity: 500 }),
        item({ id: "b", category: "GROCERY", perDay: { d1: 300 } }),
      ],
      null,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.category).toBe("GROCERY");
    expect(groups[0]?.items.map((i) => i.needed)).toEqual([300]);
  });

  it("группы идут в порядке PRODUCT_CATEGORIES, внутри — по алфавиту", () => {
    const groups = buildShoppingGroups(
      [
        item({ id: "1", name: "Яблоки", category: "VEGETABLES_FRUITS", perDay: { d1: 1 } }),
        item({ id: "2", name: "Молоко", category: "DAIRY", perDay: { d1: 1 } }),
        item({ id: "3", name: "Авокадо", category: "VEGETABLES_FRUITS", perDay: { d1: 1 } }),
      ],
      null,
    );

    expect(groups.map((g) => g.category)).toEqual(["DAIRY", "VEGETABLES_FRUITS"]);
    expect(groups[1]?.items.map((i) => i.name)).toEqual(["Авокадо", "Яблоки"]);
  });

  it("ручные позиции видны при любом фильтре по дням", () => {
    const groups = buildShoppingGroups(
      [
        item({ id: "m", isManual: true, quantity: 1, category: "HOUSEHOLD_CHEMICALS" }),
        item({ id: "r", category: "DAIRY", perDay: { "2026-07-06": 200 } }),
      ],
      ["2026-07-09"],
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.items[0]?.id).toBe("m");
  });
});

describe("compareDayIngredients", () => {
  it("есть дома, когда остатка хватает ровно впритык", () => {
    const rows = compareDayIngredients(
      [meal("m1", 2, 2, [ing("milk", 500, "ML")])],
      new Map([["milk", 500]]),
    );

    expect(rows).toEqual([
      { ingredientId: "milk", name: "Продукт milk", unit: "ML", needed: 500, enough: true },
    ]);
  });

  it("чего не хватает — первым, дальше по алфавиту", () => {
    const rows = compareDayIngredients(
      [
        meal("m1", 2, 2, [
          { ...ing("a", 100), name: "Мука" },
          { ...ing("b", 100), name: "Соль" },
          { ...ing("c", 100), name: "Яйца" },
        ]),
      ],
      new Map([
        ["a", 1000],
        ["c", 20],
      ]),
    );

    expect(rows.map((r) => [r.name, r.enough])).toEqual([
      ["Соль", false],
      ["Яйца", false],
      ["Мука", true],
    ]);
  });

  it("частичный остаток — всё равно «нужно купить»", () => {
    const rows = compareDayIngredients(
      [meal("m1", 4, 2, [ing("rice", 200)])],
      new Map([["rice", 300]]),
    );

    expect(rows[0]?.needed).toBe(400);
    expect(rows[0]?.enough).toBe(false);
  });
});
