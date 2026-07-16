import { describe, expect, it } from "vitest";

import {
  callAction,
  fieldIssues,
  firstIssue,
  guardFormAction,
  initialFormState,
  NETWORK_ERROR,
} from "./form-state";

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

describe("callAction", () => {
  it("passes a successful result through", async () => {
    expect(await callAction(async () => ({ error: null }))).toEqual({ error: null });
  });

  it("turns a network failure into a plain error result", async () => {
    const result = await callAction<{ error: string | null }>(async () => {
      throw new TypeError("fetch failed");
    });
    expect(result.error).toBe(NETWORK_ERROR);
  });

  it("rethrows Next internal control-flow errors (redirect)", async () => {
    const redirectError = Object.assign(new Error(), { digest: "NEXT_REDIRECT;push;/;303" });
    await expect(
      callAction<{ error: string | null }>(async () => {
        throw redirectError;
      }),
    ).rejects.toBe(redirectError);
  });
});

describe("guardFormAction", () => {
  it("turns a network failure into FormState with a shared error", async () => {
    const guarded = guardFormAction(async () => {
      throw new TypeError("fetch failed");
    });
    expect(await guarded(initialFormState, new FormData())).toEqual({ error: NETWORK_ERROR });
  });
});
