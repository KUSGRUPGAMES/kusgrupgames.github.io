-- BEŞ — yönetici paneli (D36). 0005'ten SONRA çalıştırılır; tekrar çalıştırılabilir.
--
-- Panel (docs/<gizli yol>/index.html) yalnız anon anahtarla konuşur; her şey
-- burada, `is_admin` denetimli `security definer` işlevler ve RLS ile
-- korunur. Yönetici olmayan biri paneli açsa da hiçbir veri göremez.
--
-- BİLEREK YOK: yöneticinin kullanıcıların kişisel eşitleme kaydını
-- (`user_data.payload`) okuması. Gizlilik sayfası bu kaydın "yalnız sizin
-- erişebileceğiniz" olduğunu söylüyor; panel yalnız var/yok, boyut ve son
-- eşitleme zamanını görür, kaydı silebilir.

-- ── içerik türleri: âyet havuzu, günün bilgisi, yerleşiği gizleme ─────
-- (uygulamadaki karşılığı: src/features/content/remote.ts)
alter table public.content_items drop constraint if exists content_items_type_check;
alter table public.content_items add constraint content_items_type_check
  check (type in ('announcement', 'dua', 'info_article', 'share_card', 'verse', 'knowledge', 'hide'));

-- ── kullanıcı uyarıları (şikâyet üzerine yöneticinin uyarısı) ──────────
create table if not exists public.user_warnings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null check (char_length(message) between 1 and 500),
  report_id bigint references public.reports (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  seen_at timestamptz
);
alter table public.user_warnings enable row level security;
drop policy if exists "kendi uyarılarını görür" on public.user_warnings;
create policy "kendi uyarılarını görür" on public.user_warnings
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists "kendi uyarısını okundu işaretler" on public.user_warnings;
create policy "kendi uyarısını okundu işaretler" on public.user_warnings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "yönetici uyarı yazar" on public.user_warnings;
create policy "yönetici uyarı yazar" on public.user_warnings
  for insert to authenticated with check (public.is_admin(auth.uid()));
drop policy if exists "yönetici uyarı siler" on public.user_warnings;
create policy "yönetici uyarı siler" on public.user_warnings
  for delete to authenticated using (public.is_admin(auth.uid()));
grant select, insert, update, delete on public.user_warnings to authenticated;

-- ── günlük metrikler (dış kaynaklar: RevenueCat, App Store Connect …) ──
create table if not exists public.metrics_daily (
  day date not null,
  source text not null,
  metric text not null,
  value numeric not null,
  updated_at timestamptz not null default now(),
  primary key (day, source, metric)
);
alter table public.metrics_daily enable row level security;
drop policy if exists "yönetici metrikleri görür" on public.metrics_daily;
create policy "yönetici metrikleri görür" on public.metrics_daily
  for select to authenticated using (public.is_admin(auth.uid()));
grant select on public.metrics_daily to authenticated;

-- ── yönetici yetkileri: içerik silme/düzenleme ─────────────────────────
drop policy if exists "yönetici dua isteği siler" on public.dua_requests;
create policy "yönetici dua isteği siler" on public.dua_requests
  for delete to authenticated using (public.is_admin(auth.uid()));
drop policy if exists "yönetici mesaj siler" on public.chat_messages;
create policy "yönetici mesaj siler" on public.chat_messages
  for delete to authenticated using (public.is_admin(auth.uid()));
drop policy if exists "yönetici hatim grubunu yönetir" on public.khatm_circles;
create policy "yönetici hatim grubunu yönetir" on public.khatm_circles
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "yönetici cüzleri yönetir" on public.khatm_juz_claims;
create policy "yönetici cüzleri yönetir" on public.khatm_juz_claims
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "yönetici odaları yönetir" on public.chat_rooms;
create policy "yönetici odaları yönetir" on public.chat_rooms
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "yönetici şikâyet siler" on public.reports;
create policy "yönetici şikâyet siler" on public.reports
  for delete to authenticated using (public.is_admin(auth.uid()));
drop policy if exists "yönetici tüm içeriği görür" on public.content_items;
create policy "yönetici tüm içeriği görür" on public.content_items
  for select to authenticated using (public.is_admin(auth.uid()));
drop policy if exists "yönetici dua kayıtlarını görür" on public.dua_prayers;
create policy "yönetici dua kayıtlarını görür" on public.dua_prayers
  for select to authenticated using (public.is_admin(auth.uid()));
drop policy if exists "yönetici engellemeleri görür" on public.blocks;
create policy "yönetici engellemeleri görür" on public.blocks
  for select to authenticated using (public.is_admin(auth.uid()));
grant select, insert, update, delete on public.khatm_circles, public.khatm_juz_claims, public.chat_rooms to authenticated;
grant delete on public.dua_requests, public.chat_messages, public.reports to authenticated;

-- ── yardımcı: çağıran yönetici mi ──────────────────────────────────────
create or replace function public.require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'yönetici yetkisi gerekli' using errcode = '42501';
  end if;
end;
$$;

