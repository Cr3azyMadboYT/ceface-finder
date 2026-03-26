-- =============================================
-- CeFaci - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor
-- =============================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  role text default 'user' check (role in ('admin', 'user')),
  language text default 'ro' check (language in ('ro', 'en')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 2. OFFERS TABLE
create table if not exists public.offers (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text,
  city text,
  area text,
  location text,
  location_url text,
  date date,
  time text,
  image_url text,
  contact_link text,
  phone text,
  is_active boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.offers enable row level security;

-- Admin check function
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

-- Users can read active offers
create policy "Anyone can read active offers" on public.offers
  for select using (is_active = true);

-- Admin can do everything with offers
create policy "Admin can read all offers" on public.offers
  for select using (public.is_admin(auth.uid()));

create policy "Admin can insert offers" on public.offers
  for insert with check (public.is_admin(auth.uid()));

create policy "Admin can update offers" on public.offers
  for update using (public.is_admin(auth.uid()));

create policy "Admin can delete offers" on public.offers
  for delete using (public.is_admin(auth.uid()));

-- 3. FAVORITES TABLE
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  offer_id uuid references public.offers(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, offer_id)
);

alter table public.favorites enable row level security;

create policy "Users can read own favorites" on public.favorites
  for select using (auth.uid() = user_id);

create policy "Users can insert own favorites" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own favorites" on public.favorites
  for delete using (auth.uid() = user_id);

-- 4. AUTO PROFILE CREATION ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, language)
  values (
    new.id,
    new.email,
    case when new.email = 'cornelboss915@gmail.com' then 'admin' else 'user' end,
    'ro'
  );
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('offers-images', 'offers-images', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Anyone can view offer images" on storage.objects
  for select using (bucket_id = 'offers-images');

create policy "Admin can upload offer images" on storage.objects
  for insert with check (
    bucket_id = 'offers-images'
    and public.is_admin(auth.uid())
  );

create policy "Admin can update offer images" on storage.objects
  for update using (
    bucket_id = 'offers-images'
    and public.is_admin(auth.uid())
  );

create policy "Admin can delete offer images" on storage.objects
  for delete using (
    bucket_id = 'offers-images'
    and public.is_admin(auth.uid())
  );
