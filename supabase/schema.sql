-- eightyhundred.ai schema v3 (5 Sep 2026) - post security audit + architect review
-- Apply on a fresh Supabase project via the SQL editor or Management API. Idempotent where practical.

-- ---------- enums ----------
do $$ begin
  create type public.project_status as enum ('daycare','claimed','finished','reclaimed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_type as enum
    ('app','saas','novel','podcast','shed','board_game','napkin','home_gym','second_brain','other');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{2,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text check (
    avatar_url is null
    or avatar_url ~ '^https://(avatars\.githubusercontent\.com|[a-z0-9.-]+\.googleusercontent\.com)/'
  ),
  created_at timestamptz not null default now()
);

-- profile bootstrap on signup (runs as owner; never trust raw_user_meta_data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  dname text;
  av text;
  n int := 0;
begin
  -- handle: provider username if present, otherwise an anonymous punter id (never the email local part)
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'user_name',
                                        new.raw_user_meta_data->>'preferred_username', ''),
                               '[^a-z0-9_]', '', 'g'));
  if char_length(base) < 2 then base := 'punter_' || substr(md5(random()::text), 1, 6); end if;
  base := left(base, 18);

  dname := nullif(trim(regexp_replace(coalesce(new.raw_user_meta_data->>'full_name',
                                               new.raw_user_meta_data->>'name', ''),
                                      '[[:cntrl:]]', '', 'g')), '');
  dname := left(coalesce(dname, base), 40);

  av := new.raw_user_meta_data->>'avatar_url';
  if av !~ '^https://(avatars\.githubusercontent\.com|[a-z0-9.-]+\.googleusercontent\.com)/' then av := null; end if;

  candidate := base;
  loop
    begin
      insert into public.profiles (id, handle, display_name, avatar_url)
      values (new.id, candidate, dname, av);
      exit;
    exception when unique_violation then
      n := n + 1;
      if n > 20 then
        candidate := 'punter_' || substr(md5(random()::text || n::text), 1, 8);
      else
        candidate := base || '_' || n::text;
      end if;
    end;
  end loop;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- projects ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  type public.project_type not null,
  pct int not null check (pct between 0 and 80),
  distraction text not null check (char_length(distraction) between 1 and 80),
  since_date date not null check (since_date <= current_date + 1),  -- +1: Irish evenings are tomorrow in UTC
  status public.project_status not null default 'daycare',
  lad_id uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  finished_at timestamptz,
  proof_url text check (proof_url is null or (proof_url ~ '^https?://' and char_length(proof_url) <= 500)),
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now(),
  constraint lad_not_owner check (lad_id is null or lad_id <> owner_id),
  -- finished rows keep their proof even if the lad later deletes their account (lad_id becomes null)
  constraint status_consistency check (
    (status = 'daycare'   and lad_id is null     and claimed_at is null     and finished_at is null) or
    (status = 'claimed'   and lad_id is not null and claimed_at is not null and finished_at is null) or
    (status = 'finished'  and claimed_at is not null and finished_at is not null) or
    (status = 'reclaimed' and finished_at is null)
  )
);
create index if not exists projects_status_idx on public.projects (status, created_at desc);
create index if not exists projects_owner_idx on public.projects (owner_id);
create index if not exists projects_lad_idx on public.projects (lad_id);

-- drop-off rate limit: 10 per owner per UTC day. Server sets id/created_at; per-owner advisory lock closes the race.
create or replace function public.limit_dropoffs()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.id := gen_random_uuid();
  new.created_at := now();
  perform pg_advisory_xact_lock(hashtext('dropoff:' || new.owner_id::text));
  if (select count(*) from public.projects
      where owner_id = new.owner_id and created_at >= date_trunc('day', now())) >= 10 then
    raise exception 'Ten drop-offs today. Go and finish one.' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists projects_limit_dropoffs on public.projects;
create trigger projects_limit_dropoffs
  before insert on public.projects
  for each row execute function public.limit_dropoffs();

-- ---------- releases log (a lad gave a claim back, or sat on it too long) ----------
create table if not exists public.releases (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  lad_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'released' check (reason in ('released','stale')),
  created_at timestamptz not null default now()
);

-- ---------- nopes ----------
create table if not exists public.nopes (
  project_id uuid not null references public.projects(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, voter_id)
);

create or replace function public.no_self_nope()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := now();
  if exists (select 1 from public.projects where id = new.project_id and owner_id = new.voter_id) then
    raise exception 'You cannot nope your own project. Everyone else already has.' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists nopes_no_self on public.nopes;
create trigger nopes_no_self
  before insert on public.nopes
  for each row execute function public.no_self_nope();

