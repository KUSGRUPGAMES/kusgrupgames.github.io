-- BEŞ — moderasyon, yönetici ve uzaktan içerik yönetimi (D31 devamı).
-- 0001_community.sql'den SONRA, aynı şekilde SQL Editor'e yapıştırılıp
-- çalıştırılır. Bu dosya üçünü ekliyor:
--   1. Yasaklı kelime süzgeci (küfür/hakaret) — sunucu tarafında, atlanamaz.
--   2. Kısıtlama/yasaklama: şikâyetleri inceleyen yönetici bir kullanıcıyı
--      susturabilir (mute) ya da yasaklayabilir (ban); yasaklı/susturulmuş
--      kullanıcının yeni içerik göndermesi trigger'da reddedilir.
--   3. `content_items`: yönetici panelinden eklenen/düzenlenen duyuru, ek
--      dua, bilgi yazısı ve hazır kart içeriği — uygulama güncellemesi
--      gerekmeden yayınlanır.
-- Yönetici paneli: bes/admin/index.html (COMMUNITY_SETUP.md'de kurulumu var).

-- ── profil: yönetici, susturma, yasaklama ─────────────────────────────────
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists muted_until timestamptz;
alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists ban_reason text;

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = uid), false);
$$;

create or replace function public.is_restricted(uid uuid)
returns boolean language sql stable security definer as $$
  select coalesce((select p.banned or (p.muted_until is not null and p.muted_until > now())
                    from public.profiles p where p.id = uid), false);
$$;

-- Yönetici, BAŞKA kullanıcıların profilini (yasaklama/susturma/rütbe için)
-- güncelleyebilir. Kendi profilini herkes zaten güncelleyebiliyordu (0001).
create policy "yönetici herkesin profilini yönetir" on public.profiles
  for update using (public.is_admin(auth.uid())) with check (true);

-- ── yasaklı kelimeler ──────────────────────────────────────────────────
-- Yönetici panelinden büyütülür. Aşağıdaki temel liste bilerek burada:
-- boş bırakılsaydı sunucu tarafı denetim ilk kurulumda etkisiz kalırdı
-- (yalnız istemcideki `wordFilter.ts` ön denetimi çalışırdı, o da atlanabilir
-- bir istemci kontrolü). Bu liste `wordFilter.ts`teki temel listeyle aynı;
-- ikisi ayrı yerde büyüyebilir ama başlangıç noktası eşleşiyor.
create table if not exists public.banned_words (
  word text primary key,
  added_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.banned_words enable row level security;
create policy "yasaklı kelimeler herkese görünür" on public.banned_words for select using (true);
create policy "yalnız yönetici kelime ekler" on public.banned_words
  for insert with check (public.is_admin(auth.uid()));
create policy "yalnız yönetici kelime siler" on public.banned_words
  for delete using (public.is_admin(auth.uid()));

insert into public.banned_words (word) values
  ('amk'), ('aq'), ('orospu'), ('piç'), ('yavşak'), ('göt'), ('siktir'),
  ('sikeyim'), ('ibne'), ('amcık'), ('yarrak'), ('kahpe'), ('şerefsiz'), ('gavat')
on conflict (word) do nothing;

-- Kelime sınırlı eşleşme (ör. "kez" kelimesi "herkez" içinde yakalanmasın).
create or replace function public.contains_banned_word(body text)
returns boolean language plpgsql stable security definer as $$
declare
  kelime text;
begin
  for kelime in select word from public.banned_words loop
    if body ~* ('(^|[^a-zçğıöşü])' || kelime || '($|[^a-zçğıöşü])') then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

-- ── mevcut trigger'lara süzgeç + kısıtlama denetimi ekleniyor ───────────
-- 0001'deki hız sınırı fonksiyonları GENİŞLETİLİYOR (create or replace ile
-- aynı isim) — ayrı bir trigger eklemek yerine, sıralamayı karmaşıklaştırmadan
-- tek fonksiyonda toplanıyor.
create or replace function public.dua_requests_rate_limit()
returns trigger language plpgsql security definer as $$
begin
  if public.is_restricted(new.author_id) then
    raise exception 'Hesabın kısıtlı: yeni dua isteği gönderemezsin.';
  end if;
  if public.contains_banned_word(new.body) then
    raise exception 'Metin uygun olmayan bir kelime içeriyor.';
  end if;
  if (select count(*) from public.dua_requests
      where author_id = new.author_id and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Günlük dua isteği sınırına ulaşıldı (5). Yarın tekrar deneyebilirsin.';
  end if;
  return new;
end;
$$;

create or replace function public.chat_messages_rate_limit()
returns trigger language plpgsql security definer as $$
begin
  if public.is_restricted(new.author_id) then
    raise exception 'Hesabın kısıtlı: mesaj gönderemezsin.';
  end if;
  if public.contains_banned_word(new.body) then
    raise exception 'Mesaj uygun olmayan bir kelime içeriyor.';
  end if;
  if (select count(*) from public.chat_messages
      where author_id = new.author_id and created_at > now() - interval '5 minutes') >= 30 then
    raise exception 'Çok hızlı yazıyorsun, biraz yavaşla.';
  end if;
  return new;
end;
$$;

-- Hatim cüzü alma da kısıtlı kullanıcıya kapalı.
create or replace function public.khatm_claim_guard()
returns trigger language plpgsql security definer as $$
begin
  if new.claimed_by is not null and new.claimed_by is distinct from old.claimed_by
     and public.is_restricted(new.claimed_by) then
    raise exception 'Hesabın kısıtlı: cüz alamazsın.';
  end if;
  return new;
end;
$$;

drop trigger if exists khatm_claim_guard_trg on public.khatm_juz_claims;
create trigger khatm_claim_guard_trg
  before update on public.khatm_juz_claims
  for each row execute function public.khatm_claim_guard();

-- ── raporların yönetici tarafından işlenmesi ─────────────────────────────
alter table public.reports add column if not exists resolved_by uuid references auth.users (id);
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports add column if not exists resolution_note text;
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check
  check (status in ('open', 'reviewed', 'dismissed', 'action_taken'));

create policy "yönetici tüm raporları görür" on public.reports
  for select using (public.is_admin(auth.uid()));
create policy "yönetici raporu sonuçlandırır" on public.reports
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Yönetici, şikâyet edilen içeriği doğrudan gizleyebilsin diye
-- dua_requests/chat_messages üstünde de yönetici güncelleme izni gerekiyor
-- (0001'deki politika yalnız yazarın kendi satırına izin veriyordu). Ayrıca
-- yönetici paneli ZATEN GİZLENMİŞ bir içeriği de görebilmeli (şikâyet
-- panelinde önceki bir eylemden sonra tekrar bakmak gerekebilir) — 0001'in
-- select politikası yalnız `is_hidden = false or author_id = auth.uid()`
-- diyordu, yönetici yazar olmadığı için o durumda hiçbir şey görmezdi.
create policy "yönetici herhangi bir dua isteğini gizleyebilir" on public.dua_requests
  for update using (public.is_admin(auth.uid())) with check (true);
create policy "yönetici herhangi bir mesajı gizleyebilir" on public.chat_messages
  for update using (public.is_admin(auth.uid())) with check (true);
create policy "yönetici tüm dua isteklerini görür" on public.dua_requests
  for select using (public.is_admin(auth.uid()));
create policy "yönetici tüm mesajları görür" on public.chat_messages
  for select using (public.is_admin(auth.uid()));

-- ── uzaktan içerik: duyuru, ek dua, bilgi yazısı, hazır kart ─────────────
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('announcement', 'dua', 'info_article', 'share_card')),
  locale text not null default 'tr',
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) <= 4000),
  -- Türe özel ek alanlar (ör. share_card için {"reference": "..."}).
  extra jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_type_locale_idx
  on public.content_items (type, locale, is_published, sort_order);

