-- Yerel doğrulama için Supabase'in `auth` şemasının küçük bir taklidi.
-- Üretimde bu şemayı Supabase kurar; burada yalnız migration'ların
-- sözdizimini ve kısıtlarını sınamak için vardır. Üretime gönderilmez.
create schema if not exists auth;

create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique,
  raw_user_meta_data  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- Oturumdaki kullanıcı kimliği. Testte `set local request.jwt.claim.sub` ile verilir.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- Supabase'in rol adları.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
