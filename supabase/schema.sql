-- ============================================================
--  Chạy toàn bộ file này 1 lần trong Supabase → SQL Editor → Run
--  ⚠ Đổi 'YOUR_EMAIL@example.com' (2 chỗ ở cuối) thành email bạn dùng để đăng nhập
-- ============================================================

create table if not exists public.site_profile (
  id         int primary key default 1 check (id = 1),   -- chỉ có đúng 1 dòng
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id          text primary key,
  name        text not null,
  description text not null default '',
  url         text not null default '',
  repo        text,
  tags        text[] not null default '{}',
  status      text not null default 'live' check (status in ('live','building','paused','archived')),
  pinned      boolean not null default false,
  updated     text,
  updated_at  timestamptz not null default now()
);

alter table public.site_profile enable row level security;
alter table public.projects     enable row level security;

-- Ai cũng ĐỌC được (trang công khai)
drop policy if exists "public read profile"  on public.site_profile;
drop policy if exists "public read projects" on public.projects;
create policy "public read profile"  on public.site_profile for select using (true);
create policy "public read projects" on public.projects     for select using (true);

-- Chỉ quản trị viên được GHI (thêm / sửa / xoá). Quản trị viên nằm trong bảng site_admins.
create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.site_admins enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.site_admins where user_id = auth.uid())
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

drop policy if exists "owner write profile"  on public.site_profile;
drop policy if exists "owner write projects" on public.projects;
create policy "owner write profile"  on public.site_profile for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());
create policy "owner write projects" on public.projects for all to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());
