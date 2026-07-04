// Общие типы — переиспользуются между сервером и клиентом (см. CLAUDE.md, раздел 10).
// Типы слоя БД идут напрямую из Prisma Client и не дублируются руками.

export type {
  Household,
  User,
  Ingredient,
  Recipe,
  RecipeStep,
  RecipeIngredient,
  PantryItem,
  MealSlot,
  MenuWeek,
  MenuDay,
  MenuDayMeal,
  ShoppingListItem,
  ShoppingListItemMeal,
  HouseholdRole,
  UnitType,
  Unit,
  ProductCategory,
  CookingMethod,
  PantryItemSource,
} from "@prisma/client";

export type {
  RecognizedProduct,
  VisionRecognitionResponse,
  RecipeInput,
  ManualShoppingItemInput,
  UnitTypeValue,
  UnitValue,
  ProductCategoryValue,
  CookingMethodValue,
  HouseholdRoleValue,
} from "./zod-schemas";

/** Рецепт с загруженными шагами и ингредиентами — типичная форма для экрана просмотра. */
export type RecipeWithDetails = import("@prisma/client").Recipe & {
  steps: import("@prisma/client").RecipeStep[];
  ingredients: (import("@prisma/client").RecipeIngredient & {
    ingredient: import("@prisma/client").Ingredient;
  })[];
};

/** Слот дня меню с назначенным рецептом (если есть) — форма для "Сегодня"/"Меню на неделю". */
export type MenuSlotView = {
  mealSlot: import("@prisma/client").MealSlot;
  meal:
    | (import("@prisma/client").MenuDayMeal & { recipe: import("@prisma/client").Recipe })
    | null;
};
