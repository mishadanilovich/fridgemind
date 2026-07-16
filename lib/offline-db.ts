import Dexie, { type EntityTable } from "dexie";

import type { PantryGroup } from "./pantry";
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
/** id — всегда "all": один снапшот последнего показанного инвентаря. */
type CachedPantry = Snapshot<PantryGroup[]>;

const db = new Dexie("fridgemind-offline") as Dexie & {
  menuWeeks: EntityTable<CachedMenuWeek, "id">;
  menuDays: EntityTable<CachedMenuDay, "id">;
  shoppingLists: EntityTable<CachedShoppingList, "id">;
  recipes: EntityTable<CachedRecipeDetail, "id">;
  recipeLists: EntityTable<CachedRecipeList, "id">;
  pantry: EntityTable<CachedPantry, "id">;
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

db.version(3).stores({
  pantry: "id, cachedAt",
});

export type OfflineSnapshotInput =
  | { table: "menuWeeks"; id: string; data: MenuDayView[] }
  | { table: "menuDays"; id: string; data: MenuDayView }
  | { table: "shoppingLists"; id: string; data: { weekStart: string; items: ShoppingItemView[] } }
  | { table: "recipes"; id: string; data: RecipeWithDetails }
  | { table: "recipeLists"; id: string; data: RecipeCardView[] }
  | { table: "pantry"; id: string; data: PantryGroup[] };

const MAX_SNAPSHOT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const SCOPE_KEY = "fridgemind-offline-household";

// Runtime-кэши service worker'а с пользовательскими ответами (HTML/RSC/данные/фото) — имена
// из defaultCache @serwist/next. Без их очистки офлайн показывал бы страницы прежнего
// пользователя вперемешку с новыми: SW кэширует отрендеренный HTML по URL, без учёта сессии.
// Статика, шрифты и precache не трогаются.
const USER_SW_CACHES = [
  "pages",
  "pages-rsc",
  "pages-rsc-prefetch",
  "next-data",
  "static-data-assets",
  "apis",
  "others",
  "next-image",
];

async function clearSwUserCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const names = await caches.keys();
  await Promise.all(
    names.filter((name) => USER_SW_CACHES.includes(name)).map((name) => caches.delete(name)),
  );
}

/** Стирает офлайн-кэш целиком — выход из аккаунта и смена household (см. ensureHouseholdScope). */
export async function clearOfflineCache(): Promise<void> {
  localStorage.removeItem(SCOPE_KEY);
  await Promise.all([
    db.menuWeeks.clear(),
    db.menuDays.clear(),
    db.shoppingLists.clear(),
    db.recipes.clear(),
    db.recipeLists.clear(),
    db.pantry.clear(),
    clearSwUserCaches(),
  ]);
}

// Кэш принадлежит одному household: если в этом браузере вошли под другим (другой аккаунт,
// выход из семьи, присоединение по приглашению) — чужие снапшоты стираются до первой записи,
// иначе /~offline показал бы данные прежней семьи.
async function ensureHouseholdScope(householdId: string): Promise<void> {
  if (localStorage.getItem(SCOPE_KEY) === householdId) return;
  await clearOfflineCache();
  localStorage.setItem(SCOPE_KEY, householdId);
}

// Инвалидация — "последний успешный онлайн-визит побеждает": снапшот просто перезаписывается,
// TTL нет; офлайн-страница показывает cachedAt, а записи старше 30 дней вычищаются при записи.
export async function saveOfflineSnapshot(
  householdId: string,
  input: OfflineSnapshotInput,
): Promise<void> {
  await ensureHouseholdScope(householdId);
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
    case "pantry":
      await db.pantry.put({ id: input.id, data: input.data, cachedAt });
      break;
  }

  await db
    .table(input.table)
    .where("cachedAt")
    .below(cachedAt - MAX_SNAPSHOT_AGE_MS)
    .delete();
}

export { db as offlineDb };
