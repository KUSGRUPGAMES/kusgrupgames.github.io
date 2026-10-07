/**
 * Güvenlik ve gizlilik denetimi — şartname §69, §84, §85, §89.
 *
 * Kaynak kodu tarar. Bu sınamaların hepsi bir kez gerçekten yapılmış ya da
 * yapılması çok kolay hataları hedefler: sırrı kaynağa gömmek, konumu
 * günlüğe yazmak, kişisel veriyi analitiğe göndermek.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';

const ROOT = join(__dirname, '..');

function dosyalar(dir: string, uzantilar = ['.ts', '.tsx']): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(dosyalar(full, uzantilar));
    else if (uzantilar.some((u) => entry.endsWith(u))) out.push(full);
  }
  return out;
}

const kaynaklar = [...dosyalar(join(ROOT, 'src')), ...dosyalar(join(ROOT, 'app'))];
const oku = (p: string) => readFileSync(p, 'utf8');
const kodu = (p: string) => oku(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('sır yönetimi', () => {
  it('kaynakta gömülü anahtar yok', () => {
    const supheli: string[] = [];
    const kaliplar = [
      /\bsk-[A-Za-z0-9]{16,}/,            // OpenAI biçimi
      /\bAIza[0-9A-Za-z_-]{30,}/,          // Google API anahtarı
      /\beyJ[\w-]+\.[\w-]+\.[\w-]{10,}/,   // JWT
      /service_role/i,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    ];
    for (const p of kaynaklar) {
      const s = kodu(p);
      for (const k of kaliplar) if (k.test(s)) supheli.push(`${p} — ${k}`);
    }
    expect(supheli).toEqual([]);
  });

  it('sırlar yalnız güvenli depodan geçer', () => {
    const s = oku(join(ROOT, 'src', 'lib', 'storage', 'secure.ts'));
    expect(s).toContain('SECURE_KEYS');
    // Jetonlar anahtar-değer deposuna yazılmaz.
    const kv = oku(join(ROOT, 'src', 'lib', 'storage', 'kv.ts'));
    expect(kv).not.toMatch(/accessToken|refreshToken/);
  });

  it('.env örneğinde gerçek sır değeri yok', () => {
    const p = join(ROOT, '.env.example');
    if (!existsSync(p)) return;
    // `EXPO_PUBLIC_ENV=development` gibi sır olmayan varsayılanlar serbesttir;
    // anahtar/jeton/parola türü değişkenler **boş** olmalıdır.
    const sirKalibi = /(KEY|SECRET|TOKEN|PASSWORD|PASS|DSN|CREDENTIAL|SERVICE_ROLE)/i;
    for (const satir of oku(p).split('\n')) {
      const t = satir.trim();
      if (!t || t.startsWith('#')) continue;
      const [ad, ...kalan] = t.split('=');
      if (!sirKalibi.test(ad ?? '')) continue;
      const deger = kalan.join('=').trim();
      expect({ satir: t, bos: deger.length === 0 || /^<.*>$/.test(deger) })
        .toEqual({ satir: t, bos: true });
    }
  });

  it('istemciye açık değişken adları yalnız EXPO_PUBLIC ile başlar', () => {
    const p = join(ROOT, '.env.example');
    if (!existsSync(p)) return;
    const sirKalibi = /(KEY|SECRET|TOKEN|PASSWORD|SERVICE_ROLE)/i;
    for (const satir of oku(p).split('\n')) {
      const t = satir.trim();
      if (!t || t.startsWith('#')) continue;
      const ad = (t.split('=')[0] ?? '').trim();
      // Sır niteliğindeki bir değişken EXPO_PUBLIC_ ile başlarsa pakete gömülür.
      // İki bilinen istisna tasarım gereği herkese açık istemci anahtarıdır:
      // Supabase `anon` anahtarı (koruma RLS'te) ve RevenueCat'in "public SDK
      // key"i (appl_/goog_ önekli; satın alma doğrulaması RevenueCat
      // sunucusunda, gizli anahtar hiçbir zaman istemciye girmez).
      const acikIstemciAnahtari = /ANON|^EXPO_PUBLIC_REVENUECAT_(IOS|ANDROID)_KEY$/.test(ad);
      if (ad.startsWith('EXPO_PUBLIC_')) {
        expect({ ad, sir: sirKalibi.test(ad.replace('EXPO_PUBLIC_', '')) && !acikIstemciAnahtari })
          .toEqual({ ad, sir: false });
      }
    }
  });
});

describe('gizlilik', () => {
  it('konum ve kişisel alanlar günlükte maskelenir', () => {
    const s = oku(join(ROOT, 'src', 'lib', 'log', 'redact.ts'));
    for (const alan of ['latitude', 'longitude', 'city', 'email', 'note', 'displayName', 'pushToken']) {
      expect({ alan, var: s.includes(alan) }).toEqual({ alan, var: true });
    }
  });

  it('günlük yolu temizleyiciden geçmeden yazmıyor', () => {
    const s = oku(join(ROOT, 'src', 'lib', 'log', 'index.ts'));
    expect(s).toContain('redact(');
  });

  it('doğrudan console kullanımı günlük katmanıyla sınırlı', () => {
    const disarida: string[] = [];
    for (const p of kaynaklar) {
      if (p.includes(join('lib', 'log'))) continue;
      if (/\bconsole\.(log|info|debug|warn|error)\b/.test(kodu(p))) disarida.push(p);
    }
    expect(disarida).toEqual([]);
  });

  it('analitik açıkça kapalı başlar', () => {
    const s = oku(join(ROOT, 'src', 'lib', 'storage', 'settings.ts'));
    expect(s).toMatch(/analyticsOptIn:\s*z\.boolean\(\)\.default\(false\)/);
  });

  /**
   * D33: reklam artık var (AdMob), ama analitik, izleme ve pazarlama SDK'sı
   * yok. Gizlilik formu ve sayfaları bu ayrımı söylüyor; yeni bir bağımlılık
   * bunu sessizce yalan yapmasın diye liste sınamaya bağlı.
   */
  it('pakette yalnız AdMob var; analitik ya da izleme kütüphanesi yok', () => {
    const pkg = JSON.parse(oku(join(ROOT, 'package.json'))) as {
      dependencies?: Record<string, string>; devDependencies?: Record<string, string>;
    };
    const adlar = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
    const IZINLI = new Set(['react-native-google-mobile-ads']);
    const yasak = /admob|google-mobile-ads|facebook|firebase|analytics|amplitude|mixpanel|segment|sentry|bugsnag|appsflyer|adjust|onesignal|branch|clevertap|posthog/i;
    expect(adlar.filter((a) => yasak.test(a) && !IZINLI.has(a))).toEqual([]);
  });

  it('izleme izni yalnız reklam için, dürüst bir metinle ve yalnız reklam katmanında isteniyor', () => {
    const cfg = oku(join(ROOT, 'app.config.ts'));
    expect(cfg).toMatch(/'expo-tracking-transparency'/);
    // Metin, izin verilmezse hiçbir özelliğin kısıtlanmadığını söylemeli.
    expect(cfg).toMatch(/userTrackingPermission:[\s\S]*?reklam[\s\S]*?kısıtlanmaz/);
    const isteyenler = kaynaklar.filter((p) => /requestTrackingPermissionsAsync\(/.test(kodu(p)));
    expect(isteyenler.map((p) => p.slice(ROOT.length + 1))).toEqual([join('src', 'features', 'pro', 'adsRuntime.ts')]);
  });

  it('reklam içeriği G derecesinde; mağaza derlemesi test kimliğiyle çıkmaz', () => {
    expect(oku(join(ROOT, 'src', 'features', 'pro', 'adsRuntime.ts'))).toMatch(/maxAdContentRating:\s*MaxAdContentRating\.G/);
    const cfg = oku(join(ROOT, 'app.config.ts'));
    expect(cfg).toMatch(/MAGAZA === 'ios'[\s\S]*?ADMOB_TEST\.ios\)[\s\S]*?throw new Error/);
    expect(cfg).toMatch(/MAGAZA === 'android'[\s\S]*?ADMOB_TEST\.android\)[\s\S]*?throw new Error/);
  });

  it('mağaza metinleri reklam ve abonelik konusunda doğruyu söylüyor (D33)', () => {
    // v1.0.0'ın ilk metni "tamamen ücretsiz, reklamsız, abonelik yok" diyordu.
    // Reklam ve Pro geldikten sonra bu cümle kalırsa App Review "metadata
    // uygulamayla uyuşmuyor" diye reddeder; kullanıcı da kandırılmış olur.
    for (const dosya of ['store/app-store.md', 'store/play-store.md']) {
      const metin = oku(join(ROOT, dosya));
      const aciklama = metin.slice(metin.indexOf('## '), metin.indexOf('## Sürüm notları') > 0 ? metin.indexOf('## Sürüm notları') : undefined);
      expect({ dosya, eskiIddia: /REKLAMSIZ|Abonelik yok|reklam yok\./.test(aciklama) }).toEqual({ dosya, eskiIddia: false });
      // Otomatik yenilenen abonelik açıklamada yazılı olmalı (App Review 3.1.2).
      expect({ dosya, yenileme: /kendiliğinden yenilenir/.test(metin) }).toEqual({ dosya, yenileme: true });
    }
  });

  it('ibadet ekranları hiçbir zaman Pro kilidine ya da reklama bağlanmaz (§66, §68, D33)', () => {
    // "İbadetin kendisi kilitlenmez": bu ekranlar ne Pro durumuna bakar ne
    // reklam çizer. Okuyucu, kıble, zikir ve namaz rehberi ayrıca
    // AD_FREE_SURFACES'ta; burada dosya düzeyinde de kapatılıyor.
    const IBADET = ['reader', 'qibla', 'dhikr', 'duas', 'qada', 'zakat', 'names', 'prayer-guide', 'hijri', 'prayer-calendar'];
    const suclular = IBADET.filter((ad) => /usePro|AdBanner|maybeShowInterstitial|ProLock/.test(kodu(join(ROOT, 'app', `${ad}.tsx`))));
    expect(suclular).toEqual([]);
  });

  it('kişisel veri sunucuya gitmiyor — ağ katmanı yalnız içerik kanalında kullanılıyor', () => {
    const agKullananlar = kaynaklar.filter((p) => /from '@\/lib\/net\/request'/.test(kodu(p)));
    const izinli = ['content/channel.ts', 'net/request.ts'];
    for (const p of agKullananlar) {
      expect({ p, izinli: izinli.some((i) => p.endsWith(i.replace('/', sep))) })
        .toEqual({ p, izinli: true });
    }
  });
});

