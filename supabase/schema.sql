-- =============================================================
-- WishTogether — Schema Supabase
-- Esegui questo file nell'SQL Editor di Supabase
-- È idempotente: può essere rieseguito senza errori
-- =============================================================

-- Abilita UUID extension
create extension if not exists "pgcrypto";

-- =============================================================
-- TABELLE
-- =============================================================

create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text not null,
  avatar_url   text,
  partner_id   uuid references public.users(id) on delete set null,
  couple_id    text,
  invite_code  text unique,
  push_token   text,
  created_at   timestamptz not null default now()
);

create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  couple_id   text not null,
  category    text not null check (category in ('places','restaurants','movies','games','events','experiences')),
  title       text not null,
  description text,
  image_url   text,
  source_url  text,
  created_by  uuid not null references public.users(id) on delete cascade,
  is_done     boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  wish_id    uuid not null references public.wishes(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

-- Indici
create index if not exists wishes_couple_id_idx  on public.wishes(couple_id);
create index if not exists wishes_is_done_idx    on public.wishes(is_done);
create index if not exists comments_wish_id_idx  on public.comments(wish_id);

-- =============================================================
-- FUNZIONI
-- =============================================================

create or replace function public.link_couple(
  p_user_id    uuid,
  p_partner_id uuid,
  p_couple_id  text
) returns void language plpgsql security definer as $$
begin
  update public.users
  set couple_id = p_couple_id, partner_id = p_partner_id, invite_code = null
  where id = p_user_id;

  update public.users
  set couple_id = p_couple_id, partner_id = p_user_id, invite_code = null
  where id = p_partner_id;
end;
$$;

create or replace function public.unlink_couple(
  p_user_id uuid
) returns void language plpgsql security definer as $$
declare
  v_partner_id uuid;
begin
  select partner_id into v_partner_id from public.users where id = p_user_id;

  update public.users set couple_id = null, partner_id = null where id = p_user_id;

  if v_partner_id is not null then
    update public.users set couple_id = null, partner_id = null where id = v_partner_id;
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.users    enable row level security;
alter table public.wishes   enable row level security;
alter table public.comments enable row level security;

-- -----------------------------------------------------------
-- POLICIES: users
-- -----------------------------------------------------------

drop policy if exists "users: leggi se sei tu o il partner"  on public.users;
drop policy if exists "users: cerca per invite_code"         on public.users;
drop policy if exists "users: aggiorna solo il tuo"          on public.users;
drop policy if exists "users: nessun insert diretto"         on public.users;

create policy "users: leggi se sei tu o il partner"
  on public.users for select
  using (
    auth.uid() = id
    or auth.uid() = partner_id
  );

create policy "users: cerca per invite_code"
  on public.users for select
  using (invite_code is not null);

create policy "users: aggiorna solo il tuo"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users: nessun insert diretto"
  on public.users for insert
  with check (false);

-- -----------------------------------------------------------
-- POLICIES: wishes
-- -----------------------------------------------------------

drop policy if exists "wishes: leggi se sei nella coppia"    on public.wishes;
drop policy if exists "wishes: inserisci se sei nella coppia" on public.wishes;
drop policy if exists "wishes: aggiorna se sei nella coppia" on public.wishes;
drop policy if exists "wishes: cancella solo i tuoi"         on public.wishes;

create policy "wishes: leggi se sei nella coppia"
  on public.wishes for select
  using (couple_id = (select couple_id from public.users where id = auth.uid()));

create policy "wishes: inserisci se sei nella coppia"
  on public.wishes for insert
  with check (
    couple_id = (select couple_id from public.users where id = auth.uid())
    and created_by = auth.uid()
  );

create policy "wishes: aggiorna se sei nella coppia"
  on public.wishes for update
  using (couple_id = (select couple_id from public.users where id = auth.uid()))
  with check (couple_id = (select couple_id from public.users where id = auth.uid()));

create policy "wishes: cancella solo i tuoi"
  on public.wishes for delete
  using (created_by = auth.uid());

-- -----------------------------------------------------------
-- POLICIES: comments
-- -----------------------------------------------------------

drop policy if exists "comments: leggi se sei nella coppia"    on public.comments;
drop policy if exists "comments: inserisci se sei nella coppia" on public.comments;
drop policy if exists "comments: cancella solo i tuoi"          on public.comments;

create policy "comments: leggi se sei nella coppia"
  on public.comments for select
  using (
    wish_id in (
      select id from public.wishes
      where couple_id = (select couple_id from public.users where id = auth.uid())
    )
  );

create policy "comments: inserisci se sei nella coppia"
  on public.comments for insert
  with check (
    user_id = auth.uid()
    and wish_id in (
      select id from public.wishes
      where couple_id = (select couple_id from public.users where id = auth.uid())
    )
  );

create policy "comments: cancella solo i tuoi"
  on public.comments for delete
  using (user_id = auth.uid());

-- =============================================================
-- REALTIME
-- =============================================================

do $$
begin
  alter publication supabase_realtime add table public.users;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.wishes;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when others then null;
end $$;
