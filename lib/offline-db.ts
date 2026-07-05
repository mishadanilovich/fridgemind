import Dexie, { type EntityTable } from "dexie";

// Офлайн-кэш через IndexedDB (см. CLAUDE.md, раздел 4 "Локальное хранилище/офлайн").
// Хранит последнее известное состояние меню/рецептов/списка покупок для чтения без сети;
// синхронизация с сервером — при восстановлении сети и через Supabase Realtime (для списка покупок).

type CachedMenuWeek = {
  id: string; // menuWeekId
  data: unknown; // сериализованный MenuWeek + days + meals + recipe
  cachedAt: number;
}

type CachedShoppingList = {
  id: string; // householdId
  data: unknown; // сериализованные ShoppingListItem[]
  cachedAt: number;
}

type CachedRecipe = {
  id: string; // recipeId
  data: unknown;
  cachedAt: number;
}

const db = new Dexie("fridgemind-offline") as Dexie & {
  menuWeeks: EntityTable<CachedMenuWeek, "id">;
  shoppingLists: EntityTable<CachedShoppingList, "id">;
  recipes: EntityTable<CachedRecipe, "id">;
};

db.version(1).stores({
  menuWeeks: "id, cachedAt",
  shoppingLists: "id, cachedAt",
  recipes: "id, cachedAt",
});

export { db as offlineDb };
export type { CachedMenuWeek, CachedRecipe,CachedShoppingList };
