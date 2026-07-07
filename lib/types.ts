// Общие типы — переиспользуются между сервером и клиентом (см. CLAUDE.md, раздел 10).
// Типы слоя БД идут напрямую из Prisma Client и не дублируются руками.

import type {
  CookingMethod,
  Ingredient,
  MealSlot,
  MenuDayMeal,
  Recipe,
  RecipeIngredient,
  RecipeStep,
} from "./generated/prisma/client";

export type {
  CookingMethod,
  Household,
  HouseholdRole,
  Ingredient,
  MealSlot,
  MenuDay,
  MenuDayMeal,
  MenuWeek,
  PantryItem,
  PantryItemSource,
  ProductCategory,
  Recipe,
  RecipeIngredient,
  RecipeStep,
  ShoppingListItem,
  ShoppingListItemMeal,
  Unit,
  UnitType,
  User,
} from "./generated/prisma/client";
export type {
  CookingMethodValue,
  HouseholdRoleValue,
  IngredientInput,
  ManualShoppingItemInput,
  ProductCategoryValue,
  RecipeInput,
  RecognizedProduct,
  UnitTypeValue,
  UnitValue,
  VisionRecognitionResponse,
} from "./zod-schemas";

/** Рецепт с загруженными шагами и ингредиентами — типичная форма для экрана просмотра. */
export type RecipeWithDetails = Recipe & {
  steps: RecipeStep[];
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
};

/**
 * Карточка рецепта в списке (экран "Рецепты"). matchHave/matchTotal — сколько ингредиентов
 * рецепта уже есть в инвентаре из общего числа, для сортировки "приготовить из того, что есть".
 */
export type RecipeCardView = {
  id: string;
  title: string;
  photoUrl: string | null;
  cookTimeMinutes: number | null;
  cookingMethods: CookingMethod[];
  matchHave: number;
  matchTotal: number;
};

/** Слот дня меню с назначенным рецептом (если есть) — форма для "Сегодня"/"Меню на неделю". */
export type MenuSlotView = {
  mealSlot: MealSlot;
  meal: (MenuDayMeal & { recipe: Recipe }) | null;
};
