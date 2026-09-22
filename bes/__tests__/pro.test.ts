import {
  entitlementsFor, limitFor, checkLimit, isLocked, FREE_LIMITS, ALWAYS_FREE,
} from '@/features/pro/entitlements';
import {
  shouldShowAd, canShowInterstitial, AD_FREE_SURFACES, BLOCKED_AD_CATEGORIES,
  MAX_AD_CONTENT_RATING, QUIET_BEFORE_MINUTES, QUIET_AFTER_MINUTES,
  MIN_INTERSTITIAL_GAP_SECONDS, type AdSurface,
} from '@/features/pro/ads';

describe('abonelik hakları', () => {
  it('ücretsiz ve süresi dolmuş kullanıcıda Pro kapalı', () => {
    expect(entitlementsFor('free').pro).toBe(false);
    expect(entitlementsFor('expired').pro).toBe(false);
  });

  it('deneme, etkin ve ödeme bekleyen durumda Pro açık', () => {
    expect(entitlementsFor('trial').pro).toBe(true);
    expect(entitlementsFor('active').pro).toBe(true);
    // Ödeme sorunu mağazada çözülürken erişim kesilmez.
    expect(entitlementsFor('grace').pro).toBe(true);
  });
});

describe('ücretsiz katman sınırları', () => {
  it('Pro sınırsızdır', () => {
    for (const key of Object.keys(FREE_LIMITS) as (keyof typeof FREE_LIMITS)[]) {
      expect(limitFor(key, true)).toBe(Number.POSITIVE_INFINITY);
      expect(checkLimit(key, 9999, true).allowed).toBe(true);
    }
  });

  it('sınıra kadar izin verilir, sınırda Pro çağrısı çıkar', () => {
    expect(checkLimit('locations', 2, false).allowed).toBe(true);
    const sinirda = checkLimit('locations', FREE_LIMITS.locations, false);
    expect(sinirda.allowed).toBe(false);
    expect(sinirda.needsPro).toBe(true);
  });

  it('Pro kullanıcıda Pro çağrısı gösterilmez', () => {
    expect(checkLimit('locations', 100, true).needsPro).toBe(false);
  });

  it('ibadetin kendisi hiçbir zaman kilitlenmez', () => {
    for (const ozellik of ALWAYS_FREE) {
      expect({ ozellik, kilitli: isLocked(ozellik, false) }).toEqual({ ozellik, kilitli: false });
    }
  });

  it('çoğaltıcı özellikler ücretsizde kilitlidir', () => {
    for (const ozellik of ['allReciters', 'unlimitedDownloads', 'noAds', 'widgets'] as const) {
      expect(isLocked(ozellik, false)).toBe(true);
      expect(isLocked(ozellik, true)).toBe(false);
    }
  });
});

describe('reklam kuralları', () => {
  const temel = { surface: 'home' as AdSurface, pro: false, secondsToNextPrayer: 9999, secondsSincePrayer: 9999 };

  it('Pro kullanıcıya reklam gösterilmez', () => {
    expect(shouldShowAd({ ...temel, pro: true })).toEqual({ show: false, reason: 'pro' });
  });

  it('okuyucu, kıble, zikir ve rehberde reklam yoktur', () => {
    for (const surface of AD_FREE_SURFACES) {
      expect(shouldShowAd({ ...temel, surface })).toEqual({ show: false, reason: 'surface' });
    }
  });

  it('vaktin girmesine az kala reklam durur', () => {
    expect(shouldShowAd({ ...temel, secondsToNextPrayer: QUIET_BEFORE_MINUTES * 60 }).show).toBe(false);
    expect(shouldShowAd({ ...temel, secondsToNextPrayer: QUIET_BEFORE_MINUTES * 60 + 1 }).show).toBe(true);
  });

  it('vakit girdikten sonra bir süre reklam durur', () => {
    expect(shouldShowAd({ ...temel, secondsSincePrayer: QUIET_AFTER_MINUTES * 60 }).show).toBe(false);
    expect(shouldShowAd({ ...temel, secondsSincePrayer: QUIET_AFTER_MINUTES * 60 + 1 }).show).toBe(true);
  });

  it('vakit bilgisi yoksa reklam kuralı engellemez', () => {
    expect(shouldShowAd({ ...temel, secondsToNextPrayer: null, secondsSincePrayer: null }).show).toBe(true);
  });

  it('uygun koşulda reklam gösterilir', () => {
    expect(shouldShowAd(temel)).toEqual({ show: true });
  });

  it('tam ekran reklamlar arasında en az üç dakika olur', () => {
    const simdi = 1_000_000_000;
    expect(canShowInterstitial(null, simdi)).toBe(true);
    expect(canShowInterstitial(simdi - (MIN_INTERSTITIAL_GAP_SECONDS - 1) * 1000, simdi)).toBe(false);
    expect(canShowInterstitial(simdi - MIN_INTERSTITIAL_GAP_SECONDS * 1000, simdi)).toBe(true);
  });

  it('engellenen kategoriler ve yaş derecesi tanımlıdır', () => {
    expect(BLOCKED_AD_CATEGORIES.length).toBeGreaterThan(8);
    for (const k of ['alcohol', 'gambling', 'dating', 'religion'] as const) {
      expect(BLOCKED_AD_CATEGORIES).toContain(k);
    }
    expect(MAX_AD_CONTENT_RATING).toBe('G');
  });
});
