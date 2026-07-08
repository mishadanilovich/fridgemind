import type { ProductCategory } from "./types";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  DAIRY: "Молочные продукты",
  MEAT_FISH: "Мясо и рыба",
  VEGETABLES_FRUITS: "Овощи и фрукты",
  GROCERY: "Крупы и бакалея",
  BAKERY: "Хлеб и выпечка",
  BEVERAGES: "Напитки",
  FROZEN: "Заморозка",
  HOUSEHOLD_CHEMICALS: "Бытовая химия",
  PERSONAL_CARE: "Гигиена и красота",
  OTHER: "Другое",
};

export const PRODUCT_CATEGORIES = Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[];
