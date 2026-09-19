/**
 * Kur'an veri erişimi — şartname §27, §35.
 *
 * Metin paket içinde gelir (`assets/quran/quran.json`) ve **çevrimdışı**
 * çalışır. Paket ilk erişimde yüklenir ve bellekte indekslenir; uygulama
 * açılışını yavaşlatmamak için önceden yüklenmez.
 */
import { verifyAyahs, verifyTranslation, type AyahRecord, type SurahMeta } from './verify';

export type { SurahMeta, AyahRecord };
import { arabicIncludes, normalizeArabic } from './arabic';
import { normalizeSearch } from '@/features/location/normalize';
import { logger } from '@/lib/log';

const log = logger('quran');

export interface QuranAyah extends AyahRecord {
  page: number;
  juz: number;
  sajda: boolean;
}

export interface QuranSource {
  name: string;
  url: string;
  text: string;
  note: string;
  metadataLicense: string;
}

interface QuranPackage {
  source: QuranSource;
  checksum: string;
  surahs: SurahMeta[];
  ayahs: QuranAyah[];
}

interface QuranIndex {
  source: QuranSource;
  checksum: string;
  surahs: SurahMeta[];
  ayahs: QuranAyah[];
  bySurah: Map<number, QuranAyah[]>;
  byPage: Map<number, QuranAyah[]>;
  byJuz: Map<number, QuranAyah[]>;
  /** Arama için normalize edilmiş metin — bir kez hesaplanır. */
  normalized: string[];
}

let index: QuranIndex | null = null;

/** Paketi yükler ve indeksler. Bozuk paket yüklenmez. */
export function loadQuran(pkg?: QuranPackage): QuranIndex {
  if (index) return index;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const paket: QuranPackage = pkg ?? require('../../../assets/quran/quran.json');

  const dogrulama = verifyAyahs(paket.ayahs, paket.surahs);
  if (!dogrulama.ok) {
    // Bozuk mushaf metni gösterilmez. Bu, uygulamanın düşmesi pahasına da olsa
    // uyulan tek kuraldır (CONTENT_SOURCES kuralı 1).
    log.error('Kur’an paketi doğrulamadan geçmedi', { problems: dogrulama.problems });
    throw new Error('Kur’an paketi doğrulanamadı');
  }

  const bySurah = new Map<number, QuranAyah[]>();
  const byPage = new Map<number, QuranAyah[]>();
  const byJuz = new Map<number, QuranAyah[]>();
  const normalized: string[] = new Array(paket.ayahs.length);

  paket.ayahs.forEach((a, i) => {
    (bySurah.get(a.surah) ?? bySurah.set(a.surah, []).get(a.surah)!).push(a);
    (byPage.get(a.page) ?? byPage.set(a.page, []).get(a.page)!).push(a);
    (byJuz.get(a.juz) ?? byJuz.set(a.juz, []).get(a.juz)!).push(a);
    normalized[i] = normalizeArabic(a.text);
  });

  index = {
    source: paket.source,
    checksum: paket.checksum,
    surahs: paket.surahs,
    ayahs: paket.ayahs,
    bySurah,
    byPage,
    byJuz,
    normalized,
  };
  return index;
}

/** Sınamalarda durumu sıfırlamak için. */
export function resetQuran(): void {
  index = null;
}

export function getSurahs(): readonly SurahMeta[] {
  return loadQuran().surahs;
}

export function getSurah(number: number): SurahMeta | undefined {
  return loadQuran().surahs.find((s) => s.number === number);
}

export function getSurahAyahs(number: number): readonly QuranAyah[] {
  return loadQuran().bySurah.get(number) ?? [];
}

export function getPageAyahs(page: number): readonly QuranAyah[] {
  return loadQuran().byPage.get(page) ?? [];
}

export function getJuzAyahs(juz: number): readonly QuranAyah[] {
  return loadQuran().byJuz.get(juz) ?? [];
}

