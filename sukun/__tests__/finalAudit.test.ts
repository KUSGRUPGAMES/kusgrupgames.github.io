/**
 * Son denetim — şartname §101, §102.
 *
 * "Yayına hazır" demeden önce çalıştırılan taramalar. Hepsi bir kez gerçekten
 * yapılmış ya da yapılması kolay hatalara bakar: geride kalan taslak metin,
 * ulaşılmayan ekran, kayıt edilmemiş yol, çevrilmemiş metin.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, basename, sep } from 'node:path';
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

describe('gezinme iskeleti', () => {
  // Bu bir kez gerçekten oldu: kök düzen `onboardingDone` yanlışken
  // `<Stack>` yerine yalnız `<Redirect>` döndürüyordu. Gezinme kabı hiç
  // çizilmediği için yönlendirme de çalışmıyordu ve uygulama **ilk
  // açılışta bomboş beyaz ekranla** başlıyordu. Kök düzen erken dönemez.
  const kok = oku(join(ROOT, 'app', '_layout.tsx'));

  it('kök düzen her durumda gezinme kabını çiziyor', () => {
    const govde = kok.slice(kok.indexOf('function RootStack'));
    const stackIndex = govde.indexOf('<Stack');
    expect(stackIndex).toBeGreaterThan(0);
    // `<Stack`tan önce tek bir `return` bulunmalı — kabı çizen o dönüş.
    // Fazlası koşullu erken dönüştür ve o dalda navigatör hiç çizilmez.
    const oncesi = govde.slice(0, stackIndex);
    expect(oncesi.match(/\breturn\b/g) ?? []).toHaveLength(1);
  });

  it('başlık çubuğu temadan renk alıyor', () => {
    // Yirmi beş ekran `headerShown: true` diyor. Kök yığın başlığı
    // temalamazsa React Navigation kendi varsayılanını kullanıyor ve koyu
    // temada sayfanın üstünde bembeyaz bir şerit kalıyordu (D18).
    const acanlar = uygulamaDosyalari
      .filter((f) => basename(f) !== '_layout.tsx')
      .filter((f) => /headerShown:\s*true/.test(oku(f)));
    expect(acanlar.length).toBeGreaterThan(10);
    for (const anahtar of ['headerStyle', 'headerTintColor', 'headerTitleStyle']) {
      expect({ anahtar, var: kok.includes(anahtar) }).toEqual({ anahtar, var: true });
    }
    expect(kok).toContain('theme.colors.backgroundGradient[0]');
    // Hiçbir ekran kendi başına başlık rengi yazmamalı; tek yerden gelir.
    const suclular = acanlar.filter((f) => /headerStyle|headerTintColor/.test(oku(f)));
    expect(suclular.map((f) => basename(f))).toEqual([]);
  });

  it('marka kartındaki halkalar on-accent rollerini kullanıyor', () => {
    // Üç geri sayım halkası da `<Card accent>` içinde duruyor. İlerleme
    // `onAccent` (fildişi) verilince açık temada yatak da fildişi kalıyor ve
    // halka hiç ilerlemiyormuş gibi görünüyordu; ayrıca logonun altın/zümrüt
    // eşleşmesi kayboluyordu (D18).
    const suclular = uygulamaDosyalari.filter((f) => {
      const k = oku(f);
      return k.includes('<CountdownRing') && /color=\{theme\.colors\.onAccent\}/.test(k);
    });
    expect(suclular.map((f) => basename(f))).toEqual([]);
  });

  it('onboarding kapısı bir ekranın içinde duruyor', () => {
    // Kapı kökte değil, kök yığının bir ekranı olan sekme düzenindedir;
    // `Redirect` ancak orada gezinme bağlamı bulur.
    expect(kok).not.toContain('Redirect');
    const sekme = oku(join(ROOT, 'app', '(tabs)', '_layout.tsx'));
    expect(sekme).toContain('<Redirect href="/onboarding" />');
  });
});

describe('dil ayarı her yere işliyor', () => {
  // Ekranlarda `Intl.DateTimeFormat('tr-TR', …)` gömülüydü: arayüz dilini
  // İngilizce yapan kullanıcı yine "20 Eylül 2026" görüyordu. Biçimlendirici
  // tek yerden, seçili dilden gelir.
  it('hiçbir ekran tarih biçimlendiricisine sabit dil yazmıyor', () => {
    const suclular: string[] = [];
    for (const f of [...uygulamaDosyalari, ...dosyalar(join(ROOT, 'src'))]) {
      if (basename(f) === 'dates.ts' || f.includes(`${sep}lib${sep}time${sep}`)) continue;
      if (/new Intl\.DateTimeFormat\(\s*['"`]/.test(oku(f))) suclular.push(basename(f));
    }
    expect(suclular).toEqual([]);
  });
});

describe('ekran başlıkları', () => {
  // Bir düzine ekranda üst çubuktaki başlık, hemen altındaki bölüm
  // başlığında birebir tekrar ediyordu: "Dualar / Dualar", "Kıble yönü /
  // Kıble yönü". Ekran görüntülerine bakınca görüldü.
  it('bölüm başlığı ekran başlığını tekrar etmiyor', () => {
    const suclular: string[] = [];
    for (const f of uygulamaDosyalari) {
      const s = oku(f);
      const ekran = /options=\{\{[^}]*title: t\('([^']+)'\)/.exec(s);
      if (!ekran) continue;
      const ilkBolum = /<SectionHeader\s+title=\{t\('([^']+)'\)\}/.exec(s);
      if (ilkBolum && ilkBolum[1] === ekran[1]) suclular.push(`${basename(f)}: ${ekran[1]}`);
    }
    expect(suclular).toEqual([]);
  });
});
