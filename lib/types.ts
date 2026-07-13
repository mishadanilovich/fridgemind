// Общие типы — переиспользуются между сервером и клиентом (см. CLAUDE.md, раздел 10).
// Типы слоя БД идут напрямую из Prisma Client и не дублируются руками.

import type {
  CookingMethod,
  Ingredient,
  PantryItem,
  ProductCategory,
  Recipe,
  RecipeIngredient,
  RecipeStep,
  Unit,
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
  PantryItemAddInput,
  PantryItemUpdateInput,
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

/** Приём пищи, назначенный в слот дня — карточка на "Сегодня"/"Меню на неделю"/просмотре дня. */
export type MenuMealView = {
  id: string;
  recipeId: string;
  title: string;
  photoUrl: string | null;
  cookTimeMinutes: number | null;
  cookingMethods: CookingMethod[];
  servings: number;
  isEaten: boolean;
};

/** Слот дня меню с назначенным рецептом (если есть) — форма для "Сегодня"/"Меню на неделю". */
export type MenuSlotView = {
  slotId: string;
  slotName: string;
  meal: MenuMealView | null;
};

/** День меню: дата в формате "YYYY-MM-DD" (см. lib/dates.ts) и его слоты в порядке household'а. */
export type MenuDayView = {
  date: string;
  slots: MenuSlotView[];
};

/** Рецепт в шторке выбора рецепта на слот — baseServings задаёт начальное значение степпера. */
export type PickerRecipeView = {
  id: string;
  title: string;
  photoUrl: string | null;
  cookTimeMinutes: number | null;
  cookingMethods: CookingMethod[];
  baseServings: number;
};

/** Позиция инвентаря с продуктом из справочника — форма для экрана "Запасы". */
export type PantryItemView = PantryItem & { ingredient: Ingredient };

/** Ингредиент в шите списания — количество в базовой единице на Recipe.baseServings. */
export type EatIngredientView = {
  ingredientId: string;
  name: string;
  unit: Unit;
  quantity: number;
};

/**
 * Payload шита "Списать использованные продукты?" — возвращается markMealEaten
 * (см. CLAUDE.md §6, поток "отметил, что скушал"). Количества ингредиентов клиент
 * пересчитывает сам под выбранное в степпере число порций (scaleIngredient).
 */
export type EatDeductionView = {
  mealId: string;
  recipeTitle: string;
  photoUrl: string | null;
  servings: number;
  baseServings: number;
  ingredients: EatIngredientView[];
};

/**
 * Позиция списка покупок для экрана. quantity: у ручных — введённое количество, у позиций
 * из меню — потребность всей недели без вычета запасов; сколько реально купить, считается
 * на лету из perDay (ISO-дата → вклад дня) и pantryQuantity (см. lib/shopping-list.ts).
 */
export type ShoppingItemView = {
  id: string;
  name: string;
  unit: Unit;
  category: ProductCategory;
  isManual: boolean;
  isBought: boolean;
  addedToPantry: boolean;
  /** Имя участника, отметившего "куплено" — подпись под зачёркнутой позицией. */
  boughtByName: string | null;
  quantity: number;
  pantryQuantity: number;
  perDay: Record<string, number>;
};