alter table public.content_items enable row level security;

create policy "yayınlanmış içerik herkese görünür" on public.content_items
  for select using (is_published = true or public.is_admin(auth.uid()));
create policy "yalnız yönetici içerik ekler" on public.content_items
  for insert with check (public.is_admin(auth.uid()));
create policy "yalnız yönetici içerik günceller" on public.content_items
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "yalnız yönetici içerik siler" on public.content_items
  for delete using (public.is_admin(auth.uid()));

create or replace function public.content_items_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_items_touch_updated_at_trg on public.content_items;
create trigger content_items_touch_updated_at_trg
  before update on public.content_items
  for each row execute function public.content_items_touch_updated_at();

-- ── kendini yönetici yapma UYARISI ───────────────────────────────────────
-- Bu migration KENDİ BAŞINA kimseyi yönetici yapmaz. İlk yönetici hesabı
-- COMMUNITY_SETUP.md'deki tek satırlık SQL ile elle atanır — aksi halde
-- herkes kendi profilini `is_admin=true` yapabilirdi (0001'deki "yalnız
-- kendi profilini günceller" politikası bunu engellemiyordu).
--
-- Bunu bir WITH CHECK yerine trigger ile kapatıyoruz: bir WITH CHECK
-- ("is_admin = false" gibi) zaten yönetici OLAN ya da susturulmuş bir
-- kullanıcının kendi takma adını değiştirmesini de yanlışlıkla
-- engellerdi. Trigger yalnız yönetici DIŞINDAKİ bir kullanıcı bu dört
-- alanı değiştirmeye çalışırsa eski değerine sessizce geri döndürür;
-- takma ad değişikliği etkilenmez.
create or replace function public.profiles_guard_privileged_fields()
returns trigger language plpgsql security definer as $$
begin
  if not public.is_admin(auth.uid()) then
    new.is_admin := old.is_admin;
    new.banned := old.banned;
    new.muted_until := old.muted_until;
    new.ban_reason := old.ban_reason;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_fields_trg on public.profiles;
create trigger profiles_guard_privileged_fields_trg
  before update on public.profiles
  for each row execute function public.profiles_guard_privileged_fields();
