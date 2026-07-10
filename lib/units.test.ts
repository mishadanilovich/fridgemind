import { describe, expect, it } from "vitest";

import { formatQuantity, sanitizeQuantityInput, UNIT_TO_TYPE, UNITS_BY_TYPE } from "./units";

describe("formatQuantity", () => {
  it("shows grams below 1000 and kilograms at or above", () => {
    expect(formatQuantity(500, "G")).toBe("500 г");
    expect(formatQuantity(999, "G")).toBe("999 г");
    expect(formatQuantity(1000, "G")).toBe("1 кг");
    expect(formatQuantity(1500, "G")).toBe("1.5 кг");
  });

  it("shows millilitres below 1000 and litres at or above", () => {
    expect(formatQuantity(250, "ML")).toBe("250 мл");
    expect(formatQuantity(2000, "ML")).toBe("2 л");
  });

  it("rounds the large unit to at most two decimals without trailing zeros", () => {
    expect(formatQuantity(1234, "G")).toBe("1.23 кг");
    expect(formatQuantity(1200, "G")).toBe("1.2 кг");
  });

  it("renders count as pieces and drops fractional noise", () => {
    expect(formatQuantity(3, "PCS")).toBe("3 шт");
    expect(formatQuantity(2.4, "PCS")).toBe("2 шт");
  });
});

describe("sanitizeQuantityInput", () => {
  it("normalizes a comma decimal separator to a dot", () => {
    expect(sanitizeQuantityInput("1,5")).toBe("1.5");
  });

  it("strips everything except digits and the dot", () => {
    expect(sanitizeQuantityInput("1.5 кг")).toBe("1.5");
    expect(sanitizeQuantityInput("abc")).toBe("");
  });
});

describe("unit type maps", () => {
  it("maps each base unit to its product type", () => {
    expect(UNIT_TO_TYPE.G).toBe("WEIGHT");
    expect(UNIT_TO_TYPE.ML).toBe("VOLUME");
    expect(UNIT_TO_TYPE.PCS).toBe("COUNT");
  });

  it("restricts allowed units per product type", () => {
    expect(UNITS_BY_TYPE.WEIGHT).toEqual(["G"]);
    expect(UNITS_BY_TYPE.VOLUME).toEqual(["ML"]);
    expect(UNITS_BY_TYPE.COUNT).toEqual(["PCS"]);
  });
});
