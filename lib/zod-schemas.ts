import { z } from "zod";

import { isIsoDate } from "./dates";

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
  // Название продукта, как его назвала модель (для нового) или как в справочнике (для
  // существующего). Лимит длины — как у ручного ввода (ingredientInputSchema).
  name: z.string().min(1).max(60),
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

// Подтверждение распознанного списка пользователем (после правок на экране проверки).
export const confirmRecognizedProductsSchema = z.object({
  products: z.array(recognizedProductSchema).min(1, "Нет продуктов для добавления"),
});
export type ConfirmRecognizedProductsInput = z.infer<typeof confirmRecognizedProductsSchema>;

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
  ingredientId: z.string().min(1, "Выберите продукт"),
  quantity: z.number().positive("Укажите количество"),
  unit: unitSchema,
});

export const recipeStepInputSchema = z.object({
  order: z.number().int().nonnegative(),
  instruction: z.string().min(1, "Опишите шаг"),
  photoUrl: z.string().url().nullable().optional(),
});

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1, "Введите название"),
  photoUrl: z
    .string({ invalid_type_error: "Добавьте фото рецепта" })
    .url("Добавьте фото рецепта"),
  baseServings: z.number().int().positive("Укажите число порций"),
  cookTimeMinutes: z
    .number()
    .int("Время — в целых минутах")
    .positive("Время должно быть больше нуля")
    .nullable()
    .optional(),
  cookingMethods: z.array(cookingMethodSchema),
  ingredients: z
    .array(recipeIngredientInputSchema)
    .min(1, "Добавьте хотя бы один ингредиент")
    .refine(
      (list) => new Set(list.map((i) => i.ingredientId)).size === list.length,
      "Один и тот же продукт добавлен несколько раз",
    ),
  steps: z.array(recipeStepInputSchema).min(1, "Добавьте хотя бы один шаг"),
});
export type RecipeInput = z.infer<typeof recipeInputSchema>;

// Ручное добавление в инвентарь: продукт из справочника + количество в базовой единице.
// Единицу клиент не передаёт — сервер выводит её из Ingredient.defaultUnitType.
export const pantryItemAddSchema = z.object({
  ingredientId: z.string().min(1, "Выберите продукт"),
  quantity: z.number().positive("Укажите количество"),
});
export type PantryItemAddInput = z.infer<typeof pantryItemAddSchema>;

export const pantryItemUpdateSchema = z.object({
  pantryItemId: z.string().min(1),
  quantity: z.number().positive("Укажите количество"),
});
export type PantryItemUpdateInput = z.infer<typeof pantryItemUpdateSchema>;

// Ручная позиция списка покупок — не привязана к справочнику и дням недели
// (см. CLAUDE.md §5, "Ручные позиции в списке покупок").
export const manualShoppingItemInputSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(60, "Слишком длинное название"),
  quantity: z.number().positive("Укажите количество"),
  unit: unitSchema,
  manualCategory: productCategorySchema.default("OTHER"),
});
export type ManualShoppingItemInput = z.infer<typeof manualShoppingItemInputSchema>;

// ---------- Household / профиль (этап 3) ----------

// Название household — необязательное; пустая строка трактуется как "не задано" (→ null в БД).
export const householdNameSchema = z.string().trim().max(60, "Слишком длинное название");

// Имя слота приёма пищи (MealSlot) — произвольный текст, но не пустой. Максимум 15 символов:
// имя выводится бейджем на карточках "Сегодня"/"Меню на неделю", где длиннее не помещается.
export const mealSlotNameSchema = z
  .string()
  .trim()
  .min(1, "Введите название")
  .max(15, "Максимум 15 символов");

// Новый порядок слотов — массив их id в нужной последовательности; id не должны повторяться
// (иначе проверка "длина == размер набора" в reorderMealSlots пропустила бы [a, a, b]).
export const mealSlotOrderSchema = z
  .array(z.string().min(1))
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, "Дублирующиеся id слотов");

// ---------- Меню на неделю (этап 6) ----------

// Дата дня меню — календарная "YYYY-MM-DD" (см. lib/dates.ts), а не Date: часовой пояс клиента
// не должен влиять на то, в какой день попадёт рецепт.
export const isoDateSchema = z
  .string()
  .refine((value) => isIsoDate(value), "Некорректная дата");

// Назначение рецепта в слот дня. servings — сколько порций готовим в этот раз (по умолчанию
// на клиенте подставляется Recipe.baseServings, см. CLAUDE.md §5 "Порции").
export const menuAssignSchema = z.object({
  date: isoDateSchema,
  mealSlotId: z.string().min(1, "Выберите приём пищи"),
  recipeId: z.string().min(1, "Выберите рецепт"),
  servings: z.number().int().positive("Укажите число порций").max(99, "Слишком много порций"),
});
export type MenuAssignInput = z.infer<typeof menuAssignSchema>;

// Имя шаблона меню (см. CLAUDE.md §5 "Шаблоны меню") — произвольный текст, не пустой. До 40
// символов: имя выводится на карточке шаблона в отдельной строке, длиннее не нужно.
export const menuTemplateNameSchema = z
  .string()
  .trim()
  .min(1, "Введите название")
  .max(40, "Максимум 40 символов");

// ---------- Скушано и список покупок (этап 8) ----------

// Списание запасов после отметки "скушано" (см. CLAUDE.md §6, поток "отметил, что скушал"):
// выбранное число порций + итоговые (возможно, правленные вручную) количества по ингредиентам.
// quantity = 0 — ингредиент не списывается.
export const mealDeductSchema = z.object({
  mealId: z.string().min(1),
  servings: z.number().int().positive("Укажите число порций").max(99, "Слишком много порций"),
  items: z.array(
    z.object({
      ingredientId: z.string().min(1),
      quantity: z.number().min(0, "Количество не может быть отрицательным"),
    }),
  ),
});
export type MealDeductInput = z.infer<typeof mealDeductSchema>;

export const shoppingItemBoughtSchema = z.object({
  itemId: z.string().min(1),
  isBought: z.boolean(),
});

// Редактирование позиции списка покупок: name/unit применяются только к ручным позициям
// (у позиций из меню название и единица идут из справочника — см. lib/actions/shopping-list.ts).
export const shoppingItemUpdateSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().trim().min(1, "Введите название").max(60, "Слишком длинное название"),
  quantity: z.number().positive("Укажите количество"),
  unit: unitSchema,
});

// Массовый перенос купленного в инвентарь (см. CLAUDE.md §6, поток "массовое обновление
// инвентаря"): quantity = 0 — позиция пропускается и остаётся addedToPantry = false.
export const addBoughtToPantrySchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.number().min(0, "Количество не может быть отрицательным"),
      }),
    )
    .min(1, "Нет позиций для переноса"),
});
export type AddBoughtToPantryInput = z.infer<typeof addBoughtToPantrySchema>;

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