export function getAyah(surah: number, ayah: number): QuranAyah | undefined {
  return loadQuran().bySurah.get(surah)?.find((a) => a.ayah === ayah);
}

/**
 * Bir âyetin mushaf sırasındaki 1 tabanlı küresel numarası (Fâtiha 1 = 1,
 * Bakara 255 = 262, son âyet = 6236). Kıraat CDN'i bu numarayı kullanır.
 */
export function globalAyahNumber(surah: number, ayah: number): number | null {
  const idx = loadQuran();
  const i = idx.ayahs.findIndex((a) => a.surah === surah && a.ayah === ayah);
  return i < 0 ? null : i + 1;
}

/** Bir surenin ilk âyetinin küresel numarası. */
export function surahFirstGlobalAyah(surah: number): number | null {
  return globalAyahNumber(surah, 1);
}

/** Mushaftaki toplam âyet sayısı — günün âyeti seçimi için. */
export function getQuranIndexSize(): number {
  return loadQuran().ayahs.length;
}

/** Mushaf sırasındaki i. âyet (0 tabanlı), sure adıyla birlikte. */
export function getAyahByIndex(i: number): (QuranAyah & { surahName: string }) | null {
  const idx = loadQuran();
  const a = idx.ayahs[i];
  if (!a) return null;
  return { ...a, surahName: idx.surahs[a.surah - 1]?.nameTr ?? '' };
}

/** Mushaf sırasındaki i. âyetin meali. */
export function getTranslationByIndex(i: number, id: TranslationId = DEFAULT_TRANSLATION): string | null {
  return loadTranslation(id).rows[i] ?? null;
}

export function getSource(): QuranSource {
  return loadQuran().source;
}

/** Cüz listesi: her cüzün başladığı sure ve âyet. */
export function getJuzStarts(): { juz: number; surah: number; ayah: number }[] {
  const idx = loadQuran();
  const out: { juz: number; surah: number; ayah: number }[] = [];
  for (let j = 1; j <= 30; j++) {
    const ilk = idx.byJuz.get(j)?.[0];
    if (ilk) out.push({ juz: j, surah: ilk.surah, ayah: ilk.ayah });
  }
  return out;
}

export interface SearchHit {
  ayah: QuranAyah;
  surahName: string;
}

/**
 * Arapça metinde arama (§35). Meal araması lisans geldiğinde eklenecek;
 * o zamana kadar arama yalnız mushaf metni üzerindedir ve arayüzde böyle yazar.
 */
export function searchArabic(query: string, limit = 50): SearchHit[] {
  const q = normalizeArabic(query);
  if (q.length < 2) return [];
  const idx = loadQuran();
  const out: SearchHit[] = [];
  for (let i = 0; i < idx.ayahs.length && out.length < limit; i++) {
    if (idx.normalized[i]?.includes(q)) {
      const a = idx.ayahs[i]!;
      out.push({ ayah: a, surahName: idx.surahs[a.surah - 1]?.nameTr ?? '' });
    }
  }
  return out;
}

export { arabicIncludes, normalizeArabic };

// ---------------------------------------------------------------- meal

export interface TranslationInfo {
  id: string;
  name: string;
  language: string;
  work: string;
  years: string;
  rights: string;
  rightsNote: string;
  source: { name: string; url: string };
}

interface TranslationPackage extends TranslationInfo {
  checksum: string;
  /** Mushaf sırasında 6236 satır. */
  rows: string[];
}

interface TranslationIndex {
  info: TranslationInfo;
  rows: string[];
  /** Arama için normalize edilmiş satırlar. */
  normalized: string[];
}

const translations = new Map<string, TranslationIndex>();

/** Uygulamada bulunan mealler. Yeni meal eklemek buraya bir satır yazmaktır. */
export const AVAILABLE_TRANSLATIONS = ['tr-yazir'] as const;

