-- Одна позиция списка покупок на продукт в неделе: синхронизация из меню (см. CLAUDE.md §6,
-- поток "список покупок") идёт upsert'ом по (week_id, ingredient_id). Ручные позиции
-- (ingredient_id is null) под ограничение не попадают — NULL в unique-индексе не конфликтуют.
create unique index "shopping_list_items_week_id_ingredient_id_key"
    on "public"."shopping_list_items" ("week_id", "ingredient_id");

-- Прежний одиночный индекс по week_id избыточен: он leftmost-префикс нового составного.
drop index "public"."shopping_list_items_week_id_idx";
