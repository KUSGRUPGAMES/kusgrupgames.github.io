-- RLS davranış sınaması — şartname §71, §86.
-- Her iddia `assert` ile yazılır; biri tutmazsa betik hata verip durur.
-- Çalıştırma: tools/verify-db.sh

\set ON_ERROR_STOP on

-- Tüm sınama tek işlemde çalışır ve sonunda geri alınır: veritabanı
-- sınamadan etkilenmez.
begin;

-- Temiz başlangıç.
truncate table public.sources, public.surahs, public.ayahs, public.translations,
  public.tafsirs, public.hadiths, public.duas, public.articles, public.daily_picks,
  public.religious_days, public.prayer_requests, public.audit_log cascade;
delete from auth.users;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'editor@example.com');

update public.profiles set role = 'editor'
 where id = '33333333-3333-3333-3333-333333333333';

-- Tetikleyici profil/ayar/abonelik satırlarını açtı mı? (§57)
do $$ begin
  assert (select count(*) from public.profiles) = 3, 'profil satırları açılmadı';
  assert (select count(*) from public.user_settings) = 3, 'ayar satırları açılmadı';
  assert (select count(*) from public.subscriptions) = 3, 'abonelik satırları açılmadı';
end $$;

-- İçerik: bir kaynak, bir sure, bir âyet, biri taslak biri yayınlanmış meal.
insert into public.sources (id, slug, title, license)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'tanzil', 'Tanzil Kur''an metni', 'Tanzil kullanım şartları');

insert into public.surahs (number, name_ar, name_tr, name_en, meaning_tr, ayah_count, revelation, page_start, juz_start)
values (1, 'x', 'Fatiha', 'Al-Fatihah', 'Açılış', 7, 'mekki', 1, 1);

insert into public.ayahs (surah, ayah, text_uthmani, text_simple, juz, page, source_id, checksum)
values (1, 1, 'metin', 'metin', 1, 1, 'aaaaaaaa-0000-0000-0000-000000000001', 'sha256:test');

insert into public.translations (ayah_id, source_id, language, body, status)
select id, 'aaaaaaaa-0000-0000-0000-000000000001', 'tr', 'yayinlanmis meal', 'published' from public.ayahs;
insert into public.translations (ayah_id, source_id, language, body, status)
select id, 'aaaaaaaa-0000-0000-0000-000000000001', 'en', 'taslak meal', 'draft' from public.ayahs;

-- ---------------------------------------------------------------- A olarak
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into public.bookmarks (user_id, surah, ayah, label) values (auth.uid(), 1, 1, 'A yer imi');
insert into public.favorites (user_id, kind, record_id) values (auth.uid(), 'dua', 'dua-1');

do $$ begin
  assert (select count(*) from public.bookmarks) = 1, 'A kendi yer imini göremiyor';
  -- Taslak meal son kullanıcıya görünmez (§73).
  assert (select count(*) from public.translations) = 1, 'taslak meal sızdı';
  assert (select body from public.translations) = 'yayinlanmis meal', 'yanlış meal görünüyor';
  -- Denetim izi normal kullanıcıya kapalı (§72).
  assert (select count(*) from public.audit_log) = 0, 'denetim izi sızdı';
end $$;

-- Abonelik satırını kullanıcı yazamaz (§67).
do $$
declare ok boolean := false;
begin
  begin
    update public.subscriptions set status = 'active' where user_id = auth.uid();
    -- Politikası olmayan update: satır güncellenmez ya da yetki hatası verir.
    if found then raise exception 'abonelik istemciden yükseltilebildi'; end if;
    ok := true;
  exception
    when insufficient_privilege then ok := true;
  end;
  assert ok, 'abonelik yazma kontrolü belirsiz';
end $$;

-- Topluluk: A bir dua talebi açar (henüz 'pending').
insert into public.prayer_requests (author_id, body)
values (auth.uid(), 'Ailem icin dua istirham ediyorum, tesekkur ederim.');

-- ---------------------------------------------------------------- B olarak
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$ begin
  assert (select count(*) from public.bookmarks) = 0, 'B, A''nin yer imlerini görüyor';
  assert (select count(*) from public.favorites) = 0, 'B, A''nin favorilerini görüyor';
  -- Onaylanmamış talep akışta görünmez (§55).
  assert (select count(*) from public.prayer_requests) = 0, 'moderasyondan geçmemiş talep akışta';
  assert (select count(*) from public.prayer_feed) = 0, 'onaysız talep feed''de';
end $$;

-- B, A'nın yer imini güncelleyemez: politika satırı hiç görmediği için 0 satır etkilenir.
update public.bookmarks set label = 'ele geçirildi';
do $$ begin
  assert not found or (select count(*) from public.bookmarks where label = 'ele geçirildi') = 0,
    'B, A''nin yer imini değiştirdi';
end $$;

-- B, başkası adına satır yazamaz (with check).
do $$
declare blocked boolean := false;
begin
  begin
    insert into public.bookmarks (user_id, surah, ayah)
    values ('11111111-1111-1111-1111-111111111111', 2, 5);
  exception when others then blocked := true;
  end;
  assert blocked, 'B, A adına yer imi yazabildi';
end $$;

-- AI: asistan rolüyle mesaj yazılamaz (§56 — yalnız Edge Function yazar).
insert into public.ai_conversations (id, user_id)
values ('44444444-4444-4444-4444-444444444444', auth.uid());
do $$
declare blocked boolean := false;
begin
  begin
    insert into public.ai_messages (conversation_id, role, body, citations)
    values ('44444444-4444-4444-4444-444444444444', 'assistant', 'uydurma cevap', '[]'::jsonb);
  exception when others then blocked := true;
  end;
  assert blocked, 'istemci asistan yanıtı yazabildi';
end $$;

-- ---------------------------------------------------------- moderatör onayı
reset role;
update public.prayer_requests
   set status = 'approved', published_at = now();

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$ begin
  assert (select count(*) from public.prayer_feed) = 1, 'onaylı talep akışta görünmüyor';
  -- Akış görünümünde yazar kimliği sütunu yoktur (§55 anonimlik).
  assert not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'prayer_feed' and column_name = 'author_id'
  ), 'akış görünümü yazar kimliğini sızdırıyor';
end $$;

-- "Dua ettim" sayacı tetikleyiciyle artar.
insert into public.prayer_amins (request_id, user_id)
select id, auth.uid() from public.prayer_requests limit 1;
do $$ begin
  assert (select amin_count from public.prayer_feed limit 1) = 1, 'amin sayacı artmadı';
  assert (select i_prayed from public.prayer_feed limit 1), 'kendi aminim görünmüyor';
end $$;

-- Engelleme: B, A'yı engellerse talep akıştan düşer (§55).
insert into public.blocks (blocker_id, blocked_id)
values (auth.uid(), '11111111-1111-1111-1111-111111111111');
do $$ begin
  assert (select count(*) from public.prayer_requests) = 0, 'engellenen kullanıcının talebi görünüyor';
end $$;

-- ------------------------------------------------------------- editör rolü
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
do $$ begin
  assert (select count(*) from public.translations) = 2, 'editör taslağı göremiyor';
end $$;

-- ------------------------------------------------------------ veri dışa/silme
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
do $$
declare d jsonb;
begin
  d := public.export_my_data();
  assert d ? 'bookmarks', 'dışa aktarma yer imlerini içermiyor';
  assert jsonb_array_length(d -> 'bookmarks') = 1, 'dışa aktarma eksik';
end $$;

reset role;
select 'RLS TESTLERI GECTI' as sonuc;

rollback;