-- ── kullanıcı listesi (e-posta auth şemasında; yalnız yöneticiye) ──────
create or replace function public.admin_users(q text default '', lim integer default 200)
returns table (
  id uuid, email text, provider text, created_at timestamptz, last_sign_in_at timestamptz,
  nickname text, is_admin boolean, banned boolean, ban_reason text, muted_until timestamptz,
  dua_count bigint, message_count bigint, warning_count bigint,
  has_sync boolean, sync_bytes integer, sync_updated_at timestamptz
) language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.require_admin();
  return query
  select u.id, u.email::text, coalesce(u.raw_app_meta_data->>'provider', 'email'), u.created_at, u.last_sign_in_at,
         p.nickname, coalesce(p.is_admin, false), coalesce(p.banned, false), p.ban_reason, p.muted_until,
         (select count(*) from public.dua_requests d where d.author_id = u.id),
         (select count(*) from public.chat_messages m where m.author_id = u.id),
         (select count(*) from public.user_warnings w where w.user_id = u.id),
         (ud.user_id is not null), pg_column_size(ud.payload), ud.updated_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.user_data ud on ud.user_id = u.id
  where q = '' or u.email ilike '%' || q || '%' or p.nickname ilike '%' || q || '%' or u.id::text = q
  order by u.created_at desc
  limit lim;
end;
$$;

-- ── kullanıcıyı tamamen sil (hesap + bütün içeriği, cascade) ───────────
create or replace function public.admin_delete_user(uid uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.require_admin();
  if uid = auth.uid() then raise exception 'kendi hesabını panelden silemezsin'; end if;
  update public.banned_words set added_by = null where added_by = uid;
  update public.reports set resolved_by = null where resolved_by = uid;
  update public.content_items set created_by = null where created_by = uid;
  delete from auth.users where id = uid;
end;
$$;

-- ── kişisel eşitleme kaydını sil (içeriğini okumadan) ──────────────────
create or replace function public.admin_delete_user_data(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  delete from public.user_data where user_id = uid;
end;
$$;

-- ── pano istatistikleri ────────────────────────────────────────────────
-- Günlük aktif kullanıcı: giriş yapmış kullanıcıların o gün yenilenen oturumu
-- (auth.refresh_tokens) — uygulama öndeyken oturum düzenli yenilenir.
-- Giriş yapmayan kullanıcılar sayılamaz: uygulamada analitik yok (gizlilik
-- sözü); onların sayısı App Store/Play indirmelerinden okunur.
create or replace function public.admin_stats(days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  baslangic date := current_date - (days - 1);
  sonuc jsonb;
begin
  perform public.require_admin();
  with gunler as (select generate_series(baslangic, current_date, interval '1 day')::date as g)
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'users', (select count(*) from auth.users),
      'profiles', (select count(*) from public.profiles),
      'syncUsers', (select count(*) from public.user_data),
      'duaRequests', (select count(*) from public.dua_requests),
      'prayers', (select count(*) from public.dua_prayers),
      'chatMessages', (select count(*) from public.chat_messages),
      'khatmCircles', (select count(*) from public.khatm_circles),
      'khatmActive', (select count(*) from public.khatm_circles where completed_at is null),
      'khatmCompleted', (select count(*) from public.khatm_circles where completed_at is not null),
      'juzCompleted', (select count(*) from public.khatm_juz_claims where completed),
      'openReports', (select count(*) from public.reports where status = 'open'),
      'banned', (select count(*) from public.profiles where banned),
      'muted', (select count(*) from public.profiles where muted_until > now()),
      'contentItems', (select count(*) from public.content_items),
      'apple', (select count(*) from auth.users where raw_app_meta_data->>'provider' = 'apple'),
      'google', (select count(*) from auth.users where raw_app_meta_data->>'provider' = 'google'),
      'activeToday', (select count(distinct user_id) from auth.refresh_tokens where updated_at::date = current_date),
      'active7', (select count(distinct user_id) from auth.refresh_tokens where updated_at > now() - interval '7 days'),
      'active30', (select count(distinct user_id) from auth.refresh_tokens where updated_at > now() - interval '30 days')
    ),
    'daily', (select jsonb_agg(jsonb_build_object(
      'day', g,
      'signups', (select count(*) from auth.users where created_at::date = g),
      'active', (select count(distinct user_id) from auth.refresh_tokens where updated_at::date = g or created_at::date = g),
      'syncs', (select count(*) from public.user_data where updated_at::date = g),
      'duaRequests', (select count(*) from public.dua_requests where created_at::date = g),
      'prayers', (select count(*) from public.dua_prayers where created_at::date = g),
      'chatMessages', (select count(*) from public.chat_messages where created_at::date = g),
      'reports', (select count(*) from public.reports where created_at::date = g)
    ) order by g) from gunler)
  ) into sonuc;
  return sonuc;
end;
$$;

revoke all on function public.admin_users(text, integer), public.admin_delete_user(uuid),
  public.admin_delete_user_data(uuid), public.admin_stats(integer), public.require_admin() from public, anon;
grant execute on function public.admin_users(text, integer), public.admin_delete_user(uuid),
  public.admin_delete_user_data(uuid), public.admin_stats(integer), public.require_admin() to authenticated;

-- ── panel ayarları (gizli olmayan: ör. App Store satıcı numarası) ───────
-- Gizli anahtarlar (RevenueCat, App Store Connect .p8) BURADA DEĞİL:
-- Supabase → Edge Functions → Secrets'ta durur, tarayıcıya hiç inmez.
create table if not exists public.admin_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.admin_settings enable row level security;
drop policy if exists "yönetici ayarları yönetir" on public.admin_settings;
create policy "yönetici ayarları yönetir" on public.admin_settings
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
grant select, insert, update, delete on public.admin_settings to authenticated;
