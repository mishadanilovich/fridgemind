-- Soft-delete for recipes: preserves "eaten" history in past weeks instead of cascade-wiping
-- menu_day_meals on delete (см. CLAUDE.md §5, симметрично MealSlot.deleted_at). GitHub issue #5.
alter table "public"."recipes" add column "deleted_at" timestamp(3);
