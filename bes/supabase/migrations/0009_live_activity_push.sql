-- BEŞ — Dinamik Ada / kilit ekranı canlı etkinliğini push ile ilerletme (2 Ekim).
-- 0008'den SONRA; tekrar çalıştırılabilir.
--
-- Canlı etkinlik kendi kendine sıradaki vakte geçemiyor (cihazda: öğleden
-- 39 dk sonra hâlâ "Öğle 0:00"), ve iOS onu en çok 8 saat açık tutuyor.
-- Uygulama (yerel kod) cihaz başına: etkinliğin push jetonunu, "push ile
-- başlat" jetonunu (iOS 17.2+) ve önümüzdeki vakitleri (yalnız ad + saat,
-- konum YOK) buraya yazar. Zamanlanmış görev her vakit girdiğinde etkinliği
-- push ile sıradakine geçirir, 8 saate yaklaşınca yenisini başlatır.
-- Hesap gerekmez (anon). Okuma kimseye açık değil; yazma yalnız işlevlerle.

drop table if exists public.live_activity_push;
create table public.live_activity_push (
  device text primary key check (device ~ '^[0-9a-f-]{36}$'),
  topic text not null check (topic in ('com.kusgrupgames.bes', 'com.kusgrupgames.bes.dev')),
  env text not null check (env in ('production', 'sandbox')),
  activity_token text check (activity_token ~ '^[0-9a-f]+$' and char_length(activity_token) between 32 and 512),
  start_token text check (start_token ~ '^[0-9a-f]+$' and char_length(start_token) between 32 and 512),
  city text check (char_length(city) <= 80),
  title text check (char_length(title) <= 40),
  slots jsonb,
  next_at timestamptz,
  started_at timestamptz,
  updated_at timestamptz not null default now()
);
create index live_activity_push_next_idx on public.live_activity_push (next_at);
alter table public.live_activity_push enable row level security;
revoke all on public.live_activity_push from anon, authenticated;

drop function if exists public.register_live_activity(text, text, text, text, text, jsonb);
drop function if exists public.unregister_live_activity(text);

-- slots: [{"n":"İkindi","t":<unix sn>,"hm":"16:09"}, ...] — en çok 12 vakit.
create or replace function public.register_live_activity(
  p_device text, p_token text, p_topic text, p_env text, p_city text, p_title text, p_slots jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare ilk timestamptz; eski text;
begin
  if jsonb_typeof(p_slots) <> 'array' or jsonb_array_length(p_slots) = 0 or jsonb_array_length(p_slots) > 12 then
    raise exception 'geçersiz vakit listesi' using errcode = '22023';
  end if;
  select min(to_timestamp((e->>'t')::double precision)) into ilk
    from jsonb_array_elements(p_slots) e where to_timestamp((e->>'t')::double precision) > now();
  select activity_token into eski from public.live_activity_push where device = lower(p_device);
  insert into public.live_activity_push (device, topic, env, activity_token, city, title, slots, next_at, started_at, updated_at)
    values (lower(p_device), p_topic, p_env, lower(p_token), p_city, p_title, p_slots, ilk, now(), now())
    on conflict (device) do update set topic = excluded.topic, env = excluded.env,
      activity_token = excluded.activity_token, city = excluded.city, title = excluded.title,
      slots = excluded.slots, next_at = excluded.next_at,
      -- Aynı etkinliğin listesi tazelendiyse başlangıç anı korunur (8 saat sayacı).
      started_at = case when eski = excluded.activity_token then public.live_activity_push.started_at else now() end,
      updated_at = now();
end;
$$;

create or replace function public.set_live_activity_start_token(
  p_device text, p_token text, p_topic text, p_env text
) returns void language sql security definer set search_path = public as $$
  insert into public.live_activity_push (device, topic, env, start_token, updated_at)
    values (lower(p_device), p_topic, p_env, lower(p_token), now())
    on conflict (device) do update set start_token = excluded.start_token, topic = excluded.topic,
      env = excluded.env, updated_at = now();
$$;

-- Kullanıcı canlı etkinliği kapattı: hiçbir push gönderilmez.
create or replace function public.unregister_live_activity(p_device text)
returns void language sql security definer set search_path = public as $$
  delete from public.live_activity_push where device = lower(p_device);
$$;

revoke all on function public.register_live_activity(text, text, text, text, text, text, jsonb),
  public.set_live_activity_start_token(text, text, text, text), public.unregister_live_activity(text) from public;
grant execute on function public.register_live_activity(text, text, text, text, text, text, jsonb),
  public.set_live_activity_start_token(text, text, text, text), public.unregister_live_activity(text) to anon, authenticated;
