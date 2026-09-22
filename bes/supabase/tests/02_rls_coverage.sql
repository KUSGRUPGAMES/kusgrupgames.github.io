-- Kapsama kontrolü — şartname §71.
-- İki hata sınıfını yakalar:
--   1. `public` şemasında RLS'i kapalı kalmış tablo,
--   2. RLS'i açık ama hiç politikası olmayan tablo (kasıtlıysa listede yazılır).
\set ON_ERROR_STOP on

do $$
declare
  eksik text;
  -- Bilerek kimseye açılmayan tablolar: yalnız servis anahtarı erişir.
  kasitli text[] := array['rate_limits'];
begin
  select string_agg(c.relname, ', ')
    into eksik
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'
     and not c.relrowsecurity;
  if eksik is not null then
    raise exception 'RLS kapalı tablo(lar): %', eksik;
  end if;

  select string_agg(c.relname, ', ')
    into eksik
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relkind = 'r'
     and c.relrowsecurity
     and not (c.relname = any (kasitli))
     and not exists (select 1 from pg_policy p where p.polrelid = c.oid);
  if eksik is not null then
    raise exception 'RLS açık ama politikasız tablo(lar): %', eksik;
  end if;
end $$;

-- Servis anahtarı dışında kimsenin yazamayacağı tablolar gerçekten kapalı mı?
do $$
declare acik boolean;
begin
  select has_table_privilege('authenticated', 'public.rate_limits', 'select')
    into acik;
  assert not acik, 'rate_limits istemciye açık kalmış';
end $$;

select 'KAPSAMA KONTROLU GECTI' as sonuc;
