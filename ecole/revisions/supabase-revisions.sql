-- Révisions à deux — planning partagé (École OS)
-- À coller dans Supabase : Project > SQL Editor > New query > Run (une seule fois).
-- Ne touche pas à kv_store : le reste de Plan My Life / École OS reste privé.

-- Le planning commun (matières, tâches, dates, routine maths de 20 h).
create table if not exists rev_plans (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  invite_code text unique not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- Qui fait partie du planning (toi + ta copine).
create table if not exists rev_members (
  plan_id uuid not null references rev_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  joined_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

-- La progression de chacune (ce qui est coché, les petits mots). Lisible par les membres,
-- modifiable seulement par sa propriétaire.
create table if not exists rev_progress (
  plan_id uuid not null references rev_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create or replace function is_rev_member(p uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from rev_members where plan_id = p and user_id = auth.uid());
$$;

alter table rev_plans enable row level security;
alter table rev_members enable row level security;
alter table rev_progress enable row level security;

drop policy if exists "members read plan" on rev_plans;
drop policy if exists "members edit plan" on rev_plans;
drop policy if exists "owner deletes plan" on rev_plans;
create policy "members read plan" on rev_plans for select using (is_rev_member(id));
create policy "members edit plan" on rev_plans for update using (is_rev_member(id)) with check (is_rev_member(id));
create policy "owner deletes plan" on rev_plans for delete using (owner = auth.uid());

drop policy if exists "members see members" on rev_members;
drop policy if exists "rename myself" on rev_members;
drop policy if exists "leave plan" on rev_members;
create policy "members see members" on rev_members for select using (is_rev_member(plan_id));
create policy "rename myself" on rev_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "leave plan" on rev_members for delete using (user_id = auth.uid());

drop policy if exists "members read progress" on rev_progress;
drop policy if exists "write my progress" on rev_progress;
drop policy if exists "update my progress" on rev_progress;
create policy "members read progress" on rev_progress for select using (is_rev_member(plan_id));
create policy "write my progress" on rev_progress for insert with check (user_id = auth.uid() and is_rev_member(plan_id));
create policy "update my progress" on rev_progress for update using (user_id = auth.uid()) with check (user_id = auth.uid() and is_rev_member(plan_id));

-- Créer un planning (tu en deviens membre) — renvoie son id et son code d'invitation.
create or replace function create_rev_plan(plan_data jsonb, display_name text)
returns table (id uuid, invite_code text)
language plpgsql security definer set search_path = public as $$
declare pid uuid; code text;
begin
  if auth.uid() is null then raise exception 'non connectée'; end if;
  loop
    code := upper(substr(translate(md5(random()::text || clock_timestamp()::text), '01', ''), 1, 6));
    exit when length(code) = 6 and not exists (select 1 from rev_plans p where p.invite_code = code);
  end loop;
  insert into rev_plans (owner, invite_code, data, updated_by) values (auth.uid(), code, plan_data, auth.uid()) returning rev_plans.id into pid;
  insert into rev_members (plan_id, user_id, name) values (pid, auth.uid(), coalesce(display_name, ''));
  return query select pid, code;
end; $$;

-- Rejoindre un planning avec son code (lien d'invitation).
create or replace function join_rev_plan(code text, display_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if auth.uid() is null then raise exception 'non connectée'; end if;
  select p.id into pid from rev_plans p where p.invite_code = upper(trim(code));
  if pid is null then raise exception 'code inconnu'; end if;
  insert into rev_members (plan_id, user_id, name) values (pid, auth.uid(), coalesce(display_name, ''))
    on conflict (plan_id, user_id) do update set name = excluded.name;
  return pid;
end; $$;

grant execute on function create_rev_plan(jsonb, text) to authenticated;
grant execute on function join_rev_plan(text, text) to authenticated;
grant execute on function is_rev_member(uuid) to authenticated;

-- Fait connaître les nouvelles tables à l'API tout de suite.
notify pgrst, 'reload schema';
