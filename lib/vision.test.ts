import { describe, expect, it } from "vitest";

import { parseVisionResponse, VisionParseError } from "./vision";

const CATALOG_IDS = new Set(["ing-milk", "ing-eggs"]);

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
    const result = parseVisionResponse(raw([product()]), CATALOG_IDS);
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
    expect(parseVisionResponse(fenced, CATALOG_IDS).products).toHaveLength(1);

    const prose = "Распознал следующее: " + raw([product()]) + " — готово.";
    expect(parseVisionResponse(prose, CATALOG_IDS).products).toHaveLength(1);
  });

  it("derives unit from unitType even when the model mismatches them", () => {
    const result = parseVisionResponse(
      raw([product({ name: "Морковь", matchedIngredientId: null, unitType: "WEIGHT", unit: "ML" })]),
      CATALOG_IDS,
    );
    expect(result.products[0]?.unit).toBe("G");
  });

  it("rounds COUNT quantities to whole pieces, at least one", () => {
    const result = parseVisionResponse(
      raw([
        product({ name: "Яйца", matchedIngredientId: "ing-eggs", unitType: "COUNT", unit: "PCS", quantity: 9.6 }),
        product({ name: "Лимон", matchedIngredientId: null, unitType: "COUNT", unit: "PCS", quantity: 0.4 }),
      ]),
      CATALOG_IDS,
    );
    expect(result.products.map((p) => p.quantity)).toEqual([10, 1]);
  });

  it("resets matchedIngredientId unknown to the catalog", () => {
    const result = parseVisionResponse(
      raw([product({ matchedIngredientId: "ing-hallucinated" })]),
      CATALOG_IDS,
    );
    expect(result.products[0]?.matchedIngredientId).toBeNull();
  });

  it("drops products with a blank name", () => {
    const result = parseVisionResponse(
      raw([product(), product({ name: "   ", matchedIngredientId: null })]),
      CATALOG_IDS,
    );
    expect(result.products).toHaveLength(1);
  });

  it("accepts an empty product list", () => {
    expect(parseVisionResponse(raw([]), CATALOG_IDS).products).toEqual([]);
  });

  it("throws VisionParseError on non-JSON output", () => {
    expect(() => parseVisionResponse("Не могу распознать фото.", CATALOG_IDS)).toThrow(
      VisionParseError,
    );
  });

  it("throws VisionParseError on schema violations", () => {
    const badUnit = raw([product({ unit: "мл" })]);
    expect(() => parseVisionResponse(badUnit, CATALOG_IDS)).toThrow(VisionParseError);

    const negativeQty = raw([product({ quantity: -5 })]);
    expect(() => parseVisionResponse(negativeQty, CATALOG_IDS)).toThrow(VisionParseError);

    const missingField = raw([{ name: "Молоко" }]);
    expect(() => parseVisionResponse(missingField, CATALOG_IDS)).toThrow(VisionParseError);
  });
});
