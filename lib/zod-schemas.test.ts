import { describe, expect, it } from "vitest";

import type { RecipeInput } from "./zod-schemas";
import { recipeInputSchema } from "./zod-schemas";

const validInput: RecipeInput = {
  title: "Тыквенный крем-суп",
  photoUrl: "https://example.com/photo.webp",
  baseServings: 2,
  cookingMethods: ["STOVETOP"],
  ingredients: [
    { ingredientId: "ing-1", quantity: 300, unit: "G" },
    { ingredientId: "ing-2", quantity: 500, unit: "ML" },
  ],
  steps: [{ order: 0, instruction: "Нарезать тыкву", photoUrl: null }],
};

describe("recipeInputSchema", () => {
  it("accepts valid input", () => {
    expect(recipeInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects duplicate ingredients", () => {
    const result = recipeInputSchema.safeParse({
      ...validInput,
      ingredients: [
        { ingredientId: "ing-1", quantity: 300, unit: "G" },
        { ingredientId: "ing-1", quantity: 100, unit: "G" },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["ingredients"]);
      expect(result.error.issues[0]?.message).toBe("Один и тот же продукт добавлен несколько раз");
    }
  });

  it("rejects a step with a photo but no instruction", () => {
    const result = recipeInputSchema.safeParse({
      ...validInput,
      steps: [{ order: 0, instruction: "", photoUrl: "https://example.com/step.webp" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["steps", 0, "instruction"]);
    }
  });
});
