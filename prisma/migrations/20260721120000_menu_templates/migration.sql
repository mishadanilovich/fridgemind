-- Шаблоны меню (см. CLAUDE.md §5, "Шаблоны меню"). Снимок спланированной недели, который можно
-- накатить на другую неделю. Не более 4 на household — лимит в server action, не в БД.

create table "public"."menu_templates" (
    "id" text not null,
    "household_id" text not null,
    "name" text not null,
    "created_at" timestamp(3) not null default current_timestamp,
    constraint "menu_templates_pkey" primary key ("id")
);

create index "menu_templates_household_id_idx" on "public"."menu_templates" ("household_id");

alter table "public"."menu_templates"
    add constraint "menu_templates_household_id_fkey"
    foreign key ("household_id") references "public"."households" ("id")
    on delete cascade on update cascade;

-- dayOfWeek — позиция дня в неделе (0 = понедельник … 6 = воскресенье), не дата.
create table "public"."menu_template_meals" (
    "id" text not null,
    "menu_template_id" text not null,
    "day_of_week" integer not null,
    "meal_slot_id" text not null,
    "recipe_id" text not null,
    "servings" integer not null,
    constraint "menu_template_meals_pkey" primary key ("id")
);

-- Имя обрезано до 63 символов ровно как это делает Prisma (Postgres усекает идентификаторы),
-- иначе будущий migrate diff увидит дрейф по имени индекса.
create unique index "menu_template_meals_menu_template_id_day_of_week_meal_slot__key"
    on "public"."menu_template_meals" ("menu_template_id", "day_of_week", "meal_slot_id");
create index "menu_template_meals_menu_template_id_idx" on "public"."menu_template_meals" ("menu_template_id");
create index "menu_template_meals_meal_slot_id_idx" on "public"."menu_template_meals" ("meal_slot_id");
create index "menu_template_meals_recipe_id_idx" on "public"."menu_template_meals" ("recipe_id");

alter table "public"."menu_template_meals"
    add constraint "menu_template_meals_menu_template_id_fkey"
    foreign key ("menu_template_id") references "public"."menu_templates" ("id")
    on delete cascade on update cascade;
alter table "public"."menu_template_meals"
    add constraint "menu_template_meals_meal_slot_id_fkey"
    foreign key ("meal_slot_id") references "public"."meal_slots" ("id")
    on delete cascade on update cascade;
alter table "public"."menu_template_meals"
    add constraint "menu_template_meals_recipe_id_fkey"
    foreign key ("recipe_id") references "public"."recipes" ("id")
    on delete cascade on update cascade;

-- ============================================================================
-- RLS — как у recipes/menu_*: чтение по household, запись только ORGANIZER/EDITOR
-- (см. CLAUDE.md §5, "Роли в household"). menu_template_meals — через join к menu_templates.
-- ============================================================================

alter table public.menu_templates enable row level security;

create policy "menu_templates_select_household" on public.menu_templates for select to authenticated
  using ( household_id = public.current_household_id() );

create policy "menu_templates_insert_organizer_editor" on public.menu_templates for insert to authenticated
  with check ( household_id = public.current_household_id() and public.current_household_role() in ('ORGANIZER','EDITOR') );

create policy "menu_templates_update_organizer_editor" on public.menu_templates for update to authenticated
  using ( household_id = public.current_household_id() and public.current_household_role() in ('ORGANIZER','EDITOR') )
  with check ( household_id = public.current_household_id() and public.current_household_role() in ('ORGANIZER','EDITOR') );

create policy "menu_templates_delete_organizer_editor" on public.menu_templates for delete to authenticated
  using ( household_id = public.current_household_id() and public.current_household_role() in ('ORGANIZER','EDITOR') );

alter table public.menu_template_meals enable row level security;

create policy "menu_template_meals_select_household" on public.menu_template_meals for select to authenticated
  using ( exists (
    select 1 from public.menu_templates t
    where t.id = menu_template_meals.menu_template_id and t.household_id = public.current_household_id()
  ) );

create policy "menu_template_meals_insert_organizer_editor" on public.menu_template_meals for insert to authenticated
  with check ( exists (
    select 1 from public.menu_templates t
    where t.id = menu_template_meals.menu_template_id and t.household_id = public.current_household_id()
      and public.current_household_role() in ('ORGANIZER','EDITOR')
  ) );

create policy "menu_template_meals_update_organizer_editor" on public.menu_template_meals for update to authenticated
  using ( exists (
    select 1 from public.menu_templates t
    where t.id = menu_template_meals.menu_template_id and t.household_id = public.current_household_id()
      and public.current_household_role() in ('ORGANIZER','EDITOR')
  ) )
  with check ( exists (
    select 1 from public.menu_templates t
    where t.id = menu_template_meals.menu_template_id and t.household_id = public.current_household_id()
      and public.current_household_role() in ('ORGANIZER','EDITOR')
  ) );

create policy "menu_template_meals_delete_organizer_editor" on public.menu_template_meals for delete to authenticated
  using ( exists (
    select 1 from public.menu_templates t
    where t.id = menu_template_meals.menu_template_id and t.household_id = public.current_household_id()
      and public.current_household_role() in ('ORGANIZER','EDITOR')
  ) );
