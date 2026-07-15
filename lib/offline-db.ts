import Dexie, { type EntityTable } from "dexie";

import type { MenuDayView, RecipeCardView, RecipeWithDetails, ShoppingItemView } from "./types";

// Офлайн-кэш через IndexedDB (см. CLAUDE.md, раздел 4 "Локальное хранилище/офлайн").
// Хранит последний отрисованный view-снапшот каждого экрана для чтения без сети:
// запись — OfflineSnapshot на страницах, чтение — офлайн-страница /~offline.

type Snapshot<TData> = {
  id: string;
  data: TData;
  cachedAt: number;
};

/** id — понедельник недели "YYYY-MM-DD". */
type CachedMenuWeek = Snapshot<MenuDayView[]>;
/** id — дата дня "YYYY-MM-DD" (экраны "Сегодня" и просмотр дня). */
type CachedMenuDay = Snapshot<MenuDayView>;
/** id — понедельник недели "YYYY-MM-DD". */
type CachedShoppingList = Snapshot<{ weekStart: string; items: ShoppingItemView[] }>;
/** id — recipeId. */
type CachedRecipeDetail = Snapshot<RecipeWithDetails>;
/** id — всегда "all": один снапшот последнего показанного списка карточек. */
type CachedRecipeList = Snapshot<RecipeCardView[]>;

const db = new Dexie("fridgemind-offline") as Dexie & {
  menuWeeks: EntityTable<CachedMenuWeek, "id">;
  menuDays: EntityTable<CachedMenuDay, "id">;
  shoppingLists: EntityTable<CachedShoppingList, "id">;
  recipes: EntityTable<CachedRecipeDetail, "id">;
  recipeLists: EntityTable<CachedRecipeList, "id">;
};

db.version(1).stores({
  menuWeeks: "id, cachedAt",
  shoppingLists: "id, cachedAt",
  recipes: "id, cachedAt",
});

db.version(2).stores({
  menuDays: "id, cachedAt",
  recipeLists: "id, cachedAt",
});

export type OfflineSnapshotInput =
  | { table: "menuWeeks"; id: string; data: MenuDayView[] }
  | { table: "menuDays"; id: string; data: MenuDayView }
  | { table: "shoppingLists"; id: string; data: { weekStart: string; items: ShoppingItemView[] } }
  | { table: "recipes"; id: string; data: RecipeWithDetails }
  | { table: "recipeLists"; id: string; data: RecipeCardView[] };

const MAX_SNAPSHOT_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Инвалидация — "последний успешный онлайн-визит побеждает": снапшот просто перезаписывается,
// TTL нет; офлайн-страница показывает cachedAt, а записи старше 30 дней вычищаются при записи.
export async function saveOfflineSnapshot(input: OfflineSnapshotInput): Promise<void> {
  const cachedAt = Date.now();

  switch (input.table) {
    case "menuWeeks":
      await db.menuWeeks.put({ id: input.id, data: input.data, cachedAt });
      break;
    case "menuDays":
      await db.menuDays.put({ id: input.id, data: input.data, cachedAt });
      break;
    case "shoppingLists":
      await db.shoppingLists.put({ id: input.id, data: input.data, cachedAt });
      break;
    case "recipes":
      await db.recipes.put({ id: input.id, data: input.data, cachedAt });
      break;
    case "recipeLists":
      await db.recipeLists.put({ id: input.id, data: input.data, cachedAt });
      break;
  }

  await db
    .table(input.table)
    .where("cachedAt")
    .below(cachedAt - MAX_SNAPSHOT_AGE_MS)
    .delete();
}

export { db as offlineDb };
export type {
  CachedMenuDay,
  CachedMenuWeek,
  CachedRecipeDetail,
  CachedRecipeList,
  CachedShoppingList,
};
