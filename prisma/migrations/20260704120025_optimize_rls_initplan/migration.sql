-- Performance advisor flagged 3 policies on public.users calling auth.uid() inline, which
-- Postgres re-evaluates per row. Wrapping in (select auth.uid()) lets the planner evaluate it
-- once per statement instead — same security semantics, cheaper at scale. Recreate the 3
-- affected policies (Postgres has no ALTER POLICY for the expression, only drop+recreate).

drop policy "users_update_self" on public.users;
create policy "users_update_self" on public.users for update to authenticated
  using ( id = (select auth.uid())::text )
  with check ( id = (select auth.uid())::text );

drop policy "users_delete_self" on public.users;
create policy "users_delete_self" on public.users for delete to authenticated
  using ( id = (select auth.uid())::text );

drop policy "users_delete_by_organizer" on public.users;
create policy "users_delete_by_organizer" on public.users for delete to authenticated
  using ( household_id = public.current_household_id() and public.current_household_role() = 'ORGANIZER' and id <> (select auth.uid())::text );
