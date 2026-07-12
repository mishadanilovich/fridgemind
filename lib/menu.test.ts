import { describe, expect, it } from "vitest";

import type { DayMeal } from "./menu";
import { buildDaySlots, countMeals } from "./menu";
import type { MenuMealView } from "./types";

const SLOTS = [
  { id: "breakfast", name: "Завтрак" },
  { id: "lunch", name: "Обед" },
  { id: "dinner", name: "Ужин" },
];

function meal(id: string, overrides: Partial<MenuMealView> = {}): MenuMealView {
  return {
    id,
    recipeId: `recipe-${id}`,
    title: `Рецепт ${id}`,
    photoUrl: null,
    cookTimeMinutes: 30,
    cookingMethods: [],
    servings: 2,
    isEaten: false,
    ...overrides,
  };
}

function dayMeal(slotId: string, slotName: string, view: MenuMealView): DayMeal {
  return { slotId, slotName, meal: view };
}

describe("buildDaySlots", () => {
  it("раскладывает приёмы пищи по слотам в порядке household", () => {
    const slots = buildDaySlots(SLOTS, [dayMeal("lunch", "Обед", meal("m1"))], true);

    expect(slots.map((s) => s.slotId)).toEqual(["breakfast", "lunch", "dinner"]);
    expect(slots[1]?.meal?.id).toBe("m1");
    expect(slots[0]?.meal).toBeNull();
  });

  it("Участник не видит пустых слотов — назначить рецепт он всё равно не может", () => {
    const slots = buildDaySlots(SLOTS, [dayMeal("dinner", "Ужин", meal("m1"))], false);

    expect(slots).toHaveLength(1);
    expect(slots[0]?.slotId).toBe("dinner");
  });

  it("день без единого приёма пищи у Участника пустой, а у Редактора — из пустых слотов", () => {
    expect(buildDaySlots(SLOTS, [], false)).toEqual([]);
    expect(buildDaySlots(SLOTS, [], true)).toHaveLength(3);
  });

  it("приём пищи в удалённом слоте не теряется, а показывается после активных", () => {
    const slots = buildDaySlots(
      SLOTS,
      [dayMeal("snack", "Перекус", meal("m1")), dayMeal("breakfast", "Завтрак", meal("m2"))],
      true,
    );

    expect(slots.map((s) => s.slotId)).toEqual(["breakfast", "lunch", "dinner", "snack"]);
    expect(slots[3]?.slotName).toBe("Перекус");
    expect(slots[3]?.meal?.id).toBe("m1");
  });
});

describe("countMeals", () => {
  it("считает запланированные и уже съеденные приёмы пищи", () => {
    const slots = buildDaySlots(
      SLOTS,
      [
        dayMeal("breakfast", "Завтрак", meal("m1", { isEaten: true })),
        dayMeal("dinner", "Ужин", meal("m2")),
      ],
      true,
    );

    expect(countMeals(slots)).toEqual({ planned: 2, eaten: 1 });
  });
});
