/**
 * Yerel SQLite şeması — şartname §5.
 *
 * Cihazdaki veritabanı **çevrimdışı çalışmanın temeli**: Kuran metni, dualar,
 * esmâ, zikir kayıtları, kaza sayaçları ve ibadet defteri burada durur.
 * Supabase yalnız yedek ve eşitleme içindir (DECISIONS D6).
 *
 * Kural: uygulanmış bir migration **değiştirilmez**; yeni sürüm eklenir.
 * Aksi hâlde eski kurulumdaki cihaz ile yeni kurulum farklı şemaya sahip olur.
 */

export interface Migration {
  version: number;
  name: string;
  statements: readonly string[];
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'cekirdek',
    statements: [
      `create table if not exists surahs (
         number integer primary key,
         name_ar text not null,
         name_tr text not null,
         meaning_tr text not null,
         ayah_count integer not null,
         revelation text not null,
         page_start integer not null,
         juz_start integer not null
       )`,
      `create table if not exists ayahs (
         id integer primary key,
         surah integer not null,
         ayah integer not null,
         text_uthmani text not null,
         text_simple text not null,
         juz integer not null,
         page integer not null,
         sajda integer not null default 0
       )`,
      `create unique index if not exists ayahs_ref on ayahs (surah, ayah)`,
      `create index if not exists ayahs_page on ayahs (page)`,
      // Meal ve tefsir kaynak lisansı geldiğinde doldurulur; şema şimdiden hazır.
      `create table if not exists translations (
         ayah_id integer not null,
         source text not null,
         language text not null,
         body text not null,
         primary key (ayah_id, source, language)
       )`,
      `create table if not exists bookmarks (
         id text primary key,
         surah integer not null,
         ayah integer not null,
         color text not null default 'emerald',
         label text,
         note text,
         created_at integer not null,
         dirty integer not null default 1
       )`,
      `create table if not exists favorites (
         id text primary key,
         kind text not null,
         record_id text not null,
         collection text,
         created_at integer not null,
         dirty integer not null default 1
       )`,
      `create unique index if not exists favorites_ref on favorites (kind, record_id)`,
      `create table if not exists dhikr_sessions (
         id text primary key,
         title text not null,
         count integer not null,
         target integer not null,
         on_date text not null,
         created_at integer not null,
         dirty integer not null default 1
       )`,
      `create index if not exists dhikr_by_date on dhikr_sessions (on_date)`,
      `create table if not exists qada_counters (
         slot text primary key,
         remaining integer not null default 0,
         updated_at integer not null,
         dirty integer not null default 1
       )`,
      `create table if not exists worship_log (
         on_date text primary key,
         entries text not null,
         note text,
         updated_at integer not null,
         dirty integer not null default 1
       )`,
      `create table if not exists prayer_cache (
         key text primary key,
         payload text not null,
         stored_at integer not null
       )`,
    ],
  },
  {
    version: 2,
    name: 'arama',
    statements: [
      // FTS5 ile Türkçe/Arapça arama (§35, §51, §78). `text_simple` haresizdir.
      `create virtual table if not exists ayah_search using fts5(
         text_simple, body, surah unindexed, ayah unindexed, tokenize = 'unicode61 remove_diacritics 2'
       )`,
      `create table if not exists duas (
         id text primary key,
         category text not null,
         title_tr text not null,
         text_ar text,
         transliteration text,
         meaning_tr text not null,
         reference text not null,
         sort_order integer not null default 0
       )`,
      `create table if not exists names_of_allah (
         ordinal integer primary key,
         name_ar text not null,
         transliteration text not null,
         meaning_tr text not null,
         explanation_tr text
       )`,
    ],
  },
  {
    version: 3,
    name: 'takip',
    statements: [
      `create table if not exists fasting_log (
         on_date text primary key,
         kind text not null,
         completed integer not null default 1,
         note text,
         dirty integer not null default 1
       )`,
      `create table if not exists khatm_progress (
         id text primary key,
         title text not null,
         started_on text not null,
         target_on text,
         completed_juz text not null default '[]',
         is_active integer not null default 1,
         dirty integer not null default 1
       )`,
      `create table if not exists reading_progress (
         id integer primary key check (id = 1),
         surah integer not null,
         ayah integer not null,
         page integer,
         updated_at integer not null
       )`,
    ],
  },
];

export const LATEST_VERSION = MIGRATIONS.reduce((m, x) => Math.max(m, x.version), 0);

/** Verili sürümden sonrasını sırayla döner. */
export function pendingMigrations(
  currentVersion: number,
  list: readonly Migration[] = MIGRATIONS,
): readonly Migration[] {
  return list
    .filter((m) => m.version > currentVersion)
    .slice()
    .sort((a, b) => a.version - b.version);
}

/** Şema bütünlüğü: sürümler 1'den başlayıp birer birer artmalı. */
export function validateMigrations(list: readonly Migration[] = MIGRATIONS): string[] {
  const sorunlar: string[] = [];
  const sirali = list.slice().sort((a, b) => a.version - b.version);
  sirali.forEach((m, i) => {
    if (m.version !== i + 1) sorunlar.push(`sürüm atlaması: ${m.version} (beklenen ${i + 1})`);
    if (m.statements.length === 0) sorunlar.push(`boş migration: ${m.name}`);
  });
  const adlar = new Set(list.map((m) => m.name));
  if (adlar.size !== list.length) sorunlar.push('yinelenen migration adı');
  return sorunlar;
}
