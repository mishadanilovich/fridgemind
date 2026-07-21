import { describe, expect, it } from "vitest";

import { buildImportPreview, buildImportPrompt, parseImportJson } from "./recipe-import";

const VALID = JSON.stringify({
  recipes: [
    {
      title: "Куриный суп",
      baseServings: 4,
      cookTimeMinutes: 40,
      cookingMethods: ["stovetop"],
      ingredients: [
        { name: "Куриное филе", quantity: 500, unit: "g" },
        { name: "Морковь", quantity: 1, unit: "pcs" },
      ],
      steps: ["Вскипятить воду", "Добавить овощи"],
    },
  ],
});

describe("parseImportJson", () => {
  it("разбирает валидный файл и нормализует единицы/способы в наши enum'ы", () => {
    const result = parseImportJson(VALID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const recipe = result.recipes[0]!;
    expect(recipe.ingredients[0]).toMatchObject({ unit: "G" });
    expect(recipe.ingredients[1]).toMatchObject({ unit: "PCS" });
    expect(recipe.cookingMethods).toEqual(["STOVETOP"]);
  });

  it("принимает голый массив рецептов без обёртки recipes", () => {
    const bare = JSON.stringify([
      {
        title: "Салат",
        baseServings: 2,
        ingredients: [{ name: "Огурец", quantity: 2, unit: "pcs" }],
        steps: ["Нарезать"],
      },
    ]);
    const result = parseImportJson(bare);
    expect(result.ok).toBe(true);
  });

  it("ошибка на невалидном JSON", () => {
    const result = parseImportJson("{ не json");
    expect(result).toMatchObject({ ok: false });
  });

  it("ошибка на пустом вводе", () => {
    expect(parseImportJson("   ")).toMatchObject({ ok: false });
  });

  it("ошибка на недопустимой единице измерения", () => {
    const bad = JSON.stringify({
      recipes: [
        {
          title: "Плов",
          baseServings: 4,
          ingredients: [{ name: "Рис", quantity: 300, unit: "кг" }],
          steps: ["Готовить"],
        },
      ],
    });
    expect(parseImportJson(bad)).toMatchObject({ ok: false });
  });
});

describe("buildImportPreview", () => {
  it("помечает несовпавшие ингредиенты и собирает их уникально по имени", () => {
    const parsed = parseImportJson(
      JSON.stringify({
        recipes: [
          {
            title: "Р1",
            baseServings: 2,
            ingredients: [
              { name: "Морковь", quantity: 1, unit: "pcs" },
              { name: "Сельдерей", quantity: 1, unit: "pcs" },
            ],
            steps: ["шаг"],
          },
          {
            title: "Р2",
            baseServings: 2,
            ingredients: [{ name: "сельдерей", quantity: 2, unit: "pcs" }],
            steps: ["шаг"],
          },
        ],
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const preview = buildImportPreview(parsed.recipes, new Set(["морковь"]));
    // "Сельдерей" встречается в двух рецептах в разном регистре — в списке один раз.
    expect(preview.unmatched).toEqual([{ name: "Сельдерей", unit: "PCS" }]);
    expect(preview.recipes[0]?.newIngredientNames).toEqual(["Сельдерей"]);
    expect(preview.recipes[1]?.newIngredientNames).toEqual(["сельдерей"]);
  });

  it("пустой unmatched, когда все ингредиенты есть в справочнике", () => {
    const parsed = parseImportJson(VALID);
    if (!parsed.ok) throw new Error("fixture");
    const preview = buildImportPreview(parsed.recipes, new Set(["куриное филе", "морковь"]));
    expect(preview.unmatched).toEqual([]);
  });
});

describe("buildImportPrompt", () => {
  it("включает пожелания, правила и список названий из справочника", () => {
    const prompt = buildImportPrompt("3 быстрых ужина", ["Морковь", "Лук"]);
    expect(prompt).toContain("3 быстрых ужина");
    expect(prompt).toContain('"recipes"');
    expect(prompt).toContain("Морковь, Лук");
    expect(prompt).toContain("stovetop");
  });

  it("без справочника не добавляет блок с названиями", () => {
    const prompt = buildImportPrompt("", []);
    expect(prompt).not.toContain("используй ТОЧНО эти названия");
  });
});
