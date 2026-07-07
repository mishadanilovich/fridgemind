import { describe, expect, it } from "vitest";

import { fieldIssues, firstIssue } from "./form-state";

describe("fieldIssues", () => {
  it("maps issues to their top-level fields", () => {
    expect(
      fieldIssues([
        { path: ["title"], message: "Введите название" },
        { path: ["steps"], message: "Добавьте хотя бы один шаг" },
      ]),
    ).toEqual({ title: "Введите название", steps: "Добавьте хотя бы один шаг" });
  });

  it("attributes nested paths to the top-level field", () => {
    expect(fieldIssues([{ path: ["ingredients", 0, "quantity"], message: "Укажите количество" }]))
      .toEqual({ ingredients: "Укажите количество" });
  });

  it("keeps the first message per field", () => {
    expect(
      fieldIssues([
        { path: ["title"], message: "Первая" },
        { path: ["title"], message: "Вторая" },
      ]),
    ).toEqual({ title: "Первая" });
  });

  it("ignores issues without a path", () => {
    expect(fieldIssues([{ path: [], message: "Общая ошибка" }])).toEqual({});
  });
});

describe("firstIssue", () => {
  it("returns the first message or a fallback", () => {
    expect(firstIssue([{ message: "Ошибка" }])).toBe("Ошибка");
    expect(firstIssue([])).toBe("Проверьте введённые данные");
  });
});
