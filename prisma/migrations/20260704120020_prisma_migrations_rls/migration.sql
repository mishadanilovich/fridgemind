-- Supabase exposes the entire public schema via PostgREST, which left Prisma's internal
-- migration-tracking table readable/writable by anyone with the anon key. It holds only
-- migration names/checksums/timestamps (no user data), but there's no reason for the API to
-- ever touch it — enable RLS with zero policies to deny all API access; Prisma CLI is
-- unaffected since it connects directly as the table-owning postgres role, which bypasses RLS.
alter table public._prisma_migrations enable row level security;