describe('girdi doğrulama', () => {
  it('depodan okunan her şey şemadan geçiyor', () => {
    const s = oku(join(ROOT, 'src', 'boot', 'persistence.ts'));
    expect(s).toContain("from 'zod'");
    for (const anahtar of ['settings', 'locations', 'favorites', 'reading', 'worship']) {
      expect({ anahtar, var: s.includes(anahtar) }).toEqual({ anahtar, var: true });
    }
  });

  it('ağdan gelen içerik şemadan geçiyor', () => {
    expect(oku(join(ROOT, 'src', 'features', 'content', 'channel.ts'))).toContain('contentBundleSchema.parse');
  });

  it('Kur’an ve meal paketleri doğrulanmadan yüklenmiyor', () => {
    const s = oku(join(ROOT, 'src', 'features', 'quran', 'data.ts'));
    expect(s).toContain('verifyAyahs(');
    expect(s).toContain('verifyTranslation(');
  });
});

describe('pil ve izinler', () => {
  it('pusula yalnız etkinken açılıyor', () => {
    const s = oku(join(ROOT, 'src', 'features', 'qibla', 'useCompass.ts'));
    expect(s).toContain('if (!enabled)');
    expect(s).toContain('AppState');
  });

  it('konum sürekli izlenmiyor — tek seferlik okuma', () => {
    const s = oku(join(ROOT, 'src', 'features', 'location', 'device.ts'));
    expect(s).toContain('getCurrentPositionAsync');
    expect(s).not.toContain('watchPositionAsync');
  });

  it('geri sayım arka planda duruyor', () => {
    expect(oku(join(ROOT, 'src', 'features', 'prayer', 'useSchedule.ts'))).toContain('AppState');
  });

  it('izin metinleri ne için istendiğini yazıyor', () => {
    // Konum metni artık `infoPlist` içinde değil, expo-location eklentisinin
    // seçeneğinde: eklenti kendi İngilizce varsayılanlarını yazıp üstüne
    // kullanılmayan "Always" iznini de ekliyordu (bkz. appConfig.test.ts).
    const s = oku(join(ROOT, 'app.config.ts'));
    for (const anahtar of ['locationWhenInUsePermission', 'NSMotionUsageDescription']) {
      const m = new RegExp(`${anahtar}:\\s*\\n?\\s*'([^']+)'`).exec(s);
      // Metin boş ya da tek kelime olamaz; App Review bunu okur.
      expect({ anahtar, uzunluk: (m?.[1] ?? '').length > 40 }).toEqual({ anahtar, uzunluk: true });
    }
  });
});
