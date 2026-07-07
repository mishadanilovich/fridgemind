-- Close the self-privilege-escalation hole in the users_update_self policy.
--
-- The "users_update_self" RLS policy allows a user to UPDATE their own row (id = auth.uid()),
-- but RLS is row-level, not column-level: a MEMBER could call, via supabase-js/PostgREST,
--   supabase.from('users').update({ role: 'ORGANIZER' })  -- or { household_id: '<other>' }
-- and either grant themselves organizer rights or hijack another household.
--
-- A plain column REVOKE won't help here: the init migration already ran
--   grant select, insert, update, delete on all tables in schema public to authenticated;
-- and that table-level UPDATE privilege keeps every column writable regardless of any
-- column-level REVOKE. Reworking that into per-column grants would be fragile (must enumerate
-- every users column and re-list it on each schema change).
--
-- Instead, guard the two protected columns with a BEFORE UPDATE trigger. Triggers fire for the
-- table owner too (unlike RLS/grants, which owners bypass), so the guard is scoped to the
-- authenticated self-path only: auth.uid() is null on the Prisma/service-role connection
-- (no request JWT), so legitimate role/household changes done by server actions
-- (changeMemberRole, removeMember, leaveHousehold, acceptInvite via Prisma) are unaffected.

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and auth.uid()::text = new.id then
    if new.role is distinct from old.role
       or new.household_id is distinct from old.household_id then
      raise exception 'Нельзя изменить свою роль или household_id напрямую';
    end if;
  end if;
  return new;
end;
$$;

-- Returns `trigger`, so it can't be invoked via /rest/v1/rpc; revoke the default PUBLIC grant
-- anyway to keep it off the security advisor (same treatment as handle_new_user).
revoke execute on function public.prevent_self_role_escalation() from public;

create trigger prevent_self_role_escalation
  before update on public.users
  for each row execute function public.prevent_self_role_escalation();