/**
 * Meal paketleri. Metro dinamik `require` çözemez (şablon dizgili çağrı
 * paket derlemede patlar), bu yüzden her meal burada **adıyla** durur.
 * Yeni meal eklemek buraya bir satır yazmaktır.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const TRANSLATION_ASSETS: Record<string, unknown> = {
  'tr-yazir': require('../../../assets/quran/translations/tr-yazir.json'),
};
/* eslint-enable @typescript-eslint/no-require-imports */
export type TranslationId = (typeof AVAILABLE_TRANSLATIONS)[number];

export const DEFAULT_TRANSLATION: TranslationId = 'tr-yazir';

/**
 * Meali yükler ve doğrular. Bozuk meal yüklenmez: eksik satırlı bir meal,
 * kullanıcıya "bu âyetin anlamı yok" demek olur.
 */
export function loadTranslation(id: TranslationId, pkg?: TranslationPackage): TranslationIndex {
  const mevcut = translations.get(id);
  if (mevcut) return mevcut;

  const paket: TranslationPackage = pkg ?? (TRANSLATION_ASSETS[id] as TranslationPackage);
  const quran = loadQuran();

  const satirlar = paket.rows.map((body, i) => {
    const a = quran.ayahs[i];
    return { surah: a?.surah ?? 0, ayah: a?.ayah ?? 0, body };
  });
  const dogrulama = verifyTranslation(satirlar, quran.surahs);
  if (!dogrulama.ok) {
    log.error('meal paketi doğrulamadan geçmedi', { id, problems: dogrulama.problems });
    throw new Error('Meal paketi doğrulanamadı');
  }

  const index: TranslationIndex = {
    info: {
      id: paket.id, name: paket.name, language: paket.language, work: paket.work,
      years: paket.years, rights: paket.rights, rightsNote: paket.rightsNote,
      source: paket.source,
    },
    rows: paket.rows,
    normalized: paket.rows.map((r) => normalizeSearch(r)),
  };
  translations.set(id, index);
  return index;
}

export function resetTranslations(): void {
  translations.clear();
}

export function getTranslationInfo(id: TranslationId = DEFAULT_TRANSLATION): TranslationInfo {
  return loadTranslation(id).info;
}

/** Bir âyetin meali. Meal yoksa null — uydurulmaz. */
export function getTranslation(surah: number, ayah: number, id: TranslationId = DEFAULT_TRANSLATION): string | null {
  const quran = loadQuran();
  const i = quran.ayahs.findIndex((a) => a.surah === surah && a.ayah === ayah);
  if (i < 0) return null;
  return loadTranslation(id).rows[i] ?? null;
}

/** Bir surenin bütün meal satırları, âyet sırasında. */
export function getSurahTranslations(surah: number, id: TranslationId = DEFAULT_TRANSLATION): string[] {
  const quran = loadQuran();
  const t = loadTranslation(id);
  const out: string[] = [];
  quran.ayahs.forEach((a, i) => {
    if (a.surah === surah) out.push(t.rows[i] ?? '');
  });
  return out;
}

export interface TranslationHit {
  surah: number;
  ayah: number;
  surahName: string;
  body: string;
}

/** Meal içinde arama (§35). Türkçe normalizasyonu ortak katmandan gelir. */
export function searchTranslation(
  query: string,
  limit = 50,
  id: TranslationId = DEFAULT_TRANSLATION,
): TranslationHit[] {
  const q = normalizeSearch(query);
  if (q.length < 3) return [];
  const quran = loadQuran();
  const t = loadTranslation(id);
  const out: TranslationHit[] = [];
  for (let i = 0; i < t.normalized.length && out.length < limit; i++) {
    if (t.normalized[i]?.includes(q)) {
      const a = quran.ayahs[i];
      if (!a) continue;
      out.push({
        surah: a.surah,
        ayah: a.ayah,
        surahName: quran.surahs[a.surah - 1]?.nameTr ?? '',
        body: t.rows[i] ?? '',
      });
    }
  }
  return out;
}
