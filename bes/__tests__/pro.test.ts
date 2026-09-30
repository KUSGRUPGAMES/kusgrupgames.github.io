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

describe('Pro kapıları (D33)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const g = require('@/features/pro/gates') as typeof import('@/features/pro/gates');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LESSONS } = require('@/features/learn/course') as typeof import('@/features/learn/course');

  it('ilk üç ünite herkese açık, sonrası Pro', () => {
    expect([1, 2, 3].every(g.isLessonFree)).toBe(true);
    expect([4, 5, 6, 7].some(g.isLessonFree)).toBe(false);
    // Harfleri öğrenmek hiçbir zaman ücretli değil.
    expect(LESSONS.filter((l) => l.id.startsWith('harf-')).every((l) => g.isLessonFree(l.unit))).toBe(true);
    expect(LESSONS.filter((l) => g.isLessonFree(l.unit)).length).toBeGreaterThanOrEqual(10);
  });

  it('toplulukta okumak/katılmak ücretsiz; yazmak, kurmak ve 5 istek Pro', () => {
    expect(g.communityLimits(false)).toEqual({ duaRequestsPerDay: 1, canChat: false, canCreateKhatm: false });
    expect(g.communityLimits(true)).toEqual({ duaRequestsPerDay: 5, canChat: true, canCreateKhatm: true });
  });

  it('dua isteği sayımı sunucuyla aynı: kayan 24 saat', () => {
    const simdi = Date.parse('2026-09-30T12:00:00Z');
    const kayitlar = ['2026-09-30T11:00:00Z', '2026-09-29T12:30:00Z', '2026-09-29T11:59:00Z'];
    expect(g.countInLast24h(kayitlar, simdi)).toBe(2);
  });
});

describe('vakit penceresi (reklam kuralı)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prayerWindow, scheduleInputFrom } = require('@/features/prayer/window') as typeof import('@/features/prayer/window');
  const istanbul = scheduleInputFrom(
    { latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
    { method: 'diyanet', asrShadow: 1, adjustments: {} },
  );

  it('konum yoksa pencere bilinmez', () => {
    expect(prayerWindow(null)).toEqual({ secondsToNextPrayer: null, secondsSincePrayer: null });
  });

  it('sıradaki vakte kalan ve içindeki vaktin geçen süresi hesaplanır', () => {
    const w = prayerWindow(istanbul, new Date('2026-09-30T10:00:00Z')); // 13:00 İstanbul
    expect(w.secondsToNextPrayer).not.toBeNull();
    expect(w.secondsSincePrayer).not.toBeNull();
    expect(w.secondsToNextPrayer!).toBeGreaterThan(0);
    expect(w.secondsSincePrayer!).toBeGreaterThanOrEqual(0);
    // Öğle 13:00 civarı: ya yeni girdi ya birazdan girecek — ikisinden biri 1 saatin altında.
    expect(Math.min(w.secondsToNextPrayer!, w.secondsSincePrayer!)).toBeLessThan(3600);
  });
});

describe('reklam birimi seçimi (AdMob politikası)', () => {
  it('geliştirme derlemesi gerçek birim tanımlı olsa bile test birimini kullanır', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const kod = readFileSync(require.resolve('../src/features/pro/adsRuntime.ts'), 'utf8');
    const govde = kod.slice(kod.indexOf('function birim('), kod.indexOf('export const BANNER_UNIT'));
    // İlk karar __DEV__: gerçek kimliğe bakılmadan test birimi döner.
    const karar = 'if (__DEV__ || !MAGAZA_DERLEMESI) return test;';
    expect(govde.indexOf(karar)).toBeGreaterThan(-1);
    expect(govde.indexOf(karar)).toBeLessThan(govde.indexOf('const gercek'));
    // Bağımsız geliştirme derlemesinde __DEV__ false; varyant ayrıca bakılmalı.
    expect(kod).toMatch(/variant === 'production'/);
  });
});

describe('açılış reklamı ve ödüllü reklam (D33 devamı)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const a = require('@/features/pro/ads') as typeof import('@/features/pro/ads');
  const SAAT = 60 * 60 * 1000;
  const temel = { sessions: 10, lastShownAt: null, now: 100 * SAAT, sinceLaunchMs: 1000, allowed: true };

  it('ilk üç açılışta yok, sonra var', () => {
    expect(a.shouldShowAppOpen({ ...temel, sessions: 3 })).toBe(false);
    expect(a.shouldShowAppOpen({ ...temel, sessions: 4 })).toBe(true);
  });

  it('en sık dört saatte bir', () => {
    expect(a.shouldShowAppOpen({ ...temel, lastShownAt: temel.now - 3 * SAAT })).toBe(false);
    expect(a.shouldShowAppOpen({ ...temel, lastShownAt: temel.now - 4 * SAAT })).toBe(true);
  });

  it('geç yüklenen reklam gösterilmez; Pro ya da vakit penceresi engeller', () => {
    expect(a.shouldShowAppOpen({ ...temel, sinceLaunchMs: 5000 })).toBe(false);
    expect(a.shouldShowAppOpen({ ...temel, allowed: false })).toBe(false);
  });

  it('ödül 24 saat reklamsızlık verir, süre dolunca biter', () => {
    const bitis = a.rewardAdFreeUntil(0);
    expect(a.isAdFree(bitis, 23 * SAAT)).toBe(true);
    expect(a.isAdFree(bitis, 24 * SAAT)).toBe(false);
    expect(a.isAdFree(null, 0)).toBe(false);
  });
});
