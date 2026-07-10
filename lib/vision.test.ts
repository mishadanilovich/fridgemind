import { describe, expect, it } from "vitest";

import { parseVisionResponse, VisionParseError } from "./vision";
import type { UnitTypeValue } from "./zod-schemas";

const CATALOG = new Map<string, UnitTypeValue>([
  ["ing-milk", "VOLUME"],
  ["ing-eggs", "COUNT"],
]);

const product = (overrides: Record<string, unknown> = {}) => ({
  name: "Молоко",
  matchedIngredientId: "ing-milk",
  quantity: 1000,
  unitType: "VOLUME",
  unit: "ML",
  category: "DAIRY",
  confidence: 0.9,
  ...overrides,
});

const raw = (products: unknown[]) => JSON.stringify({ products });

describe("parseVisionResponse", () => {
  it("parses a valid response", () => {
    const result = parseVisionResponse(raw([product()]), CATALOG);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      name: "Молоко",
      matchedIngredientId: "ing-milk",
      quantity: 1000,
      unit: "ML",
    });
  });

  it("parses JSON wrapped in a markdown fence and surrounding prose", () => {
    const fenced = "Вот результат:\n```json\n" + raw([product()]) + "\n```";
    expect(parseVisionResponse(fenced, CATALOG).products).toHaveLength(1);

    const prose = "Распознал следующее: " + raw([product()]) + " — готово.";
    expect(parseVisionResponse(prose, CATALOG).products).toHaveLength(1);
  });

  it("derives unit from unitType even when the model mismatches them", () => {
    const result = parseVisionResponse(
      raw([product({ name: "Морковь", matchedIngredientId: null, unitType: "WEIGHT", unit: "ML" })]),
      CATALOG,
    );
    expect(result.products[0]?.unit).toBe("G");
  });

  it("prefers the catalog unitType for matched products and resets the quantity on mismatch", () => {
    const result = parseVisionResponse(
      raw([product({ matchedIngredientId: "ing-milk", unitType: "WEIGHT", unit: "G", quantity: 500 })]),
      CATALOG,
    );
    expect(result.products[0]).toMatchObject({ unitType: "VOLUME", unit: "ML", quantity: 100 });
  });

  it("falls back to one piece when the catalog says COUNT but the model guessed weight", () => {
    const result = parseVisionResponse(
      raw([
        product({ name: "Яйца", matchedIngredientId: "ing-eggs", unitType: "WEIGHT", unit: "G", quantity: 600 }),
      ]),
      CATALOG,
    );
    expect(result.products[0]).toMatchObject({ unitType: "COUNT", unit: "PCS", quantity: 1 });
  });

  it("rounds COUNT quantities to whole pieces, at least one", () => {
    const result = parseVisionResponse(
      raw([
        product({ name: "Яйца", matchedIngredientId: "ing-eggs", unitType: "COUNT", unit: "PCS", quantity: 9.6 }),
        product({ name: "Лимон", matchedIngredientId: null, unitType: "COUNT", unit: "PCS", quantity: 0.4 }),
      ]),
      CATALOG,
    );
    expect(result.products.map((p) => p.quantity)).toEqual([10, 1]);
  });

  it("merges duplicates of the same matched ingredient, summing quantities", () => {
    const result = parseVisionResponse(
      raw([
        product({ quantity: 500 }),
        product({ quantity: 300 }),
        product({ name: "Морковь", matchedIngredientId: null, unitType: "WEIGHT", unit: "G" }),
      ]),
      CATALOG,
    );
    expect(result.products).toHaveLength(2);
    expect(result.products[0]).toMatchObject({ matchedIngredientId: "ing-milk", quantity: 800 });
  });

  it("rejects names longer than 60 characters", () => {
    const longName = raw([product({ name: "М".repeat(61), matchedIngredientId: null })]);
    expect(() => parseVisionResponse(longName, CATALOG)).toThrow(VisionParseError);
  });

  it("resets matchedIngredientId unknown to the catalog", () => {
    const result = parseVisionResponse(
      raw([product({ matchedIngredientId: "ing-hallucinated" })]),
      CATALOG,
    );
    expect(result.products[0]?.matchedIngredientId).toBeNull();
  });

  it("drops products with a blank name", () => {
    const result = parseVisionResponse(
      raw([product(), product({ name: "   ", matchedIngredientId: null })]),
      CATALOG,
    );
    expect(result.products).toHaveLength(1);
  });

  it("accepts an empty product list", () => {
    expect(parseVisionResponse(raw([]), CATALOG).products).toEqual([]);
  });

  it("throws VisionParseError on non-JSON output", () => {
    expect(() => parseVisionResponse("Не могу распознать фото.", CATALOG)).toThrow(
      VisionParseError,
    );
  });

  it("throws VisionParseError on schema violations", () => {
    const badUnit = raw([product({ unit: "мл" })]);
    expect(() => parseVisionResponse(badUnit, CATALOG)).toThrow(VisionParseError);

    const negativeQty = raw([product({ quantity: -5 })]);
    expect(() => parseVisionResponse(negativeQty, CATALOG)).toThrow(VisionParseError);

    const missingField = raw([{ name: "Молоко" }]);
    expect(() => parseVisionResponse(missingField, CATALOG)).toThrow(VisionParseError);
  });
});
