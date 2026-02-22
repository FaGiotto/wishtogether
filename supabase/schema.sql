-- =============================================================
-- WishTogether — Schema Supabase
-- Esegui questo file nell'SQL Editor di Supabase
-- =============================================================

-- Abilita UUID extension
create extension if not exists "pgcrypto";

-- =============================================================
-- TABELLE
-- =============================================================

-- Tabella users (estende auth.users di Supabase)
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text not null,
  avatar_url  text,
  partner_id  uuid references public.users(id) on delete set null,
  couple_id   text,               -- chiave condivisa della coppia, es. "uuid1_uuid2"
  invite_code text unique,        -- codice a 6 char per il collegamento
  push_token  text,               -- token Expo per le notifiche push
  created_at  timestamptz not null default now()
);

-- Tabella wishes
create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  couple_id   text not null,      -- corrisponde a users.couple_id
  category    text not null check (category in ('places','restaurants','movies','games','events')),
  title       text not null,
  description text,
  image_url   text,
  source_url  text,
  created_by  uuid not null references public.users(id) on delete cascade,
  is_done     boolean not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- Tabella comments
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  wish_id     uuid not null references public.wishes(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now()
);

-- Indici per performance
create index if not exists wishes_couple_id_idx   on public.wishes(couple_id);
create index if not exists wishes_is_done_idx     on public.wishes(is_done);
create index if not exists comments_wish_id_idx   on public.comments(wish_id);

-- =============================================================
-- FUNZIONE: link_couple
-- Collega due utenti come coppia in modo atomico
-- =============================================================
create or replace function public.link_couple(
  p_user_id    uuid,
  p_partner_id uuid,
  p_couple_id  text
) returns void
language plpgsql
security definer
as $$
begin
  -- Aggiorna entrambi gli utenti con il couple_id condiviso e partner_id incrociato
  update public.users
  set couple_id   = p_couple_id,
      partner_id  = p_partner_id,
      invite_code = null          -- invalida il codice dopo l'uso
  where id = p_user_id;

  update public.users
  set couple_id   = p_couple_id,
      partner_id  = p_user_id,
      invite_code = null
  where id = p_partner_id;
end;
$$;

-- =============================================================
-- TRIGGER: crea profilo utente al signup
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
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

-- Drop trigger se esiste già (idempotente)
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

-- Ogni utente può leggere solo il proprio profilo e quello del partner
create policy "users: leggi se sei tu o il partner"
  on public.users for select
  using (
    auth.uid() = id
    or auth.uid() = partner_id
    or id in (
      select partner_id from public.users where id = auth.uid()
    )
  );

-- Ogni utente può aggiornare solo il proprio profilo
create policy "users: aggiorna solo il tuo"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert gestito solo dal trigger (security definer), non serve policy insert pubblica
-- ma per sicurezza la blocchiamo
create policy "users: nessun insert diretto"
  on public.users for insert
  with check (false);

-- -----------------------------------------------------------
-- POLICIES: wishes
-- -----------------------------------------------------------

-- La coppia può leggere tutti i propri desideri
create policy "wishes: leggi se sei nella coppia"
  on public.wishes for select
  using (
    couple_id = (select couple_id from public.users where id = auth.uid())
  );

-- Qualunque membro della coppia può inserire desideri
create policy "wishes: inserisci se sei nella coppia"
  on public.wishes for insert
  with check (
    couple_id = (select couple_id from public.users where id = auth.uid())
    and created_by = auth.uid()
  );

-- Qualunque membro della coppia può aggiornare i desideri (es. segna come fatto)
create policy "wishes: aggiorna se sei nella coppia"
  on public.wishes for update
  using (
    couple_id = (select couple_id from public.users where id = auth.uid())
  )
  with check (
    couple_id = (select couple_id from public.users where id = auth.uid())
  );

-- Solo il creatore può cancellare il proprio desiderio
create policy "wishes: cancella solo i tuoi"
  on public.wishes for delete
  using (created_by = auth.uid());

-- -----------------------------------------------------------
-- POLICIES: comments
-- -----------------------------------------------------------

-- La coppia può leggere i commenti dei propri desideri
create policy "comments: leggi se sei nella coppia"
  on public.comments for select
  using (
    wish_id in (
      select id from public.wishes
      where couple_id = (select couple_id from public.users where id = auth.uid())
    )
  );

-- Qualunque membro della coppia può commentare
create policy "comments: inserisci se sei nella coppia"
  on public.comments for insert
  with check (
    user_id = auth.uid()
    and wish_id in (
      select id from public.wishes
      where couple_id = (select couple_id from public.users where id = auth.uid())
    )
  );

-- Solo l'autore può cancellare il proprio commento
create policy "comments: cancella solo i tuoi"
  on public.comments for delete
  using (user_id = auth.uid());

-- =============================================================
-- REALTIME: abilita per wishes e comments
-- =============================================================

-- Inserisci nella publication di realtime
alter publication supabase_realtime add table public.wishes;
alter publication supabase_realtime add table public.comments;
