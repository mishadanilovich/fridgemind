import { PRODUCT_CATEGORIES } from "./product-categories";
import type { PantryItemView, ProductCategory } from "./types";

export type PantryGroup = { category: ProductCategory; items: PantryItemView[] };

// Группировка инвентаря по категориям справочника: порядок групп — как в PRODUCT_CATEGORIES,
// внутри группы — по алфавиту; пустые категории не показываются.
export function groupPantryItems(items: PantryItemView[]): PantryGroup[] {
  return PRODUCT_CATEGORIES.map((category) => ({
    category,
    items: items
      .filter((item) => item.ingredient.category === category)
      .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name, "ru")),
  })).filter((group) => group.items.length > 0);
}
