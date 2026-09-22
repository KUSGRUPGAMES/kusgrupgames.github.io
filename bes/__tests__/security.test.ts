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
      if (ad.startsWith('EXPO_PUBLIC_')) {
        expect({ ad, sir: sirKalibi.test(ad.replace('EXPO_PUBLIC_', '')) && !/ANON/i.test(ad) })
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
   * Mağaza gizlilik formunda "veri toplanmıyor" yazıyor ve gizlilik
   * sayfalarında "reklam yok, izleyici yok, analitik yok" deniyor
   * (`store/app-privacy.md`). Bu üç cümle bir bağımlılık eklendiği an sessizce
   * yalan olabilir; bağımlılık listesi o yüzden sınamaya bağlandı.
   */
  it('pakette reklam, izleme ya da analitik kütüphanesi yok', () => {
    const pkg = JSON.parse(oku(join(ROOT, 'package.json'))) as {
      dependencies?: Record<string, string>; devDependencies?: Record<string, string>;
    };
    const adlar = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
    const yasak = /admob|google-mobile-ads|facebook|firebase|analytics|amplitude|mixpanel|segment|sentry|bugsnag|appsflyer|adjust|onesignal|branch|clevertap|posthog/i;
    expect(adlar.filter((a) => yasak.test(a))).toEqual([]);
  });

  it('izleme izni istenmiyor, reklam kimliği kapalı', () => {
    const cfg = oku(join(ROOT, 'app.config.ts'));
    // iOS: App Tracking Transparency anahtarı varsa Apple izleme yaptığımızı
    // varsayar ve gizlilik etiketleriyle çelişir.
    expect(cfg).not.toContain('NSUserTrackingUsageDescription');
    // Android: Play, AD_ID'yi bildirip kullanmayanı da reddediyor.
    expect(cfg).toContain("'com.google.android.gms.permission.AD_ID'");
  });

  it('mağaza metinleri olmayan özelliği vaat etmiyor', () => {
    // Reklam kuralları ve Pro aboneliği kodda **dormant**: hiçbir ekran
    // `entitlements` ya da `ads` modülünü kullanmıyor. Mağaza açıklamasında
    // bunlardan söz etmek, App Review'un "metadata describes functionality
    // not present" gerekçesiyle reddettiği şeydir.
    for (const dosya of ['store/app-store.md', 'store/play-store.md']) {
      const metin = oku(join(ROOT, dosya));
      const aciklama = metin.slice(metin.indexOf('## Açıklama'), metin.indexOf('## Sürüm notları'));
      expect({ dosya, vaat: /Pro aboneliği|abonelik satın|reklam gösterilmez/i.test(aciklama) })
        .toEqual({ dosya, vaat: false });
    }
  });

  it('ekranların hiçbiri Pro kilidi ya da reklam yüzeyi çizmiyor', () => {
    const ekranlar = kaynaklar.filter((p) => p.includes(`${sep}app${sep}`) || p.endsWith('.tsx'));
    const suclular = ekranlar.filter((p) => /entitlementsFor|FREE_LIMITS|adDecision|<ProLock/.test(kodu(p)));
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
