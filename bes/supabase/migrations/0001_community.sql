-- BEŞ — topluluk modülü şeması (D31): dua panosu, sohbet odaları, hatim
-- grupları. Bu dosya Supabase projesine "SQL Editor"den bir kez, olduğu
-- gibi yapıştırılıp çalıştırılır (bkz. bes/COMMUNITY_SETUP.md).
--
-- Tasarım ilkeleri:
--   1. Kimlik yalnız anonim: Supabase'in "anonymous sign-in" özelliği ile
--      cihaz başına kararlı bir auth.uid() üretilir; e-posta, ad, telefon
--      İSTENMEZ. Görünen ad yalnız kullanıcının kendi seçtiği takma addır.
--   2. "Dua ettim" sayısı herkese açık, KİM ettiği kapalı — riyadan
--      (gösterişten) kaçınmak için. `dua_prayers` tablosunda select yalnız
--      kendi satırın; toplam sayı `dua_requests.prayer_count`de.
--   3. Hiçbir kayıt asıl silinmez/değiştirilmez; kullanıcı yalnız kendi
--      mesajını `is_hidden` ile gizleyebilir. Şikâyet incelemesi bu projenin
--      sahibi tarafından Supabase Table Editor'den elle yapılır (rapor
--      bulunduğu tablo `reports`); ayrı bir yönetici paneli bu sürümde yok.
--   4. Hız sınırı sunucu tarafında (trigger): istemci atlayamaz.

create extension if not exists pgcrypto;

-- ── profiller ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiller herkese görünür" on public.profiles
  for select using (true);
create policy "yalnız kendi profilini yazar" on public.profiles
  for insert with check (auth.uid() = id);
create policy "yalnız kendi profilini günceller" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── engelleme ve şikâyet ────────────────────────────────────────────────
create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

create policy "yalnız kendi engel listesini görür" on public.blocks
  for select using (auth.uid() = blocker_id);
create policy "yalnız kendi adına engeller" on public.blocks
  for insert with check (auth.uid() = blocker_id);
create policy "yalnız kendi engelini kaldırır" on public.blocks
  for delete using (auth.uid() = blocker_id);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('dua_request', 'chat_message')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Şikâyetler yalnız gönderilir; okuması proje sahibinindir (Table Editor,
-- service role RLS'i atlar). Sıradan kullanıcı için select politikası
-- BİLEREK yok — Apple 1.2 kuralı "24 saat içinde incele" der, bu kontrol
-- panelsiz de mümkündür: bes/COMMUNITY_SETUP.md'de nasıl bakılacağı yazılı.
create policy "yalnız kendi adına şikâyet açar" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- ── dua panosu ──────────────────────────────────────────────────────────
create table if not exists public.dua_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('saglik', 'aile', 'sinav_is', 'vefat', 'genel')),
  body text not null check (char_length(body) between 1 and 280),
  prayer_count integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists dua_requests_created_at_idx on public.dua_requests (created_at desc);

alter table public.dua_requests enable row level security;

create policy "gizli olmayan istekler herkese görünür" on public.dua_requests
  for select using (is_hidden = false or author_id = auth.uid());
create policy "yalnız kendi adına istek açar" on public.dua_requests
  for insert with check (auth.uid() = author_id);
