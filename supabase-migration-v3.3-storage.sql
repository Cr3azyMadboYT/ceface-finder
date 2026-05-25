-- Allow authenticated users (business owners + admin) to manage offer images
-- Run in Supabase SQL editor.

-- Ensure bucket exists and is public for reads
insert into storage.buckets (id, name, public)
values ('offers-images', 'offers-images', true)
on conflict (id) do update set public = true;

-- Drop old admin-only policies if present
drop policy if exists "Admin can upload offer images" on storage.objects;
drop policy if exists "Admin can update offer images" on storage.objects;
drop policy if exists "Admin can delete offer images" on storage.objects;
drop policy if exists "Authenticated can upload offer images" on storage.objects;
drop policy if exists "Authenticated can update offer images" on storage.objects;
drop policy if exists "Authenticated can delete offer images" on storage.objects;

-- Any authenticated user can upload to offers-images
create policy "Authenticated can upload offer images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'offers-images');

create policy "Authenticated can update offer images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'offers-images')
  with check (bucket_id = 'offers-images');

create policy "Authenticated can delete offer images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'offers-images');
