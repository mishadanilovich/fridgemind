-- Слоты и рецепты в приложении только soft-delete'ятся (deleted_at), физически строка исчезает
-- лишь вместе с household. Дефолтный RESTRICT на этих внешних ключах делал удаление household
-- невозможным, если в меню было запланировано хоть одно блюдо: каскад доходил до recipes/meal_slots
-- и падал на menu_day_meals. Приём пищи без своего рецепта или слота смысла не имеет — CASCADE.
alter table "public"."menu_day_meals"
    drop constraint "menu_day_meals_recipe_id_fkey",
    add constraint "menu_day_meals_recipe_id_fkey" foreign key ("recipe_id")
        references "public"."recipes" ("id") on delete cascade on update cascade;

alter table "public"."menu_day_meals"
    drop constraint "menu_day_meals_meal_slot_id_fkey",
    add constraint "menu_day_meals_meal_slot_id_fkey" foreign key ("meal_slot_id")
        references "public"."meal_slots" ("id") on delete cascade on update cascade;
