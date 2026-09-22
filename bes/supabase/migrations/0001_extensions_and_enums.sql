-- Şartname §70 — temel kurulum.
-- Uzantılar ve tüm şemada kullanılan numaralandırmalar.

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";       -- arama: benzerlik
create extension if not exists "unaccent";      -- arama: diacritics (§78)

-- Vektör uzantısı yalnız RAG için gerekir (§56). Ortamda yoksa AI şeması
-- kurulmaz; uygulamanın geri kalanı bundan etkilenmez.
create extension if not exists "vector";

-- İçerik doğrulama akışı (§73). Yayına yalnız PUBLISHED çıkar.
do $$ begin
  create type content_status as enum ('draft', 'review', 'verified', 'published', 'archived');
exception when duplicate_object then null; end $$;

-- İçerik türü — kaynak künyesi ve admin paneli bu ayrımı kullanır (§72).
do $$ begin
  create type content_kind as enum (
    'ayah_translation', 'tafsir', 'hadith', 'dua', 'article',
    'religious_day', 'daily_info', 'name_of_allah'
  );
exception when duplicate_object then null; end $$;

-- Yetki rolleri (§72). Uygulama kullanıcısı 'user'; panel rolleri ayrı.
do $$ begin
  create type app_role as enum ('user', 'moderator', 'editor', 'admin');
exception when duplicate_object then null; end $$;

-- Abonelik durumu (§67).
do $$ begin
  create type subscription_status as enum ('none', 'trial', 'active', 'grace', 'expired', 'refunded');
exception when duplicate_object then null; end $$;

-- Topluluk moderasyon durumu (§55).
do $$ begin
  create type moderation_status as enum ('pending', 'approved', 'rejected', 'hidden');
exception when duplicate_object then null; end $$;

-- Namaz vakitleri — beş farz + güneş. Kaza sayaçları yalnız farzları tutar (§41).
do $$ begin
  create type prayer_slot as enum ('fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha');
exception when duplicate_object then null; end $$;