create policy "yazar kendi isteğini gizleyebilir" on public.dua_requests
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Hız sınırı: 24 saatte kişi başı en çok 5 dua isteği. Sessizce spam'i
-- önler; istemci bunu atlayamaz çünkü trigger sunucu tarafında.
create or replace function public.dua_requests_rate_limit()
returns trigger language plpgsql security definer as $$
begin
  if (select count(*) from public.dua_requests
      where author_id = new.author_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Günlük dua isteği sınırına ulaşıldı (5). Yarın tekrar deneyebilirsin.';
  end if;
  return new;
end;
$$;

drop trigger if exists dua_requests_rate_limit_trg on public.dua_requests;
create trigger dua_requests_rate_limit_trg
  before insert on public.dua_requests
  for each row execute function public.dua_requests_rate_limit();

-- "Dua ettim": kimin ettiği gizli, yalnız toplam sayı görünür (riya değil,
-- niyet). Aynı kişi aynı isteğe yalnız bir kez sayılır (birincil anahtar).
create table if not exists public.dua_prayers (
  request_id uuid not null references public.dua_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

alter table public.dua_prayers enable row level security;

create policy "yalnız kendi dua ettim kaydını görür" on public.dua_prayers
  for select using (auth.uid() = user_id);
create policy "yalnız kendi adına dua ettim işaretler" on public.dua_prayers
  for insert with check (auth.uid() = user_id);

create or replace function public.dua_prayers_increment()
returns trigger language plpgsql security definer as $$
begin
  update public.dua_requests set prayer_count = prayer_count + 1 where id = new.request_id;
  return new;
end;
$$;

drop trigger if exists dua_prayers_increment_trg on public.dua_prayers;
create trigger dua_prayers_increment_trg
  after insert on public.dua_prayers
  for each row execute function public.dua_prayers_increment();

-- ── sohbet odaları ──────────────────────────────────────────────────────
-- Bilerek isimli, sabit, HERKESE AÇIK odalar — rastgele/özel eşleşme yok.
-- Apple 1.2 "rastgele/anonim sohbet" uygulamalarını ayrıca sıkı denetliyor;
-- sabit, konu başlıklı odalar hem daha güvenli hem denetlenmesi daha kolay.
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0
);

alter table public.chat_rooms enable row level security;
create policy "odalar herkese görünür" on public.chat_rooms for select using (true);

insert into public.chat_rooms (slug, title, description, sort_order) values
  ('genel', 'Genel Sohbet', 'Selamlaşma, tanışma, günlük sohbet.', 1),
  ('soru-cevap', 'Soru ve Cevap', 'Fıkhi/dinî sorular — burada verilen cevaplar kişisel görüştür, fetva değildir.', 2),
  ('kardeslik', 'Dua Kardeşliği', 'Dua isteklerini konuşmak, birbirine destek olmak için.', 3),
  ('yeni-baslayanlar', 'Yeni Başlayanlar', 'İslam''ı yeni öğrenenler ve namaza yeni başlayanlar için.', 4)
on conflict (slug) do nothing;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  -- Takma ad gönderim anında kopyalanır: kullanıcı sonra adını değiştirirse
  -- geçmiş mesajlar bozulmaz/karışmaz.
  nickname text not null,
  body text not null check (char_length(body) between 1 and 500),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_created_idx
  on public.chat_messages (room_id, created_at desc);

alter table public.chat_messages enable row level security;

create policy "gizli olmayan mesajlar herkese görünür" on public.chat_messages
  for select using (is_hidden = false or author_id = auth.uid());
create policy "yalnız kendi adına mesaj yazar" on public.chat_messages
  for insert with check (auth.uid() = author_id);
create policy "yazar kendi mesajını gizleyebilir" on public.chat_messages
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Hız sınırı: 5 dakikada kişi başı en çok 30 mesaj (tüm odalar toplamı).
create or replace function public.chat_messages_rate_limit()
returns trigger language plpgsql security definer as $$
begin
  if (select count(*) from public.chat_messages
      where author_id = new.author_id and created_at > now() - interval '5 minutes') >= 30 then
    raise exception 'Çok hızlı yazıyorsun, biraz yavaşla.';
  end if;
  return new;
end;
$$;

drop trigger if exists chat_messages_rate_limit_trg on public.chat_messages;
create trigger chat_messages_rate_limit_trg
  before insert on public.chat_messages
  for each row execute function public.chat_messages_rate_limit();

-- ── hatim grupları ──────────────────────────────────────────────────────
create table if not exists public.khatm_circles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 60),
  purpose text not null default '' check (char_length(purpose) <= 200),
  created_by uuid not null references auth.users (id) on delete cascade,
  is_public boolean not null default true,
  -- Özel gruba katılmak için paylaşılan kod; herkese açık listelemede
  -- kullanılmaz (istemci `is_public = true` filtresiyle listeler), yalnız
  -- kodu bilenin doğrudan sorgusunda işe yarar.
  invite_code text not null unique default substr(md5(gen_random_uuid()::text), 1, 8),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.khatm_circles enable row level security;

create policy "gruplar herkese görünür" on public.khatm_circles for select using (true);
create policy "yalnız kendi adına grup açar" on public.khatm_circles
  for insert with check (auth.uid() = created_by);

create table if not exists public.khatm_juz_claims (
  circle_id uuid not null references public.khatm_circles (id) on delete cascade,
  juz_no integer not null check (juz_no between 1 and 30),
  claimed_by uuid references auth.users (id) on delete set null,
  claimed_nickname text,
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (circle_id, juz_no)
);

alter table public.khatm_juz_claims enable row level security;

create policy "cüz listesi herkese görünür" on public.khatm_juz_claims for select using (true);
-- Alma (boştan bana), bırakma (benden boşa) ve tamamlama (benim, tamamlandı)
-- — başka kimsenin aldığı cüze dokunulamaz.
create policy "cüz alma/bırakma/tamamlama yalnız ilgili kişi" on public.khatm_juz_claims
  for update
  using (claimed_by is null or claimed_by = auth.uid())
  with check (claimed_by is null or claimed_by = auth.uid());

-- Yeni grup açılınca 30 boş cüz satırı otomatik oluşur — istemci bunu
-- elle uğraşmaz, `khatm_circles`e bir satır eklemesi yeterli.
create or replace function public.khatm_seed_juz()
returns trigger language plpgsql security definer as $$
begin
  insert into public.khatm_juz_claims (circle_id, juz_no)
  select new.id, n from generate_series(1, 30) as n;
  return new;
end;
$$;

drop trigger if exists khatm_seed_juz_trg on public.khatm_circles;
create trigger khatm_seed_juz_trg
  after insert on public.khatm_circles
  for each row execute function public.khatm_seed_juz();

-- 30 cüzün tamamı tamamlanınca grup otomatik "tamamlandı" işaretlenir —
-- bu, katılımcıların kayıtlarında (COMMUNITY_SETUP.md'deki §7 ekranı)
-- kalıcı bir geçmiş oluşturur.
create or replace function public.khatm_check_complete()
returns trigger language plpgsql security definer as $$
begin
  if new.completed = true and not exists (
    select 1 from public.khatm_juz_claims
    where circle_id = new.circle_id and completed = false
  ) then
    update public.khatm_circles set completed_at = now()
    where id = new.circle_id and completed_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists khatm_check_complete_trg on public.khatm_juz_claims;
create trigger khatm_check_complete_trg
  after update on public.khatm_juz_claims
  for each row execute function public.khatm_check_complete();
