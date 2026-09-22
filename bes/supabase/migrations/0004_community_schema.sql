-- Şartname §55, §70 — topluluk ("dua kardeşliği").
--
-- Tasarım kuralı: talep **anonimdir**. Yazarın kimliği yalnız moderasyon ve
-- kendi talebini silebilmesi için tutulur; hiçbir okuma politikası yazar
-- kimliğini başka kullanıcıya açmaz (§55, §69).

create table if not exists public.prayer_requests (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references auth.users(id) on delete cascade,
  body          text not null check (char_length(btrim(body)) between 10 and 500),
  category      text not null default 'genel',
  status        moderation_status not null default 'pending',
  amin_count    integer not null default 0 check (amin_count >= 0),
  report_count  integer not null default 0 check (report_count >= 0),
  created_at    timestamptz not null default now(),
  published_at  timestamptz
);
create index if not exists prayer_requests_feed_idx
  on public.prayer_requests (status, published_at desc);
create index if not exists prayer_requests_author_idx on public.prayer_requests (author_id);

-- "Dua ettim" — kullanıcı başına bir kez.
create table if not exists public.prayer_amins (
  request_id    uuid not null references public.prayer_requests(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (request_id, user_id)
);

-- Şikâyet (§55).
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references auth.users(id) on delete cascade,
  request_id    uuid not null references public.prayer_requests(id) on delete cascade,
  reason        text not null check (reason in ('spam', 'hakaret', 'uygunsuz', 'yanlis_bilgi', 'diger')),
  detail        text,
  handled       boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (reporter_id, request_id)
);

-- Engelleme (§55): engellenen kullanıcının talepleri akışta görünmez.
create table if not exists public.blocks (
  blocker_id    uuid not null references auth.users(id) on delete cascade,
  blocked_id    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Hız sınırı (§55, §89). Sunucu tarafı sayaç; istemciye güvenilmez.
create table if not exists public.rate_limits (
  user_id       uuid not null references auth.users(id) on delete cascade,
  action        text not null,
  window_start  timestamptz not null,
  count         integer not null default 0,
  primary key (user_id, action, window_start)
);
