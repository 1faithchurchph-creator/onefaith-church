-- Give page content (hero text, QR image URL, 3 "why your giving matters" cards).
-- Same 4-column key/value schema as home_content / ministries_content.
create table if not exists public.give_content (
  id uuid primary key default gen_random_uuid(),
  key varchar not null unique,
  value text,
  updated_at timestamptz default now()
);

alter table public.give_content enable row level security;

-- Open read (public page reads with the anon key)
create policy "public read give_content"
  on public.give_content for select
  using (true);

-- Admin saves with the anon key (same as home_content / ministries_content in the app today)
create policy "public upload give_content"
  on public.give_content for insert
  to anon, authenticated
  with check (true);

create policy "public update give_content"
  on public.give_content for update
  to anon, authenticated
  using (true);

create policy "public delete give_content"
  on public.give_content for delete
  to anon, authenticated
  using (true);
