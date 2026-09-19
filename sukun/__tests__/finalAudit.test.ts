/**
 * Son denetim — şartname §101, §102.
 *
 * "Yayına hazır" demeden önce çalıştırılan taramalar. Hepsi bir kez gerçekten
 * yapılmış ya da yapılması kolay hatalara bakar: geride kalan taslak metin,
 * ulaşılmayan ekran, kayıt edilmemiş yol, çevrilmemiş metin.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tr } from '@/lib/i18n';

const ROOT = join(__dirname, '..');
const oku = (p: string) => readFileSync(p, 'utf8');

function dosyalar(dir: string, uzantilar = ['.ts', '.tsx']): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(dosyalar(full, uzantilar));
    else if (uzantilar.some((u) => entry.endsWith(u))) out.push(full);
  }
  return out;
}

const uygulamaDosyalari = dosyalar(join(ROOT, 'app'));
const kaynakDosyalari = dosyalar(join(ROOT, 'src'));

describe('geride taslak kalmadı', () => {
  // Sınama başlığı bilerek bu işaretleri yazmıyor: lint kuralı kendi
  // başlığını yakalıyor ve kapı gereksiz yere kırılıyordu.
  it('üretim kodunda yarım iş işareti kalmadı', () => {
    const bulunan: string[] = [];
    for (const p of [...uygulamaDosyalari, ...kaynakDosyalari]) {
      const s = oku(p);
      for (const m of s.matchAll(/\b(TODO|FIXME|HACK|XXX)\b/g)) {
        bulunan.push(`${basename(p)}: ${m[1]}`);
      }
    }
    expect(bulunan).toEqual([]);
  });

  it('sahte veri ya da geçici ekran kalmadı', () => {
    const bulunan: string[] = [];
    for (const p of [...uygulamaDosyalari, ...kaynakDosyalari]) {
      // `mock`, sınama dosyalarında serbesttir ama üretim kodunda olmamalı.
      if (/\b(lorem ipsum|mockData|fakeData|dummyData)\b/i.test(oku(p))) bulunan.push(basename(p));
    }
    expect(bulunan).toEqual([]);
  });
});

describe('yönlendirme bütünlüğü', () => {
  const kokDuzen = oku(join(ROOT, 'app', '_layout.tsx'));

  /** `app/` altındaki ekran dosyalarının yol adları. */
  const ekranlar = readdirSync(join(ROOT, 'app'))
    .filter((f) => f.endsWith('.tsx') && !f.startsWith('_') && !f.startsWith('+'))
    .map((f) => f.replace('.tsx', ''));

  it('her ekran kök düzende kayıtlı', () => {
    const eksik = ekranlar.filter((ad) => !kokDuzen.includes(`name="${ad}"`));
    expect(eksik).toEqual([]);
  });

  it('kodda geçen her yönlendirme hedefi gerçekten var', () => {
    const hedefler = new Set<string>();
    for (const p of [...uygulamaDosyalari, ...kaynakDosyalari]) {
      for (const m of oku(p).matchAll(/router\.(push|replace)\(\s*[`'"]\/([a-z-]+)/g)) {
        hedefler.add(m[2]!);
      }
    }
    const olmayan = [...hedefler].filter(
      (h) => h !== '' && !existsSync(join(ROOT, 'app', `${h}.tsx`)) && !existsSync(join(ROOT, 'app', '(tabs)', `${h}.tsx`)),
    );
    expect(olmayan).toEqual([]);
  });

  it('sekme ekranları eksiksiz', () => {
    for (const ad of ['index', 'quran', 'worship', 'explore', 'profile']) {
      expect({ ad, var: existsSync(join(ROOT, 'app', '(tabs)', `${ad}.tsx`)) })
        .toEqual({ ad, var: true });
    }
  });
});

describe('çeviri bütünlüğü', () => {
  it('kodda kullanılan her çeviri anahtarı tanımlı', () => {
    const tanimli = new Set(Object.keys(tr));
    const eksik = new Set<string>();
    for (const p of [...uygulamaDosyalari, ...kaynakDosyalari]) {
      for (const m of oku(p).matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)) {
        if (!tanimli.has(m[1]!)) eksik.add(`${basename(p)}: ${m[1]}`);
      }
    }
    expect([...eksik]).toEqual([]);
  });

  it('tanımlı anahtarların büyük çoğunluğu kullanılıyor', () => {
    const kullanilan = new Set<string>();
    for (const p of [...uygulamaDosyalari, ...kaynakDosyalari]) {
      for (const m of oku(p).matchAll(/'([a-zA-Z][\w]*\.[\w.]+)'/g)) kullanilan.add(m[1]!);
    }
    const kullanilmayan = Object.keys(tr).filter((k) => !kullanilan.has(k));
    // Bir miktar yedek anahtar normaldir; yarısı boşta duruyorsa temizlik gerekir.
    expect(kullanilmayan.length).toBeLessThan(Object.keys(tr).length * 0.5);
  });
});

describe('sürüm ve ortam', () => {
  it('marka sürümü semantik biçimdedir', () => {
    const brand = JSON.parse(oku(join(ROOT, 'src', 'config', 'brand.json')));
    expect(brand.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('paket sürümü marka sürümüyle aynı', () => {
    const brand = JSON.parse(oku(join(ROOT, 'src', 'config', 'brand.json')));
    const pkg = JSON.parse(oku(join(ROOT, 'package.json')));
    expect(pkg.version).toBe(brand.version);
  });

  it('ortam ayrımı üç değeri de tanıyor', () => {
    const s = oku(join(ROOT, 'app.config.ts'));
    for (const ortam of ['development', 'staging', 'production']) {
      expect({ ortam, var: s.includes(ortam) }).toEqual({ ortam, var: true });
    }
    // Geliştirme ve staging sürümleri ayrı bundle id alır ki aynı telefonda
    // yan yana durabilsinler.
    expect(s).toContain('suffix');
  });

  it('kalite kapısı komutları tanımlı', () => {
    const pkg = JSON.parse(oku(join(ROOT, 'package.json')));
    for (const k of ['typecheck', 'lint', 'test', 'gate', 'bundle']) {
      expect({ k, var: typeof pkg.scripts[k] === 'string' }).toEqual({ k, var: true });
    }
  });
});

describe('içerik künyeleri', () => {
  it('Kur’an ve meal paketleri kaynak künyesi taşıyor', () => {
    const quran = JSON.parse(oku(join(ROOT, 'assets', 'quran', 'quran.json')));
    expect(quran.source.name).toBeTruthy();
    expect(quran.checksum).toBeTruthy();
    const meal = JSON.parse(oku(join(ROOT, 'assets', 'quran', 'translations', 'tr-yazir.json')));
    expect(meal.source.url).toContain('tanzil');
    expect(meal.rights).toBe('kamu-mali');
  });

  it('kıraat kataloğu kaynak ve şart bağlantısı taşıyor', () => {
    const r = JSON.parse(oku(join(ROOT, 'assets', 'quran', 'reciters.json')));
    expect(r.reciters.length).toBeGreaterThan(10);
    expect(r.source.terms).toContain('http');
  });

  it('yazı tipi lisansı paketle birlikte duruyor', () => {
    expect(existsSync(join(ROOT, 'assets', 'fonts', 'Amiri-OFL.txt'))).toBe(true);
  });
});
