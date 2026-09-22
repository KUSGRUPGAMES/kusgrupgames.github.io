/**
 * Freemium sınırları — şartname §66.
 *
 * İlke: **ibadetin kendisi hiçbir zaman kilitlenmez.** Namaz vakti, kıble,
 * Kur'an metni, meal, zikir, kaza takibi ve dualar ücretsizdir ve öyle kalır.
 * Pro, ürünü kullanılabilir yapan şeyi değil, **çoğaltan** şeyi açar: sınırsız
 * konum, bütün okuyucular, sınırsız indirme ve reklamsızlık.
 *
 * Bu ayrım pazarlama tercihi değil, ürün kararıdır: bir kişiyi namaz vaktini
 * göremediği için ödemeye zorlamak, bu ürünün var oluş sebebine aykırıdır.
 */

export type ProStatus = 'free' | 'trial' | 'active' | 'grace' | 'expired';

export interface Entitlements {
  status: ProStatus;
  /** Pro ayrıcalıkları etkin mi. */
  pro: boolean;
}

export function entitlementsFor(status: ProStatus): Entitlements {
  // `grace` (ödeme sorunu, mağaza yeniden deniyor) sırasında erişim kesilmez:
  // kullanıcı parasını ödemiş, banka gecikmiş olabilir.
  return { status, pro: status === 'trial' || status === 'active' || status === 'grace' };
}

/** Ücretsiz katman sınırları. */
export const FREE_LIMITS = {
  /** Kayıtlı konum sayısı. */
  locations: 3,
  /** İndirilebilir sure sayısı. */
  downloadedSurahs: 3,
  /** Kullanılabilir okuyucu sayısı (listenin başından). */
  reciters: 3,
  /** Özel hatırlatıcı sayısı. */
  reminders: 3,
  /** Aynı anda etkin hatim sayısı. */
  khatms: 1,
} as const;

export type LimitKey = keyof typeof FREE_LIMITS;

/** Pro'da sınır yok; ücretsizde tablodaki sayı. */
export function limitFor(key: LimitKey, pro: boolean): number {
  return pro ? Number.POSITIVE_INFINITY : FREE_LIMITS[key];
}

export interface LimitCheck {
  allowed: boolean;
  limit: number;
  current: number;
  /** Sınıra ulaşıldıysa Pro çağrısı gösterilir. */
  needsPro: boolean;
}

export function checkLimit(key: LimitKey, current: number, pro: boolean): LimitCheck {
  const limit = limitFor(key, pro);
  const allowed = current < limit;
  return { allowed, limit, current, needsPro: !allowed && !pro };
}

/**
 * Ücretsiz katmanda **asla** kilitlenmeyen yetenekler.
 * Bu liste bir sınamayla korunuyor: biri kilitlenmeye kalkarsa test kırılır.
 */
export const ALWAYS_FREE = [
  'prayerTimes', 'qibla', 'quranText', 'translation', 'dhikr', 'qada',
  'duas', 'names', 'hijri', 'zakat', 'prayerGuide', 'notifications',
] as const;

export type Feature = (typeof ALWAYS_FREE)[number] | 'unlimitedLocations'
  | 'allReciters' | 'unlimitedDownloads' | 'noAds' | 'themes' | 'widgets';

export function isLocked(feature: Feature, pro: boolean): boolean {
  if ((ALWAYS_FREE as readonly string[]).includes(feature)) return false;
  return !pro;
}
