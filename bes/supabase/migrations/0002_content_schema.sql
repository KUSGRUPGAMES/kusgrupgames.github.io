-- Şartname §70, §73, §74 — içerik şeması.
--
-- ÖNEMLİ: Bu tablolar **boş kurulur**. Meal, tefsir, hadis ve kıraat için
-- lisans alınmadan tek satır veri girilmez (CONTENT_SOURCES.md).
-- `sources` tablosu bu yüzden zorunlu yabancı anahtardır: kaynağı olmayan
-- içerik veritabanına giremez.

-- Kaynak künyesi. Ekranda gösterilen her dinî metin buraya bağlıdır.
create table if not exists public.sources (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,                 -- "Diyanet İşleri Başkanlığı Meali"
  author        text,
  publisher     text,
  edition       text,
  url           text,
  license       text not null,                 -- "CC BY-ND 4.0", "Ticari lisans no. ..."
  license_url   text,
  -- Lisansın uygulamada kullanıma izin verdiği kanıtı; boşsa içerik yayınlanamaz.
  license_proof text,
  language      text not null default 'tr',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Sure listesi. Bu **veri değil, yapıdır** (114 sure adı ve âyet sayısı);
-- telif konusu değildir.
create table if not exists public.surahs (
  number        smallint primary key check (number between 1 and 114),
  name_ar       text not null,
  name_tr       text not null,
  name_en       text not null,
  meaning_tr    text not null,
  ayah_count    smallint not null check (ayah_count > 0),
  revelation    text not null check (revelation in ('mekki', 'medeni')),
  page_start    smallint not null check (page_start between 1 and 604),
  juz_start     smallint not null check (juz_start between 1 and 30)
);

-- Arapça mushaf metni (§74). Kaynak: Tanzil (atıf şartıyla).
create table if not exists public.ayahs (
  id            bigserial primary key,
  surah         smallint not null references public.surahs(number),
  ayah          smallint not null check (ayah > 0),
  text_uthmani  text not null,
  text_simple   text not null,                 -- haresiz arama için
  juz           smallint not null check (juz between 1 and 30),
  page          smallint not null check (page between 1 and 604),
  hizb          smallint,
  sajda         boolean not null default false,
  source_id     uuid not null references public.sources(id),
  -- İçe aktarma doğrulaması: her âyetin sağlaması tutmazsa yükleme reddedilir.
  checksum      text not null,
  unique (surah, ayah)
);
create index if not exists ayahs_page_idx on public.ayahs (page);
create index if not exists ayahs_juz_idx on public.ayahs (juz);

-- Meal (§28, §35). Lisans gelmeden boş kalır. ⛔B1
create table if not exists public.translations (
  id            bigserial primary key,
  ayah_id       bigint not null references public.ayahs(id) on delete cascade,
  source_id     uuid not null references public.sources(id),
  language      text not null default 'tr',
  body          text not null,
  footnotes     text,
  status        content_status not null default 'draft',
  created_at    timestamptz not null default now(),
  unique (ayah_id, source_id, language)
);
create index if not exists translations_search_idx
  on public.translations using gin (body gin_trgm_ops);

-- Tefsir (§34). ⛔B2
create table if not exists public.tafsirs (
  id            bigserial primary key,
  ayah_id       bigint not null references public.ayahs(id) on delete cascade,
  source_id     uuid not null references public.sources(id),
  language      text not null default 'tr',
  body          text not null,
  status        content_status not null default 'draft',
  created_at    timestamptz not null default now(),
  unique (ayah_id, source_id, language)
);

-- Hadis kütüphanesi (§52). ⛔B3
create table if not exists public.hadiths (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references public.sources(id),
  collection    text not null,                 -- "Sahîh-i Buhârî"
  book          text,
  reference     text not null,                 -- "Îmân, 1"
  text_ar       text,
  text_tr       text not null,
  grade         text,                          -- sahih / hasen / zayıf
  topics        text[] not null default '{}',
  status        content_status not null default 'draft',
  created_at    timestamptz not null default now(),
  unique (source_id, collection, reference)
);
create index if not exists hadiths_topics_idx on public.hadiths using gin (topics);

-- Dua veritabanı (§39). 14 kategori; Arapça + okunuş + anlam + kaynak.
create table if not exists public.duas (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references public.sources(id),
  category      text not null,
  title_tr      text not null,
  text_ar       text,
  transliteration text,
  meaning_tr    text not null,
  reference     text not null,
  audio_path    text,
  status        content_status not null default 'draft',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists duas_category_idx on public.duas (category);

-- Esmâü'l-Hüsnâ (§26). 99 isim — sayı kısıtı veritabanında zorlanır.
create table if not exists public.names_of_allah (
  ordinal       smallint primary key check (ordinal between 1 and 99),
  name_ar       text not null,
  transliteration text not null,
  meaning_tr    text not null,
  explanation_tr text,
  source_id     uuid references public.sources(id)
);

-- İslami bilgi makaleleri (§53) ve Günün Bilgisi (§25).
create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  kind          content_kind not null default 'article',
  category      text not null,
  title         text not null,
  summary       text not null,
  body          text not null,
  source_id     uuid references public.sources(id),
  status        content_status not null default 'draft',
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists articles_status_idx on public.articles (status, published_at desc);

-- Günlük içerik takvimi: hangi gün hangi âyet/hadis/dua gösterilecek (§22–§24).
-- İçeriğin kendisi değil, **seçimi** burada tutulur.
create table if not exists public.daily_picks (
  on_date       date primary key,
  ayah_id       bigint references public.ayahs(id),
  hadith_id     uuid references public.hadiths(id),
  dua_id        uuid references public.duas(id),
  article_id    uuid references public.articles(id),
  created_at    timestamptz not null default now()
);

-- Dinî günler (§45). Hicri tarihten hesaplanabilir olanlar istemcide üretilir;
-- bu tablo resmî/yerel düzeltmeler ve açıklama metinleri içindir.
create table if not exists public.religious_days (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  gregorian_date date not null,
  title_tr      text not null,
  description_tr text,
  source_id     uuid references public.sources(id),
  status        content_status not null default 'draft',
  unique (slug, gregorian_date)
);

-- İçerik sürümleme ve denetim izi (§73).
create table if not exists public.content_revisions (
  id            bigserial primary key,
  kind          content_kind not null,
  record_id     text not null,
  from_status   content_status,
  to_status     content_status not null,
  changed_by    uuid,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists content_revisions_record_idx on public.content_revisions (kind, record_id);
