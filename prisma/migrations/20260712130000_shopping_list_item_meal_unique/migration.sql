-- Один вклад на пару (позиция, приём пищи): вторая линия защиты от гонки при параллельной
-- синхронизации списка покупок (см. lib/actions/shopping-list.ts, syncWeekItems) — основную
-- защиту даёт pg_advisory_xact_lock внутри транзакции синхронизации, это ограничение ловит
-- дубли, если по какой-то причине лок не сработал.
create unique index "shopping_list_item_meals_item_meal_key"
    on "public"."shopping_list_item_meals" ("shopping_list_item_id", "menu_day_meal_id");

-- Прежний одиночный индекс избыточен: он leftmost-префикс нового составного.
drop index "public"."shopping_list_item_meals_shopping_list_item_id_idx";
