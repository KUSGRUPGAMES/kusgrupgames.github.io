/**
 * Reklam yerleşim kuralları — şartname §68.
 *
 * Bu ürün bir ibadet uygulamasıdır; reklam, ibadetin önüne geçemez. Kurallar
 * kod düzeyinde zorlanır, tasarımcı nezaketine bırakılmaz:
 *
 * 1. **Vakte yakın reklam gösterilmez.** Vaktin girmesine az kalmışken ya da
 *    yeni girmişken tam ekran reklam açmak, kullanıcıyı namazdan alıkoyar.
 * 2. **Kutsal metnin üstünde reklam olmaz.** Okuyucu, kıble ve zikir
 *    ekranlarında reklam yoktur.
 * 3. **Pro kullanıcıya reklam gösterilmez.**
 * 4. **Uygunsuz kategoriler engellenir** ve yaş derecesi G'ye sabitlenir.
 */

export type AdSurface =
  | 'home' | 'explore' | 'profile' | 'quranList' | 'settings'
  | 'reader' | 'qibla' | 'dhikr' | 'prayerGuide' | 'ramadan' | 'learn';

/** Reklam **hiçbir koşulda** gösterilmeyen ekranlar. */
export const AD_FREE_SURFACES: readonly AdSurface[] = [
  'reader', 'qibla', 'dhikr', 'prayerGuide',
];

/** Vaktin girmesine bu kadar dakika kala reklam durur. */
export const QUIET_BEFORE_MINUTES = 15;
/** Vakit girdikten sonra bu kadar dakika reklam durur. */
export const QUIET_AFTER_MINUTES = 30;

export interface AdContext {
  surface: AdSurface;
  pro: boolean;
  /** Sıradaki vakte kalan saniye; bilinmiyorsa null. */
  secondsToNextPrayer: number | null;
  /** İçinde bulunulan vaktin girmesinden bu yana geçen saniye; bilinmiyorsa null. */
  secondsSincePrayer: number | null;
}

export type AdDecision =
  | { show: true }
  | { show: false; reason: 'pro' | 'surface' | 'prayerWindow' };

export function shouldShowAd(ctx: AdContext): AdDecision {
  if (ctx.pro) return { show: false, reason: 'pro' };
  if (AD_FREE_SURFACES.includes(ctx.surface)) return { show: false, reason: 'surface' };

  if (ctx.secondsToNextPrayer !== null && ctx.secondsToNextPrayer <= QUIET_BEFORE_MINUTES * 60) {
    return { show: false, reason: 'prayerWindow' };
  }
  if (ctx.secondsSincePrayer !== null && ctx.secondsSincePrayer <= QUIET_AFTER_MINUTES * 60) {
    return { show: false, reason: 'prayerWindow' };
  }

  return { show: true };
}

/**
 * Engellenen reklam kategorileri. Mağaza konsolunda da işaretlenir; burada
 * olması, istemci tarafında da istenmesi içindir (§68).
 */
export const BLOCKED_AD_CATEGORIES = [
  'alcohol', 'gambling', 'dating', 'politics', 'religion',
  'sexual', 'weapons', 'tobacco', 'drugs', 'cosmeticSurgery', 'astrology',
] as const;

/** Yaş derecesi: G (herkes). Daha yükseği bu üründe kabul edilmez. */
export const MAX_AD_CONTENT_RATING = 'G' as const;

/** Tam ekran reklamlar arasında en az bu kadar saniye geçmeli. */
export const MIN_INTERSTITIAL_GAP_SECONDS = 180;

export function canShowInterstitial(lastShownAt: number | null, now: number): boolean {
  if (lastShownAt === null) return true;
  return (now - lastShownAt) / 1000 >= MIN_INTERSTITIAL_GAP_SECONDS;
}

// --- Açılış reklamı (App Open) — D33 devamı, kullanıcı kararı 1 Ekim

/** Açılış reklamları arasında en az bu kadar süre. */
export const APP_OPEN_GAP_MS = 4 * 60 * 60 * 1000;
/** İlk bu kadar açılışta açılış reklamı yok: yeni kullanıcı uygulamayı önce tanısın. */
export const APP_OPEN_GRACE_SESSIONS = 3;
/**
 * Reklam bu sürede yüklenemediyse o açılışta gösterilmez: kullanıcı vakitleri
 * okumaya başlamışken önüne çıkan reklam Google'ın açılış reklamı kuralına
 * aykırı (reklam yükleme ekranında gösterilmeli, sonradan değil).
 */
export const APP_OPEN_MAX_WAIT_MS = 4000;

export interface AppOpenContext {
  /** Bu açılış dahil toplam açılış sayısı. */
  sessions: number;
  lastShownAt: number | null;
  now: number;
  /** Açılışın başlangıcından bu yana geçen süre. */
  sinceLaunchMs: number;
  /** `shouldShowAd({ surface: 'home', ... })` sonucu: Pro, vakit penceresi. */
  allowed: boolean;
}

export function shouldShowAppOpen(c: AppOpenContext): boolean {
  if (!c.allowed) return false;
  if (c.sessions <= APP_OPEN_GRACE_SESSIONS) return false;
  if (c.sinceLaunchMs > APP_OPEN_MAX_WAIT_MS) return false;
  return c.lastShownAt === null || c.now - c.lastShownAt >= APP_OPEN_GAP_MS;
}

// --- Ödüllü reklam: izleyene 24 saat reklamsız

export const REWARD_AD_FREE_MS = 24 * 60 * 60 * 1000;

/** Ödül alındı: reklamsızlık bitişi. Süre üst üste eklenmez, yenilenir. */
export function rewardAdFreeUntil(now: number): number {
  return now + REWARD_AD_FREE_MS;
}

export function isAdFree(adFreeUntil: number | null, now: number): boolean {
  return adFreeUntil !== null && now < adFreeUntil;
}
