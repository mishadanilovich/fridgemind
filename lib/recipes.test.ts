import { describe, expect, it } from "vitest";

import { matchCounts, matchPercent, scaleIngredient } from "./recipes";

describe("scaleIngredient", () => {
  it("scales proportionally for weight without forcing rounding", () => {
    expect(scaleIngredient(200, 2, 4, "WEIGHT")).toBe(100);
    expect(scaleIngredient(150, 6, 4, "WEIGHT")).toBe(225);
  });

  it("keeps fractional values for weight and volume", () => {
    expect(scaleIngredient(100, 1, 3, "WEIGHT")).toBeCloseTo(33.333, 2);
    expect(scaleIngredient(500, 3, 4, "VOLUME")).toBe(375);
  });

  it("rounds to whole units for count (штуки нельзя дробить)", () => {
    expect(scaleIngredient(3, 2, 4, "COUNT")).toBe(2); // 1.5 → 2
    expect(scaleIngredient(2, 1, 3, "COUNT")).toBe(1); // 0.666 → 1
    expect(scaleIngredient(1, 1, 3, "COUNT")).toBe(0); // 0.333 → 0
  });

  it("returns the base quantity when baseServings is not positive", () => {
    expect(scaleIngredient(200, 4, 0, "WEIGHT")).toBe(200);
  });
});

describe("matchCounts", () => {
  it("counts unique recipe ingredients present in the pantry", () => {
    expect(matchCounts(["a", "b", "c"], new Set(["a", "c"]))).toEqual({ have: 2, total: 3 });
  });

  it("deduplicates repeated recipe ingredients", () => {
    expect(matchCounts(["a", "a", "b"], new Set(["a"]))).toEqual({ have: 1, total: 2 });
  });

  it("returns zero totals for a recipe without ingredients", () => {
    expect(matchCounts([], new Set(["a"]))).toEqual({ have: 0, total: 0 });
  });
});

describe("matchPercent", () => {
  it("returns the share of recipe ingredients present in the pantry", () => {
    expect(matchPercent(["a", "b", "c", "d"], ["a", "b"])).toBe(50);
    expect(matchPercent(["a", "b"], ["a", "b", "z"])).toBe(100);
  });

  it("counts each recipe ingredient once even if duplicated", () => {
    expect(matchPercent(["a", "a", "b"], ["a"])).toBe(50);
  });

  it("returns 0 for a recipe without ingredients", () => {
    expect(matchPercent([], ["a", "b"])).toBe(0);
  });

  it("returns 0 when nothing matches", () => {
    expect(matchPercent(["a", "b"], [])).toBe(0);
  });
});
