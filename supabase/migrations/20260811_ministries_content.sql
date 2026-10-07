-- Ministries page content (2 sections x 2 blocks: sub-header, title, body, landscape image)
-- Same 4-column key/value schema as home_content.
create table if not exists public.ministries_content (
  id uuid primary key default gen_random_uuid(),
  key varchar not null unique,
  value text,
  updated_at timestamptz default now()
);

alter table public.ministries_content enable row level security;

-- Open read (public page reads with the anon key)
create policy "public read ministries_content"
  on public.ministries_content for select
  using (true);

-- Admin saves with the anon key (same as home_content in the app today)
create policy "public upload ministries_content"
  on public.ministries_content for insert
  to anon, authenticated
  with check (true);

create policy "public update ministries_content"
  on public.ministries_content for update
  to anon, authenticated
  using (true);

create policy "public delete ministries_content"
  on public.ministries_content for delete
  to anon, authenticated
  using (true);