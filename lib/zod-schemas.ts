import { z } from "zod";

// Единый источник правды для enum'ов, используемых и в Prisma, и в рантайм-валидации
// (см. CLAUDE.md, раздел 5 и раздел 10 — "Типизация").

export const unitTypeSchema = z.enum(["WEIGHT", "VOLUME", "COUNT"]);
export type UnitTypeValue = z.infer<typeof unitTypeSchema>;

// Базовые единицы хранения — г/мл/шт (см. раздел 5 "Единицы измерения").
export const unitSchema = z.enum(["G", "ML", "PCS"]);
export type UnitValue = z.infer<typeof unitSchema>;

export const productCategorySchema = z.enum([
  "DAIRY",
  "MEAT_FISH",
  "VEGETABLES_FRUITS",
  "GROCERY",
  "BAKERY",
  "BEVERAGES",
  "FROZEN",
  "HOUSEHOLD_CHEMICALS",
  "PERSONAL_CARE",
  "OTHER",
]);
export type ProductCategoryValue = z.infer<typeof productCategorySchema>;

export const cookingMethodSchema = z.enum([
  "STOVETOP",
  "OVEN",
  "MULTICOOKER",
  "GRILL",
  "MICROWAVE",
  "NO_COOK",
]);
export type CookingMethodValue = z.infer<typeof cookingMethodSchema>;

export const householdRoleSchema = z.enum(["ORGANIZER", "EDITOR", "MEMBER"]);
export type HouseholdRoleValue = z.infer<typeof householdRoleSchema>;

// ---------- Claude Vision: распознавание продуктов на фото холодильника ----------
// Промпт передаёт список названий из справочника Ingredient — модель либо сопоставляет
// найденный продукт с существующим, либо помечает как новый (см. раздел 5,
// "Справочник ингредиентов"). Несколько фото уходят одним запросом, дубли между фото
// модель должна схлопнуть сама (см. раздел 6, "Поток фото холодильника").

export const recognizedProductSchema = z.object({
  // Название продукта, как его назвала модель (для нового) или как в справочнике (для существующего).
  name: z.string().min(1),
  // Существующий Ingredient.id, если модель сопоставила с справочником; иначе null — новый продукт.
  matchedIngredientId: z.string().nullable(),
  quantity: z.number().positive(),
  unitType: unitTypeSchema,
  unit: unitSchema,
  category: productCategorySchema,
  confidence: z.number().min(0).max(1).optional(),
});
export type RecognizedProduct = z.infer<typeof recognizedProductSchema>;

export const visionRecognitionResponseSchema = z.object({
  products: z.array(recognizedProductSchema),
});
export type VisionRecognitionResponse = z.infer<typeof visionRecognitionResponseSchema>;

// ---------- Формы ----------

// Новый пункт справочника Ingredient — создаётся при вводе рецепта/инвентаря, когда нужного
// продукта в каталоге ещё нет (см. раздел 5 "Справочник ингредиентов").
export const ingredientInputSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(60, "Слишком длинное название"),
  defaultUnitType: unitTypeSchema,
  category: productCategorySchema,
});
export type IngredientInput = z.infer<typeof ingredientInputSchema>;

export const recipeIngredientInputSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
  unit: unitSchema,
});

export const recipeStepInputSchema = z.object({
  order: z.number().int().nonnegative(),
  instruction: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
});

export const recipeInputSchema = z.object({
  title: z.string().min(1),
  photoUrl: z.string().url().nullable().optional(),
  baseServings: z.number().int().positive(),
  cookTimeMinutes: z.number().int().positive().nullable().optional(),
  cookingMethods: z.array(cookingMethodSchema),
  ingredients: z.array(recipeIngredientInputSchema).min(1),
  steps: z.array(recipeStepInputSchema).min(1),
});
export type RecipeInput = z.infer<typeof recipeInputSchema>;

export const manualShoppingItemInputSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: unitSchema,
  manualCategory: productCategorySchema.default("OTHER"),
});
export type ManualShoppingItemInput = z.infer<typeof manualShoppingItemInputSchema>;

// ---------- Household / профиль (этап 3) ----------

// Название household — необязательное; пустая строка трактуется как "не задано" (→ null в БД).
export const householdNameSchema = z.string().trim().max(60, "Слишком длинное название");

// Имя слота приёма пищи (MealSlot) — произвольный текст, но не пустой.
export const mealSlotNameSchema = z
  .string()
  .trim()
  .min(1, "Введите название")
  .max(40, "Слишком длинное название");

// Новый порядок слотов — массив их id в нужной последовательности; id не должны повторяться
// (иначе проверка "длина == размер набора" в reorderMealSlots пропустила бы [a, a, b]).
export const mealSlotOrderSchema = z
  .array(z.string().min(1))
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, "Дублирующиеся id слотов");

// ---------- Auth-формы (server actions + useActionState) ----------

export const loginFormSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль — минимум 6 символов"),
});
export type LoginFormInput = z.infer<typeof loginFormSchema>;

export const signupFormSchema = loginFormSchema.extend({
  name: z.string().min(1, "Укажите имя"),
  inviteCode: z.string().optional(),
});
export type SignupFormInput = z.infer<typeof signupFormSchema>;
