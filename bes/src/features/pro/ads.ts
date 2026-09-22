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
  | 'reader' | 'qibla' | 'dhikr' | 'prayerGuide' | 'ramadan';

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
