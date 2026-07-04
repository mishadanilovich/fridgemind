-- Supabase's default privileges grant EXECUTE on newly created public-schema functions
-- explicitly to anon/authenticated/service_role (not via the PUBLIC pseudo-role), so the
-- prior migration's `revoke ... from public` was a no-op for those roles — confirmed via
-- pg_proc.proacl still showing `anon=X/postgres` after that migration. Revoke explicitly.

revoke execute on function public.current_household_id() from anon;
revoke execute on function public.current_household_role() from anon;
revoke execute on function public.mark_meal_eaten(text, boolean) from anon;
revoke execute on function public.handle_new_user() from anon;
