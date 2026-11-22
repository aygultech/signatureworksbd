create extension if not exists pgcrypto;

create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  service text,
  budget text,
  message text,
  submitted_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  date text,
  time text,
  meeting_type text,
  notes text,
  status text not null default 'pending',
  submitted_at timestamptz not null default now()
);

create table if not exists portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  category text,
  location text,
  year text,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  description text,
  full_description text,
  highlights jsonb not null default '[]'::jsonb,
  client text,
  area text,
  duration text,
  budget text,
  team jsonb not null default '[]'::jsonb,
  before_image text,
  after_image text,
  video_url text,
  featured boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists portfolio_projects add column if not exists budget text;
alter table if exists portfolio_projects add column if not exists team jsonb not null default '[]'::jsonb;
alter table if exists portfolio_projects add column if not exists before_image text;
alter table if exists portfolio_projects add column if not exists after_image text;
alter table if exists portfolio_projects add column if not exists video_url text;

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  category text,
  cover_image text,
  content text,
  author text default 'Signature Works BD',
  published_at date default current_date,
  read_time text,
  tags jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table contact_submissions enable row level security;
alter table bookings enable row level security;
alter table portfolio_projects enable row level security;
alter table blog_posts enable row level security;
alter table site_settings enable row level security;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Anon key: insert-only for forms, read-only for public content.
-- Admin access goes through server API routes using the service_role key.
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


create index if not exists idx_contact_submissions_submitted_at on contact_submissions (submitted_at desc);
create index if not exists idx_bookings_submitted_at on bookings (submitted_at desc);
create index if not exists idx_portfolio_projects_order_index on portfolio_projects (order_index asc);
create index if not exists idx_blog_posts_published_at on blog_posts (published_at desc);

-- ============================================================
-- Admin Users System (Run after initial schema)
-- ============================================================

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  role text not null default 'admin' check (role in ('super_admin', 'admin')),
  permissions jsonb not null default '{"contacts":true,"bookings":true,"portfolio":false,"blog":false,"settings":false,"media":false,"users":false}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_password_resets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- These tables are accessed only via service_role key (server-side API routes)
-- No public policies — anon key cannot read/write these tables
alter table admin_users enable row level security;
alter table admin_password_resets enable row level security;

create index if not exists idx_admin_users_email on admin_users (email);
create index if not exists idx_admin_password_resets_token on admin_password_resets (token);
create index if not exists idx_admin_password_resets_email on admin_password_resets (email);

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
