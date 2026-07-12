-- Составные уникальные индексы из 20260711120000 начинаются с тех же колонок, что и одиночные
-- индексы из init, и покрывают те же запросы своим leftmost-префиксом — дублирующие индексы
-- только замедляют запись.
drop index "public"."menu_weeks_household_id_idx";
drop index "public"."menu_days_menu_week_id_idx";
