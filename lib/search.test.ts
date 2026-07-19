import { describe, expect, it } from "vitest";

import { matchesQuery, normalizeQuery } from "./search";

describe("normalizeQuery", () => {
  it("trims and lowercases", () => {
    expect(normalizeQuery("  Молоко  ")).toBe("молоко");
  });
});

describe("matchesQuery", () => {
  it("matches everything when the query is empty or whitespace", () => {
    expect(matchesQuery(["Омлет"], "")).toBe(true);
    expect(matchesQuery(["Омлет"], "   ")).toBe(true);
  });

  it("is case-insensitive on both sides", () => {
    expect(matchesQuery(["Омлет с сыром"], "СЫР")).toBe(true);
  });

  it("matches a partial substring", () => {
    expect(matchesQuery(["Тыквенный крем-суп"], "тыкв")).toBe(true);
  });

  it("matches against any field (e.g. ingredient name, not just title)", () => {
    expect(matchesQuery(["Борщ", "свёкла", "капуста"], "капуст")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesQuery(["Борщ", "свёкла"], "паста")).toBe(false);
  });
});