-- ---------- profile deletion: hand open claims back to daycare first ----------
create or replace function public.release_claims_before_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.projects set status = 'daycare', lad_id = null, claimed_at = null
   where lad_id = old.id and status = 'claimed';
  return old;
end $$;

drop trigger if exists profiles_before_delete on public.profiles;
create trigger profiles_before_delete
  before delete on public.profiles
  for each row execute function public.release_claims_before_profile_delete();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.nopes    enable row level security;
alter table public.releases enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select using (true);

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own on public.projects for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and status = 'daycare'
    and lad_id is null and claimed_at is null and finished_at is null and proof_url is null and note is null
  );

drop policy if exists projects_delete_own_daycare on public.projects;
create policy projects_delete_own_daycare on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()) and status = 'daycare');

-- no UPDATE policy on projects: every transition goes through the RPCs below

drop policy if exists nopes_read on public.nopes;
create policy nopes_read on public.nopes for select using (true);

drop policy if exists nopes_insert_own on public.nopes;
create policy nopes_insert_own on public.nopes for insert to authenticated
  with check (voter_id = (select auth.uid()));

drop policy if exists nopes_delete_own on public.nopes;
create policy nopes_delete_own on public.nopes for delete to authenticated
  using (voter_id = (select auth.uid()));

drop policy if exists releases_read on public.releases;
create policy releases_read on public.releases for select using (true);

-- ---------- privileges: defence in depth under RLS ----------
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
revoke update, truncate, references, trigger on public.projects, public.nopes, public.releases from authenticated;
revoke insert, delete on public.releases, public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (handle, display_name, avatar_url) on public.profiles to authenticated;
alter default privileges for role postgres in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;

-- ---------- RPCs (state transitions) ----------
create or replace function public.claim_project(p_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  p public.projects;
begin
  if me is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into p from public.projects where id = p_id for update;
  if not found then raise exception 'No such project.' using errcode = 'P0002'; end if;
  if p.owner_id = me then raise exception 'You cannot claim your own project. That is called finishing it.' using errcode = 'P0001'; end if;
  if p.status <> 'daycare' then raise exception 'Not in daycare.' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('claims:' || me::text));
  if (select count(*) from public.projects where lad_id = me and status = 'claimed') >= 3 then
    raise exception 'Three open claims already. Finish one. Lads finish things.' using errcode = 'P0001';
  end if;
  update public.projects
     set status = 'claimed', lad_id = me, claimed_at = now()
   where id = p_id
   returning * into p;
  return p;
end $$;

create or replace function public.finish_project(p_id uuid, p_proof_url text, p_note text default null)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  p public.projects;
begin
  if me is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into p from public.projects where id = p_id for update;
  if not found then raise exception 'No such project.' using errcode = 'P0002'; end if;
  if p.status <> 'claimed' or p.lad_id <> me then raise exception 'Not your claim.' using errcode = '42501'; end if;
  if p_proof_url is null or p_proof_url !~ '^https?://' then
    raise exception 'Proof must be a link. Shipped, published, standing, or in a customer''s hands.' using errcode = 'P0001';
  end if;
  update public.projects
     set status = 'finished', finished_at = now(),
         proof_url = left(p_proof_url, 500),
         note = nullif(left(regexp_replace(coalesce(p_note, ''), '[[:cntrl:]]', '', 'g'), 280), '')
   where id = p_id
   returning * into p;
  return p;
end $$;

