/**
 * Kur'an metni doğrulaması — şartname §74.
 *
 * Kural (CONTENT_SOURCES 1): mushaf metni ezberden dizilmez, yalnız
 * doğrulanmış kaynaktan içe aktarılır ve **içe aktarma sonrası doğrulanır.**
 * Buradaki işlevler saf mantıktır; hem içe aktarma betiği hem de uygulamanın
 * ilk açılıştaki yükleyicisi aynı denetimden geçer.
 *
 * Denetlenen değişmezler:
 * - 114 sure, toplam 6236 âyet.
 * - Her surenin âyet sayısı meta veriyle birebir aynı.
 * - Âyet numaraları 1'den başlar ve boşluksuz artar.
 * - Hiçbir âyet metni boş değildir ve Arapça harf içerir.
 * - Metnin sağlaması (checksum) beklenen değerle aynıdır.
 */

export const SURAH_COUNT = 114;
export const AYAH_COUNT = 6236;
export const PAGE_COUNT = 604;
export const JUZ_COUNT = 30;

export interface AyahRecord {
  surah: number;
  ayah: number;
  text: string;
}

export interface SurahMeta {
  number: number;
  ayahCount: number;
  nameAr: string;
  nameTr: string;
  nameEn: string;
  revelation: 'mekki' | 'medeni';
  pageStart: number;
  juzStart: number;
}

const ARABIC = /[؀-ۿ]/;

export interface VerifyResult {
  ok: boolean;
  problems: string[];
}

export function verifyAyahs(ayahs: readonly AyahRecord[], surahs: readonly SurahMeta[]): VerifyResult {
  const problems: string[] = [];

  if (surahs.length !== SURAH_COUNT) {
    problems.push(`sure sayısı ${surahs.length}, beklenen ${SURAH_COUNT}`);
  }
  if (ayahs.length !== AYAH_COUNT) {
    problems.push(`âyet sayısı ${ayahs.length}, beklenen ${AYAH_COUNT}`);
  }

  const metaToplam = surahs.reduce((t, s) => t + s.ayahCount, 0);
  if (surahs.length === SURAH_COUNT && metaToplam !== AYAH_COUNT) {
    problems.push(`meta veri toplamı ${metaToplam}, beklenen ${AYAH_COUNT}`);
  }

  const sayac = new Map<number, number>();
  let oncekiSure = 0;
  let oncekiAyet = 0;

  for (const a of ayahs) {
    if (!Number.isInteger(a.surah) || a.surah < 1 || a.surah > SURAH_COUNT) {
      problems.push(`geçersiz sure numarası: ${a.surah}`);
      continue;
    }
    if (!Number.isInteger(a.ayah) || a.ayah < 1) {
      problems.push(`geçersiz âyet numarası: ${a.surah}:${a.ayah}`);
      continue;
    }
    if (a.text.trim().length === 0) {
      problems.push(`boş âyet metni: ${a.surah}:${a.ayah}`);
    } else if (!ARABIC.test(a.text)) {
      problems.push(`Arapça harf içermiyor: ${a.surah}:${a.ayah}`);
    }

    // Sıra: aynı surede numaralar birer birer artmalı, sure değişince 1'e dönmeli.
    if (a.surah === oncekiSure) {
      if (a.ayah !== oncekiAyet + 1) {
        problems.push(`âyet sırası bozuk: ${a.surah}:${a.ayah} (önceki ${oncekiAyet})`);
      }
    } else if (a.surah === oncekiSure + 1) {
      if (a.ayah !== 1) problems.push(`sure ${a.surah} 1. âyetle başlamıyor`);
    } else if (oncekiSure !== 0) {
      problems.push(`sure sırası bozuk: ${oncekiSure} sonrası ${a.surah}`);
    }
    oncekiSure = a.surah;
    oncekiAyet = a.ayah;

    sayac.set(a.surah, (sayac.get(a.surah) ?? 0) + 1);
  }

  for (const s of surahs) {
    const bulunan = sayac.get(s.number) ?? 0;
    if (bulunan !== s.ayahCount) {
      problems.push(`sure ${s.number}: ${bulunan} âyet bulundu, meta veride ${s.ayahCount}`);
    }
  }

  return { ok: problems.length === 0, problems: problems.slice(0, 50) };
}

/**
 * Metnin sağlaması. Dış bağımlılık kullanılmaz (React Native'de `crypto`
 * yoktur); FNV-1a 64 bit, iki 32 bitlik yarım üzerinden hesaplanır.
 * Amaç kriptografik güvenlik değil, **içe aktarmada bozulma yakalamak**.
 */
export function checksum(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 + c) >>> 0;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/** Âyet listesinden kararlı bir sağlama üretir (sıra ve metin dahil). */
export function ayahsChecksum(ayahs: readonly AyahRecord[]): string {
  return checksum(ayahs.map((a) => `${a.surah}:${a.ayah}:${a.text}`).join('\n'));
}

// ---------------------------------------------------------------- meal

export interface TranslationRecord {
  surah: number;
  ayah: number;
  body: string;
}

/**
 * Meal doğrulaması — şartname §74.
 *
 * Mushaf metniyle aynı titizlik: eksik ya da boş bir meal satırı, kullanıcıya
 * "bu âyetin anlamı yok" demek olur. Arapça metinden farkı, Arapça harf
 * şartının olmaması ve boş satırın tek başına yeterli sinyal olmasıdır.
 */
export function verifyTranslation(
  rows: readonly TranslationRecord[],
  surahs: readonly SurahMeta[],
): VerifyResult {
  const problems: string[] = [];

  if (rows.length !== AYAH_COUNT) {
    problems.push(`meal satırı ${rows.length}, beklenen ${AYAH_COUNT}`);
  }

  const sayac = new Map<number, number>();
  const gorulen = new Set<string>();

  for (const r of rows) {
    const anahtar = `${r.surah}:${r.ayah}`;
    if (gorulen.has(anahtar)) {
      problems.push(`yinelenen meal satırı: ${anahtar}`);
      continue;
    }
    gorulen.add(anahtar);

    if (!Number.isInteger(r.surah) || r.surah < 1 || r.surah > SURAH_COUNT) {
      problems.push(`geçersiz sure numarası: ${r.surah}`);
      continue;
    }
    if (r.body.trim().length === 0) {
      problems.push(`boş meal: ${anahtar}`);
    }
    sayac.set(r.surah, (sayac.get(r.surah) ?? 0) + 1);
  }

  for (const s of surahs) {
    const bulunan = sayac.get(s.number) ?? 0;
    if (bulunan !== s.ayahCount) {
      problems.push(`sure ${s.number}: ${bulunan} meal satırı, beklenen ${s.ayahCount}`);
    }
  }

  return { ok: problems.length === 0, problems: problems.slice(0, 50) };
}

export function translationChecksum(rows: readonly TranslationRecord[]): string {
  return checksum(rows.map((r) => `${r.surah}:${r.ayah}:${r.body}`).join('\n'));
}
