-- Избранное у рецептов (см. CLAUDE.md §5, "Избранное для рецептов"). Флаг общий на household,
-- как и вся остальная модель данных, — не персональный у каждого участника, поэтому это колонка
-- на recipes, а не отдельная таблица связей с users.
alter table "public"."recipes"
    add column "is_favorite" boolean not null default false;

-- Новых RLS-политик не нужно: переключение идёт обычным UPDATE, уже покрытым
-- recipes_update_organizer_editor (Участник изменить флаг не может).