create or replace function public.release_project(p_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  p public.projects;
begin
  if me is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into p from public.projects where id = p_id for update;
  if not found then raise exception 'No such project.' using errcode = 'P0002'; end if;
  if p.status <> 'claimed' or p.lad_id <> me then raise exception 'Not your claim.' using errcode = '42501'; end if;
  insert into public.releases (project_id, lad_id, reason) values (p_id, me, 'released');
  update public.projects
     set status = 'daycare', lad_id = null, claimed_at = null
   where id = p_id
   returning * into p;
  return p;
end $$;

-- owner takes it back: shame points
create or replace function public.reclaim_project(p_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  p public.projects;
begin
  if me is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into p from public.projects where id = p_id for update;
  if not found then raise exception 'No such project.' using errcode = 'P0002'; end if;
  if p.owner_id <> me then raise exception 'Not yours.' using errcode = '42501'; end if;
  if p.status not in ('daycare','claimed') then raise exception 'Too late. It is finished. Leave it.' using errcode = 'P0001'; end if;
  update public.projects
     set status = 'reclaimed', lad_id = null, claimed_at = null
   where id = p_id
   returning * into p;
  return p;
end $$;

-- owner frees a claim the lad has sat on for 14+ days: no shame, the lad eats the release
create or replace function public.unclaim_stale(p_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  p public.projects;
begin
  if me is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  select * into p from public.projects where id = p_id for update;
  if not found then raise exception 'No such project.' using errcode = 'P0002'; end if;
  if p.owner_id <> me then raise exception 'Not yours.' using errcode = '42501'; end if;
  if p.status <> 'claimed' then raise exception 'Nobody has claimed it.' using errcode = 'P0001'; end if;
  if p.claimed_at > now() - interval '14 days' then
    raise exception 'Give the lad 14 days. Tinkering by omission takes time.' using errcode = 'P0001';
  end if;
  insert into public.releases (project_id, lad_id, reason) values (p_id, p.lad_id, 'stale');
  update public.projects
     set status = 'daycare', lad_id = null, claimed_at = null
   where id = p_id
   returning * into p;
  return p;
end $$;

revoke all on function public.claim_project(uuid) from public, anon;
revoke all on function public.finish_project(uuid, text, text) from public, anon;
revoke all on function public.release_project(uuid) from public, anon;
revoke all on function public.reclaim_project(uuid) from public, anon;
revoke all on function public.unclaim_stale(uuid) from public, anon;
grant execute on function public.claim_project(uuid) to authenticated;
grant execute on function public.finish_project(uuid, text, text) to authenticated;
grant execute on function public.release_project(uuid) to authenticated;
grant execute on function public.reclaim_project(uuid) to authenticated;
grant execute on function public.unclaim_stale(uuid) to authenticated;

-- trigger functions are not RPC-callable, but keep them out of anon's reach regardless
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.limit_dropoffs() from public, anon;
revoke all on function public.no_self_nope() from public, anon;
revoke all on function public.release_claims_before_profile_delete() from public, anon, authenticated;

-- ---------- views (security_invoker: the caller's RLS applies) ----------
create or replace view public.leaderboard_bastards
with (security_invoker = true) as
with nopes_by_owner as (
  select px.owner_id, count(*) as n
  from public.nopes np join public.projects px on px.id = np.project_id
  group by px.owner_id
)
select
  pr.id as profile_id,
  pr.handle,
  pr.display_name,
  pr.avatar_url,
  count(p.id)                                                    as dropped_off,
  count(p.id) filter (where p.status = 'reclaimed')              as reclaimed,
  coalesce(max(coalesce(p.finished_at::date, current_date) - p.since_date), 0) as longest_days_at_80,
  coalesce(sum(coalesce(p.finished_at::date, current_date) - p.since_date), 0) as total_days_at_80,
  coalesce(nb.n, 0)                                              as nopes_received,
  (count(p.id) * 10
    + count(p.id) filter (where p.status = 'reclaimed') * 30
    + coalesce(nb.n, 0) * 5
    + floor(coalesce(sum(coalesce(p.finished_at::date, current_date) - p.since_date), 0) / 30.0))::int as bastard_points
from public.profiles pr
join public.projects p on p.owner_id = pr.id
left join nopes_by_owner nb on nb.owner_id = pr.id
group by pr.id, nb.n
order by bastard_points desc, dropped_off desc;

create or replace view public.leaderboard_lads
with (security_invoker = true) as
with rel as (
  select lad_id, count(*) as n from public.releases group by lad_id
)
select
  pr.id as profile_id,
  pr.handle,
  pr.display_name,
  pr.avatar_url,
  count(p.id) filter (where p.status = 'finished')               as finished,
  count(p.id) filter (where p.status = 'claimed')                as open_claims,
  coalesce(r.n, 0)                                               as released,
  round(avg(extract(epoch from (p.finished_at - p.claimed_at)) / 3600.0) filter (where p.status = 'finished'))::int as avg_hours_to_finish,
  (count(p.id) filter (where p.status = 'finished') * 100 - coalesce(r.n, 0) * 20)::int as lad_points
from public.profiles pr
join public.projects p on p.lad_id = pr.id
left join rel r on r.lad_id = pr.id
group by pr.id, r.n
order by lad_points desc, finished desc;

create or replace view public.stats
with (security_invoker = true) as
select
  count(*)                                                as dropped_off,
  count(*) filter (where status = 'finished')             as finished,
  count(*) filter (where status in ('daycare','claimed')) as in_daycare,
  count(*) filter (where status = 'reclaimed')            as reclaimed,
  coalesce(round(avg(coalesce(finished_at::date, current_date) - since_date) / 30.0, 1), 0) as avg_months_at_80
from public.projects;

grant select on public.leaderboard_bastards, public.leaderboard_lads, public.stats to anon, authenticated;
