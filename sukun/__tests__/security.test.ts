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
    const s = oku(join(ROOT, 'app.config.ts'));
    expect(s).toContain('NSLocationWhenInUseUsageDescription');
    expect(s).toContain('NSMotionUsageDescription');
    // Metin boş ya da tek kelime olamaz.
    const m = /NSLocationWhenInUseUsageDescription:\s*\n?\s*'([^']+)'/.exec(s);
    expect((m?.[1] ?? '').length).toBeGreaterThan(40);
  });
});
