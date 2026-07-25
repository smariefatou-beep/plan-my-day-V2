-- Content OS / Plan the Day — cloud sync setup
-- À coller dans Supabase : Project > SQL Editor > New query > Run

create table if not exists kv_store (
  user_id uuid references auth.users(id) on delete cascade not null,
  key text not null,
  value jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

alter table kv_store enable row level security;

create policy "Users manage their own data"
  on kv_store
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
