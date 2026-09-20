/**
 * Expo yapılandırması — şartname §7, §90, §96.
 *
 * Burada denetlenenlerin hepsi bir kez gerçekten yanlış çıktı:
 *
 * 1. **İkon hiç yoktu.** `assets/` içinde yalnız yazı tipi ve Kur'an verisi
 *    vardı; TestFlight'a Expo'nun boş yer tutucu ikonuyla build çıkardı.
 *    Aynı hata bu depoda Capacitor tarafında da yaşanmıştı.
 * 2. **Kullanılmayan "Always" konum izni beyan ediliyordu.** expo-location
 *    eklentisi üç anahtarı birden, İngilizce varsayılan metinle yazıyor.
 *    App Review kullanılmayan arka plan konum iznini sorar ve reddeder.
 *
 * Yapılandırma üretilen dosyalara (`ios/`, `android/`) bakılarak denetlenemez:
 * o klasörler depoda durmaz, her derlemede `expo prebuild` ile yeniden üretilir.
 * Bu yüzden **çözülmüş yapılandırmanın kendisi** sınanır.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const KOK = join(__dirname, '..');

type Cozulmus = {
  name?: string;
  icon?: string;
  plugins?: unknown[];
  ios?: { icon?: string; bundleIdentifier?: string; infoPlist?: Record<string, unknown> };
  android?: { package?: string; adaptiveIcon?: { foregroundImage?: string; backgroundColor?: string } };
};

/**
 * `app.config.ts` değişkenini **modül yüklenirken** hesaplar ve düz bir nesne
 * döndürür; Node modülü önbelleğe aldığı için aynı süreçte ikinci bir ortam
 * okunamaz — ilk çağrı neyse hepsi o çıkar. Bu yüzden her ortam kendi alt
 * sürecinde çözülür.
 */
function cozumle(variant: 'development' | 'staging' | 'production'): Cozulmus {
  const cikti = execFileSync(
    process.execPath,
    ['-e', `
      const { getConfig } = require('@expo/config');
      const { exp } = getConfig(process.argv[1], { skipSDKVersionRequirement: true, isPublicConfig: true });
      process.stdout.write(JSON.stringify(exp));
    `, KOK],
    { env: { ...process.env, APP_VARIANT: variant }, encoding: 'utf8', cwd: KOK },
  );
  return JSON.parse(cikti) as Cozulmus;
}

const URETIM = cozumle('production');

/** Eklenti listesinden `[ad, seçenekler]` biçimindeki girdiyi bulur. */
function eklenti(exp: Cozulmus, ad: string): Record<string, unknown> | null {
  for (const p of exp.plugins ?? []) {
    if (Array.isArray(p) && p[0] === ad) return (p[1] ?? {}) as Record<string, unknown>;
    if (p === ad) return {};
  }
  return null;
}

describe('görsel varlıklar', () => {
  const exp = URETIM;

  it('ikon, adaptive ikon, açılış işareti ve favicon dosyaları var', () => {
    for (const dosya of ['icon.png', 'adaptive-icon.png', 'splash-icon.png', 'favicon.png']) {
      expect({ dosya, var: existsSync(join(KOK, 'assets', dosya)) }).toEqual({ dosya, var: true });
    }
  });

  it('yapılandırma ikonları gerçekten gösteriyor', () => {
    expect(exp.icon).toBe('./assets/icon.png');
    expect(exp.ios?.icon).toBe('./assets/icon.png');
    expect(exp.android?.adaptiveIcon?.foregroundImage).toBe('./assets/adaptive-icon.png');
  });

  it('açılış ekranı iki temada da paketin zeminini kullanıyor', () => {
    const splash = eklenti(exp, 'expo-splash-screen');
    expect(splash).not.toBeNull();
    // Açık tema: warmIvory zemin + zümrüt sembol.
    expect(splash?.image).toBe('./assets/brand/splash-icon-light.png');
    expect(splash?.backgroundColor).toBe('#F7F3E8');
    // Koyu tema: deepEmerald zemin + altın sembol. Android maskesiyle aynı
    // renk olmalı, yoksa açılıştan ana ekrana geçerken renk sıçraması olur.
    const koyu = splash?.dark as { image?: string; backgroundColor?: string } | undefined;
    expect(koyu?.image).toBe('./assets/splash-icon.png');
    expect(koyu?.backgroundColor).toBe(exp.android?.adaptiveIcon?.backgroundColor);
  });

  it('Android bildirim ikonu tek renk siluet', () => {
    // Renkli ikon verilirse durum çubuğunda beyaz bir kare görünür.
    const bildirim = eklenti(exp, 'expo-notifications');
    expect(bildirim?.icon).toBe('./assets/brand/notification-icon.png');
    expect(bildirim?.color).toBe('#003F32');
  });
});

describe('iOS izinleri', () => {
  const exp = URETIM;
  const konum = eklenti(exp, 'expo-location');

  it('yalnız "uygulama açıkken" konum izni isteniyor', () => {
    expect(konum).not.toBeNull();
    // `false` anahtarı Info.plist'ten tamamen siler; boş metin bırakmaz.
    expect(konum?.locationAlwaysAndWhenInUsePermission).toBe(false);
    expect(konum?.locationAlwaysPermission).toBe(false);
    expect(konum?.isIosBackgroundLocationEnabled).toBe(false);
    expect(konum?.isAndroidBackgroundLocationEnabled).toBe(false);
  });

  it('izin metinleri Türkçe ve ne için istendiğini söylüyor', () => {
    const metin = String(konum?.locationWhenInUsePermission ?? '');
    expect(metin.length).toBeGreaterThan(40);
    expect(metin).toContain('kıble');
    // İngilizce varsayılan sızmış olmasın.
    expect(metin).not.toContain('Allow');
  });

  it('infoPlist içinde arka plan konum anahtarı kalmamış', () => {
    const plist = (exp.ios?.infoPlist ?? {}) as Record<string, unknown>;
    for (const k of ['NSLocationAlwaysUsageDescription', 'NSLocationAlwaysAndWhenInUseUsageDescription']) {
      expect({ k, var: k in plist }).toEqual({ k, var: false });
    }
  });

  it('kıraat için arka plan sesi açık, başka arka plan kipi yok', () => {
    const modes = (exp.ios?.infoPlist as Record<string, unknown>)?.UIBackgroundModes;
    expect(modes).toEqual(['audio']);
  });
});

describe('ortam ayrımı', () => {
  it('yalnız üretim sürümü gerçek bundle id ve adı alır', () => {
    const uretim = URETIM;
    const gelistirme = cozumle('development');

    expect(uretim.ios?.bundleIdentifier).toBe('com.kusgrup.sukun');
    expect(uretim.android?.package).toBe('com.kusgrup.sukun');
    expect(uretim.name).toBe('BEŞ');

    // Aynı telefonda yan yana durabilsinler.
    expect(gelistirme.ios?.bundleIdentifier).toBe('com.kusgrup.sukun.dev');
    expect(gelistirme.name).toContain('dev');
  });
});
