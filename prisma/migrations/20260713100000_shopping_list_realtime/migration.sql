-- Realtime для общего списка покупок (см. CLAUDE.md §6, поток "общий список покупок в
-- реальном времени"): таблица добавляется в публикацию supabase_realtime, чтобы клиенты
-- household получали postgres_changes по вебсокету. Авторизация событий INSERT/UPDATE идёт
-- через существующую RLS-политику shopping_list_items_all_household (select по household);
-- DELETE-события RLS не фильтрует, но при replica identity по умолчанию (PK) их payload —
-- только id, ничего содержательного наружу не утекает.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'shopping_list_items'
     )
  then
    alter publication supabase_realtime add table public.shopping_list_items;
  end if;
end $$;
