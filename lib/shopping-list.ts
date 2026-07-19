import type { Prisma } from "./generated/prisma/client";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "./product-categories";
import { scaleIngredient } from "./recipes";
import type { ProductCategory, ShoppingItemView, Unit } from "./types";
import { formatQuantity, UNIT_TO_TYPE } from "./units";

/** Приём пищи с ингредиентами рецепта — вход агрегации (см. CLAUDE.md §6, поток "список покупок"). */
export type MealNeedsSource = {
  id: string;
  servings: number;
  recipe: {
    baseServings: number;
    ingredients: {
      ingredientId: string;
      name: string;
      quantity: number;
      unit: Unit;
    }[];
  };
};

// Общий select потребности недели/дня — переиспользуется синхронизацией списка покупок
// (lib/actions/shopping-list.ts) и просмотром дня (getDayIngredients).
export const mealNeedsSelect = {
  id: true,
  servings: true,
  recipe: {
    select: {
      baseServings: true,
      ingredients: {
        select: {
          ingredientId: true,
          quantity: true,
          unit: true,
          ingredient: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.MenuDayMealSelect;

export type MealNeedsRow = Prisma.MenuDayMealGetPayload<{ select: typeof mealNeedsSelect }>;

export function toMealNeedsSource(row: MealNeedsRow): MealNeedsSource {
  return {
    id: row.id,
    servings: row.servings,
    recipe: {
      baseServings: row.recipe.baseServings,
      ingredients: row.recipe.ingredients.map((ri) => ({
        ingredientId: ri.ingredientId,
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
    },
  };
}

// Общий select текущих (не ручных) позиций недели — вход diff'а в syncWeekItems.
export const existingShoppingItemSelect = {
  id: true,
  ingredientId: true,
  name: true,
  quantity: true,
  unit: true,
  isBought: true,
  addedToPantry: true,
  ingredient: { select: { category: true } },
  meals: { select: { menuDayMealId: true, quantity: true } },
} satisfies Prisma.ShoppingListItemSelect;

export type ExistingShoppingItem = Prisma.ShoppingListItemGetPayload<{
  select: typeof existingShoppingItemSelect;
}>;

/** Суммарная потребность в продукте + вклад каждого приёма пищи (→ ShoppingListItemMeal). */
export type IngredientNeed = {
  ingredientId: string;
  name: string;
  unit: Unit;
  total: number;
  contributions: { menuDayMealId: string; quantity: number }[];
};

export function sameContributions(existing: ExistingShoppingItem, need: IngredientNeed): boolean {
  if (existing.meals.length !== need.contributions.length) return false;
  const byMeal = new Map(existing.meals.map((m) => [m.menuDayMealId, m.quantity]));
  return need.contributions.every((c) => byMeal.get(c.menuDayMealId) === c.quantity);
}

// Количества каждого приёма пищи пересчитываются под его servings (см. CLAUDE.md §5 "Порции")
// и суммируются по ingredientId. Округлённый до нуля вклад (COUNT на малые порции) не пишется.
export function aggregateWeekNeeds(meals: MealNeedsSource[]): Map<string, IngredientNeed> {
  const needs = new Map<string, IngredientNeed>();

  for (const meal of meals) {
    for (const row of meal.recipe.ingredients) {
      const quantity = scaleIngredient(
        row.quantity,
        meal.servings,
        meal.recipe.baseServings,
        UNIT_TO_TYPE[row.unit],
      );
      if (quantity <= 0) continue;

      let need = needs.get(row.ingredientId);
      if (!need) {
        need = {
          ingredientId: row.ingredientId,
          name: row.name,
          unit: row.unit,
          total: 0,
          contributions: [],
        };
        needs.set(row.ingredientId, need);
      }
      need.total += quantity;
      need.contributions.push({ menuDayMealId: meal.id, quantity });
    }
  }

  return needs;
}

type NeededSource = Pick<ShoppingItemView, "isManual" | "quantity" | "pantryQuantity" | "perDay">;

/**
 * Сколько нужно купить по позиции под выбранные дни (null — вся неделя): потребность за дни
 * минус текущий остаток дома, не ниже нуля. Ручные позиции не привязаны к дням и запасам —
 * показываются всегда со своим количеством (см. CLAUDE.md §6, поток "фильтр по дням").
 *
 * Недельная потребность — item.quantity, а не сумма perDay: обычно это одно и то же
 * (quantity — сумма вкладов), но количество могло быть поправлено вручную прямо в списке —
 * правка переживает syncWeekItems и перезаписывается только реальным изменением плана.
 * Чтобы дневные фильтры не противоречили недельному виду (день не может требовать больше,
 * чем вся неделя), правка распределяется по дням пропорционально их вкладам: сумма по всем
 * дням всегда равна item.quantity.
 */
export function neededQuantity(item: NeededSource, days: readonly string[] | null): number {
  if (item.isManual) return item.quantity;

  let required: number;
  if (days === null) {
    required = item.quantity;
  } else {
    const weekTotal = Object.values(item.perDay).reduce((sum, quantity) => sum + quantity, 0);
    const daysTotal = days.reduce((sum, day) => sum + (item.perDay[day] ?? 0), 0);
    required = weekTotal > 0 ? (daysTotal * item.quantity) / weekTotal : 0;
  }
  return Math.max(0, required - item.pantryQuantity);
}

export type ShoppingGroup = {
  category: ProductCategory;
  items: (ShoppingItemView & { needed: number })[];
};

// Группы — в порядке PRODUCT_CATEGORIES, внутри — по алфавиту; позиции, полностью покрытые
// запасами под выбранные дни, скрываются (покупать нечего), пустые категории не показываются.
export function buildShoppingGroups(
  items: ShoppingItemView[],
  days: readonly string[] | null,
): ShoppingGroup[] {
  const visible = items
    .map((item) => ({ ...item, needed: neededQuantity(item, days) }))
    .filter((item) => item.needed > 0);

  return PRODUCT_CATEGORIES.map((category) => ({
    category,
    items: visible
      .filter((item) => item.category === category)
      .sort((a, b) => a.name.localeCompare(b.name, "ru")),
  })).filter((group) => group.items.length > 0);
}

// Текстовое представление списка для кнопки "Поделиться" (см. CLAUDE.md §3 п.13).
export function formatShoppingListText(groups: ShoppingGroup[], filterLabel: string): string {
  const header = `Список покупок · ${filterLabel}`;
  if (groups.length === 0) return `${header}\n\nСписок пуст`;

  const body = groups
    .map((group) => {
      const lines = group.items
        .map((i) => `${i.isBought ? "✓" : "•"} ${i.name} — ${formatQuantity(i.needed, i.unit)}`)
        .join("\n");
      return `${PRODUCT_CATEGORY_LABELS[group.category]}\n${lines}`;
    })
    .join("\n\n");

  return `${header}\n\n${body}`;
}

/** Ингредиент дня с отметкой "есть дома"/"нужно купить" — экран просмотра дня (MVP-пункт 6). */
export type DayIngredientView = {
  ingredientId: string;
  name: string;
  unit: Unit;
  needed: number;
  enough: boolean;
};

// Потребность всех слотов дня против остатков инвентаря: чего не хватает — первым, чтобы
// "нужно купить" было видно без прокрутки; дальше — по алфавиту.
export function compareDayIngredients(
  meals: MealNeedsSource[],
  pantry: ReadonlyMap<string, number>,
): DayIngredientView[] {
  return [...aggregateWeekNeeds(meals).values()]
    .map((need) => ({
      ingredientId: need.ingredientId,
      name: need.name,
      unit: need.unit,
      needed: need.total,
      enough: (pantry.get(need.ingredientId) ?? 0) >= need.total,
    }))
    .sort((a, b) =>
      a.enough === b.enough ? a.name.localeCompare(b.name, "ru") : a.enough ? 1 : -1,
    );
}
