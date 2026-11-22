-- ============================================================
-- Security lockdown (2026-11-22)
--
-- Before: the public anon key (shipped to every browser) could read, update and delete
-- contact submissions and bookings, fully manage portfolio/blog/settings, and upload or
-- delete storage files.
--
-- After: the anon key may only
--   * submit contact forms and bookings (insert only),
--   * read portfolio projects, published blog posts and site settings,
--   * read public media.
-- All admin work goes through server API routes that use the service_role key.
--
-- Safe to run more than once. Does not delete any content.
-- ============================================================

-- ---------- Drop the old permissive policies ----------
drop policy if exists "Public read contacts"        on contact_submissions;
drop policy if exists "Public delete contacts"      on contact_submissions;
drop policy if exists "Public read bookings"        on bookings;
drop policy if exists "Public update bookings"      on bookings;
drop policy if exists "Public delete bookings"      on bookings;
drop policy if exists "Public manage portfolio"     on portfolio_projects;
drop policy if exists "Public manage blog"          on blog_posts;
drop policy if exists "Public manage site settings" on site_settings;
drop policy if exists "Public upload site media"    on storage.objects;
drop policy if exists "Public update site media"    on storage.objects;
drop policy if exists "Public delete site media"    on storage.objects;

-- ---------- Public form submissions (insert only, with basic size limits) ----------
drop policy if exists "Public insert contacts" on contact_submissions;
create policy "Public insert contacts"
on contact_submissions for insert
to anon, authenticated
with check (
  length(name) between 1 and 200
  and length(phone) between 3 and 40
  and coalesce(length(email), 0) <= 200
  and coalesce(length(message), 0) <= 5000
);

drop policy if exists "Public insert bookings" on bookings;
create policy "Public insert bookings"
on bookings for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(name) between 1 and 200
  and length(phone) between 3 and 40
  and coalesce(length(email), 0) <= 200
  and coalesce(length(notes), 0) <= 5000
);

-- ---------- Public read-only content ----------
drop policy if exists "Public read portfolio" on portfolio_projects;
create policy "Public read portfolio"
on portfolio_projects for select
to anon, authenticated
using (true);

drop policy if exists "Public read published blog" on blog_posts;
create policy "Public read published blog"
on blog_posts for select
to anon, authenticated
using (published = true);

drop policy if exists "Public read site settings" on site_settings;
create policy "Public read site settings"
on site_settings for select
to anon, authenticated
using (true);

-- Public media stays readable (bucket is public). Writes now require a server-issued signed upload URL.
drop policy if exists "Public read site media" on storage.objects;
create policy "Public read site media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'site-media');

-- ---------- Password reset codes are now stored hashed; invalidate any plaintext ones ----------
delete from admin_password_resets;

-- ---------- Rate limiting for login / password reset ----------
create table if not exists admin_auth_attempts (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);
alter table admin_auth_attempts enable row level security;
-- No policies: only the service_role key (server) can touch this table.

create or replace function admin_auth_hit(p_key text, p_limit integer, p_window_seconds integer)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  rec admin_auth_attempts%rowtype;
begin
  insert into admin_auth_attempts as a (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
                  when a.window_start < now() - make_interval(secs => p_window_seconds) then 1
                  else a.count + 1
                end,
        window_start = case
                  when a.window_start < now() - make_interval(secs => p_window_seconds) then now()
                  else a.window_start
                end
  returning * into rec;

  allowed := rec.count <= p_limit;
  retry_after := greatest(0, ceil(extract(epoch from (rec.window_start + make_interval(secs => p_window_seconds) - now())))::integer);
  return next;
end;
$$;

revoke all on function admin_auth_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function admin_auth_hit(text, integer, integer) to service_role;

create index if not exists idx_admin_auth_attempts_window on admin_auth_attempts (window_start);
