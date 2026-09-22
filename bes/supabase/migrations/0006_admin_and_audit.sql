-- Şartname §72 — admin paneli için rol, denetim izi ve kampanyalar.

-- Denetim izi: kim, neyi, ne zaman değiştirdi. Silinemez (RLS'te delete yok).
create table if not exists public.audit_log (
  id            bigserial primary key,
  actor_id      uuid references auth.users(id) on delete set null,
  action        text not null,
  entity        text not null,
  entity_id     text,
  before        jsonb,
  after         jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id, created_at desc);

-- Push kampanyaları (§72). Gönderim Edge Function ile yapılır.
create table if not exists public.push_campaigns (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  deep_link     text,
  audience      jsonb not null default '{}'::jsonb,   -- {"locale":"tr","subscribed":false}
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Rol kontrolü için yardımcı. `security definer` çünkü RLS politikaları
-- içinde profiles tablosuna okuma gerekir; aksi hâlde özyineleme olur.
create or replace function public.has_role(required app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and case required
            when 'admin'     then p.role = 'admin'
            when 'editor'    then p.role in ('admin', 'editor')
            when 'moderator' then p.role in ('admin', 'editor', 'moderator')
            else true
          end
  );
$$;

revoke all on function public.has_role(app_role) from public;
grant execute on function public.has_role(app_role) to authenticated;
