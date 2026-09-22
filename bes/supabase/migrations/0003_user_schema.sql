-- Şartname §57–§60, §70 — kullanıcı şeması.
-- Tüm tablolar `auth.users` üzerine kurulur; misafir kullanım için satır
-- açılmaz (§57: hesap zorunlu değildir, veriler cihazda kalır).

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  role          app_role not null default 'user',
  locale        text not null default 'tr',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Ayarlar (§60) — tek satır, JSON gövde. Şema esnek olmalı çünkü ayar
-- listesi sürümden sürüme büyür; doğrulama istemcide Zod ile yapılır.
create table if not exists public.user_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  settings      jsonb not null default '{}'::jsonb,
  home_layout   jsonb not null default '[]'::jsonb,   -- §21 ana sayfa düzeni
  updated_at    timestamptz not null default now()
);

-- Kayıtlı konumlar (§13). Saat dilimi IANA adıdır; sabit ofset tutulmaz.
create table if not exists public.user_locations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  label         text not null,
  country       text,
  city          text,
  district      text,
  latitude      double precision not null check (latitude between -90 and 90),
  longitude     double precision not null check (longitude between -180 and 180),
  timezone      text not null,
  method        text not null default 'diyanet',
  adjustments   jsonb not null default '{}'::jsonb,   -- vakit bazlı dakika düzeltmesi
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists user_locations_user_idx on public.user_locations (user_id);
-- Bir kullanıcının yalnız bir birincil konumu olabilir.
create unique index if not exists user_locations_one_primary
  on public.user_locations (user_id) where is_primary;

-- Birleşik favoriler (§63): âyet, hadis, dua, esmâ, makale.
create table if not exists public.favorites (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          content_kind not null,
  record_id     text not null,
  collection    text,
  created_at    timestamptz not null default now(),
  unique (user_id, kind, record_id)
);
create index if not exists favorites_user_idx on public.favorites (user_id, kind);

-- Yer imleri (§30): renk, etiket, not.
create table if not exists public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  surah         smallint not null,
  ayah          smallint not null,
  color         text not null default 'emerald',
  label         text,
  note          text,
  created_at    timestamptz not null default now(),
  unique (user_id, surah, ayah)
);

-- Son okunan / devam et (§29).
create table if not exists public.reading_progress (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  surah         smallint not null,
  ayah          smallint not null,
  page          smallint,
  scroll_offset real,
  updated_at    timestamptz not null default now()
);

-- Hatim / mukabele takibi (§48): 30 cüz.
create table if not exists public.khatm_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default 'Hatim',
  started_on    date not null default current_date,
  target_on     date,
  completed_juz smallint[] not null default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Zikirmatik (§37, §38).
create table if not exists public.dhikr_presets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  text_ar       text,
  transliteration text,
  target        integer not null default 33 check (target > 0),
  created_at    timestamptz not null default now()
);

create table if not exists public.dhikr_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  preset_id     uuid references public.dhikr_presets(id) on delete set null,
  title         text not null,
  count         integer not null check (count >= 0),
  target        integer not null check (target > 0),
  on_date       date not null default current_date,
  created_at    timestamptz not null default now()
);
create index if not exists dhikr_sessions_user_date_idx on public.dhikr_sessions (user_id, on_date desc);

-- Kaza namazı sayaçları (§41). Sayaç asla eksiye düşmez.
create table if not exists public.qada_counters (
  user_id       uuid not null references auth.users(id) on delete cascade,
  slot          prayer_slot not null check (slot <> 'sunrise'),
  remaining     integer not null default 0 check (remaining >= 0),
  updated_at    timestamptz not null default now(),
  primary key (user_id, slot)
);

-- Kaza hareket geçmişi — "toplu giriş" ve geri alma için (§41).
create table if not exists public.qada_entries (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  slot          prayer_slot not null,
  delta         integer not null,
  reason        text,
  created_at    timestamptz not null default now()
);
create index if not exists qada_entries_user_idx on public.qada_entries (user_id, created_at desc);

-- İbadet / amel defteri (§42).
create table if not exists public.worship_log (
  user_id       uuid not null references auth.users(id) on delete cascade,
  on_date       date not null,
  entries       jsonb not null default '{}'::jsonb,  -- {"fajr":"jamaah","quran_minutes":20,...}
  note          text,
  updated_at    timestamptz not null default now(),
  primary key (user_id, on_date)
);

-- Oruç takibi (§49).
create table if not exists public.fasting_log (
  user_id       uuid not null references auth.users(id) on delete cascade,
  on_date       date not null,
  kind          text not null check (kind in ('ramadan', 'qada', 'nafile', 'kaffara')),
  completed     boolean not null default true,
  note          text,
  primary key (user_id, on_date)
);

-- Özel hatırlatıcılar (§64).
create table if not exists public.reminders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  body          text,
  -- 'time' (sabit saat) veya 'prayer' (vakte göre offset).
  trigger_kind  text not null check (trigger_kind in ('time', 'prayer')),
  at_time       time,
  slot          prayer_slot,
  offset_min    integer not null default 0,
  weekdays      smallint[] not null default '{0,1,2,3,4,5,6}',
  is_enabled    boolean not null default true,
  created_at    timestamptz not null default now(),
  -- Tetikleyici türüne göre gerekli alan dolu olmalı.
  check ((trigger_kind = 'time' and at_time is not null)
      or (trigger_kind = 'prayer' and slot is not null))
);

-- Abonelik durumu (§67). Kaynak doğruluk mağazadır; burası önbellektir.
create table if not exists public.subscriptions (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  status        subscription_status not null default 'none',
  product_id    text,
  platform      text check (platform in ('ios', 'android')),
  expires_at    timestamptz,
  original_transaction_id text,
  updated_at    timestamptz not null default now()
);

-- Cihaz kaydı — push bildirimleri (§65).
create table if not exists public.devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  push_token    text not null,
  platform      text not null check (platform in ('ios', 'android')),
  locale        text,
  app_version   text,
  last_seen_at  timestamptz not null default now(),
  unique (user_id, push_token)
);
