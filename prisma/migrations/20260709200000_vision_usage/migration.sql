-- Счётчик вызовов Claude Vision в день на household — лимит VISION_DAILY_LIMIT защищает от
-- случайной накрутки счёта частым фотографированием (см. CLAUDE.md §7, пункт 4).
create table "public"."vision_usage" (
    "id" text not null,
    "household_id" text not null,
    "day" date not null,
    "count" integer not null default 0,
    constraint "vision_usage_pkey" primary key ("id"),
    constraint "vision_usage_household_id_fkey" foreign key ("household_id")
        references "public"."households" ("id") on delete cascade on update cascade
);

create unique index "vision_usage_household_id_day_key"
    on "public"."vision_usage" ("household_id", "day");

-- Таблица служебная: пишет её только сервер (Prisma). Через PostgREST доступ закрыт полностью —
-- RLS включён без политик, гранты у клиентских ролей отозваны.
alter table "public"."vision_usage" enable row level security;
revoke all on table "public"."vision_usage" from anon, authenticated;
