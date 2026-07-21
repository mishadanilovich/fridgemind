import { describe, expect, it } from "vitest";

import { pluralize, pluralizeWithCount } from "./plural";

describe("pluralize", () => {
  const форма = (n: number) => pluralize(n, "приём", "приёма", "приёмов");

  it("one — для 1, 21, 31, 101", () => {
    for (const n of [1, 21, 31, 101]) expect(форма(n)).toBe("приём");
  });

  it("few — для 2–4, 22–24", () => {
    for (const n of [2, 3, 4, 22, 23, 24]) expect(форма(n)).toBe("приёма");
  });

  it("many — для 0, 5–20, 11–14", () => {
    for (const n of [0, 5, 11, 12, 14, 15, 20, 25]) expect(форма(n)).toBe("приёмов");
  });

  it("pluralizeWithCount добавляет число", () => {
    expect(pluralizeWithCount(3, "приём", "приёма", "приёмов")).toBe("3 приёма");
    expect(pluralizeWithCount(1, "приём", "приёма", "приёмов")).toBe("1 приём");
  });
});
