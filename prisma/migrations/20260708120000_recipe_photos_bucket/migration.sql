-- Public bucket for recipe cover/step photos.
-- Writes go through server actions using the service role (which bypasses RLS), so no
-- storage.objects write policies are needed. Public read is fine: photos are shown via <img>
-- and contain nothing sensitive. Files are namespaced by household in their path.

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;
