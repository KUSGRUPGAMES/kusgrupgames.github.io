/**
 * Kıraat kaynağı — şartname §32, §33.
 *
 * Ses **paketle dağıtılmaz**, CDN'den akar. Gerekçe:
 * - 6236 âyetlik bir kıraat 500 MB'ın üzerindedir; uygulamaya sığmaz.
 * - Telif okuyucularda kalır; akış ve gömme serbesttir, yeniden yayın değil.
 *   (Islamic Network şartları, Bölüm IV.)
 * - Kullanıcı yalnız dinlediği okuyucuyu ve istediği sureyi indirir.
 *
 * Kullanılmayan kaynak: QuranicAudio.com — şartlarında **ticari kullanım
 * açıkça yasak** ("you may not use these files for commercial purposes").
 * Bu uygulama abonelikli olduğu için oradan ses alınmaz.
 */

export interface Reciter {
  id: string;
  name: string;
  englishName: string;
  bitrates: number[];
  style: 'murattal' | 'mucevved';
}

export interface ReciterCatalog {
  cdn: string;
  source: { name: string; url: string; terms: string; note: string };
  probedAt: string;
  reciters: Reciter[];
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const catalog: ReciterCatalog = require('../../../assets/quran/reciters.json');

export const RECITERS: readonly Reciter[] = catalog.reciters;
export const AUDIO_SOURCE = catalog.source;
export const DEFAULT_RECITER = 'ar.alafasy';

export function getReciter(id: string): Reciter | undefined {
  return RECITERS.find((r) => r.id === id);
}

/** İstenen bit hızı yoksa okuyucunun sahip olduğu en yükseğe düşülür. */
export function resolveBitrate(reciter: Reciter, preferred: number): number {
  if (reciter.bitrates.includes(preferred)) return preferred;
  return Math.max(...reciter.bitrates);
}

/**
 * Âyetin CDN adresi. `globalAyah` mushaf sırasındaki 1 tabanlı numaradır
 * (Fâtiha 1 = 1, Bakara 255 = 262, son âyet = 6236) — CDN'in numaralaması
 * bizimkiyle birebir aynı, ölçülerek doğrulandı.
 */
export function ayahAudioUrl(reciterId: string, globalAyah: number, preferredBitrate = 128): string | null {
  const reciter = getReciter(reciterId);
  if (!reciter) return null;
  if (!Number.isInteger(globalAyah) || globalAyah < 1 || globalAyah > 6236) return null;
  const bit = resolveBitrate(reciter, preferredBitrate);
  return `${catalog.cdn}/${bit}/${reciter.id}/${globalAyah}.mp3`;
}

/** Bir surenin bütün âyetlerinin adresleri — indirme için. */
export function surahAudioUrls(
  reciterId: string,
  firstGlobalAyah: number,
  ayahCount: number,
  preferredBitrate = 128,
): string[] {
  const out: string[] = [];
  for (let i = 0; i < ayahCount; i++) {
    const url = ayahAudioUrl(reciterId, firstGlobalAyah + i, preferredBitrate);
    if (url) out.push(url);
  }
  return out;
}

/** Kaba boyut tahmini: 128 kbps'de âyet başına ~120 KB, 64'te yarısı. */
export function estimateBytes(ayahCount: number, bitrate: number): number {
  const ayahBytes = bitrate >= 128 ? 120 * 1024 : 62 * 1024;
  return Math.max(0, Math.round(ayahCount * ayahBytes));
}
