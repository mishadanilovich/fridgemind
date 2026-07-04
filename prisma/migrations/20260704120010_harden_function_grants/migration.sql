-- Postgres grants EXECUTE to PUBLIC by default when a function is created, which left our
-- SECURITY DEFINER helpers/RPCs callable by the anon (unauthenticated) role via PostgREST
-- (/rest/v1/rpc/...), flagged by Supabase's security advisor. Tighten to intended callers.

revoke execute on function public.current_household_id() from public;
grant execute on function public.current_household_id() to authenticated;

revoke execute on function public.current_household_role() from public;
grant execute on function public.current_household_role() to authenticated;

revoke execute on function public.mark_meal_eaten(text, boolean) from public;
grant execute on function public.mark_meal_eaten(text, boolean) to authenticated;

-- handle_new_user is a trigger function only (returns `trigger`); Postgres already refuses to
-- invoke it via a direct call outside a trigger context regardless of grants, but revoke the
-- default PUBLIC grant anyway so it doesn't even appear callable via /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from authenticated;
