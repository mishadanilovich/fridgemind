-- Неделя и день меню создаются лениво — при первом назначении рецепта в слот (см. CLAUDE.md §6).
-- Уникальные ключи делают это upsert'ом: параллельные назначения в один день не создадут
-- двух MenuWeek на одну неделю household или двух MenuDay на одну дату.
create unique index "menu_weeks_household_id_week_start_date_key"
    on "public"."menu_weeks" ("household_id", "week_start_date");

create unique index "menu_days_menu_week_id_date_key"
    on "public"."menu_days" ("menu_week_id", "date");
