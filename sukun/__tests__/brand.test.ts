/**
 * Marka tutarlılığı — BRAND_GUIDELINES.md, DECISIONS D15.
 *
 * Yeniden markalama tek seferlik bir iş değildir: eski ad, kaçak renk ya da
 * temaya göre dallanan bir logo aylar sonra sessizce geri sızar. Burada
 * denetlenenler markanın "değişmez" dediği kurallardır.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';

const KOK = join(__dirname, '..');
const DOCS = join(KOK, '..', 'docs', 'sukun');
const oku = (p: string) => readFileSync(p, 'utf8');

const BRAND = JSON.parse(oku(join(KOK, 'src/config/brand.json'))) as {
  appName: string; storeName: string; tagline: string;
  bundleId: { ios: string; android: string };
};

function dosyalar(dir: string, uzantilar: string[]): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(dosyalar(full, uzantilar));
    else if (uzantilar.some((u) => entry.endsWith(u))) out.push(full);
  }
  return out;
}

describe('marka adı', () => {
  it('BEŞ — Ş harfi doğru kod noktası', () => {
    expect(BRAND.appName).toBe('BEŞ');
    // U+015E LATIN CAPITAL LETTER S WITH CEDILLA. Bazı dönüştürücüler bunu
    // "S" + birleştirici işaret olarak yazar ve yazı tipi eşleşmesi bozulur.
    expect([...BRAND.appName].map((c) => c.codePointAt(0))).toEqual([0x42, 0x45, 0x15e]);
  });

  it('mağaza adı marka adıyla başlar ve 30 karaktere sığar', () => {
    expect(BRAND.storeName.startsWith('BEŞ')).toBe(true);
    expect(BRAND.storeName.length).toBeLessThanOrEqual(30);
  });

  it('eski marka adı kullanıcıya görünen hiçbir yerde kalmadı', () => {
    const suclular: string[] = [];
    const bakilacak = [
      ...dosyalar(join(KOK, 'src'), ['.ts', '.tsx']),
      ...dosyalar(join(KOK, 'app'), ['.ts', '.tsx']),
      ...dosyalar(join(KOK, 'store'), ['.md']),
      ...dosyalar(DOCS, ['.html']),
    ];
    for (const f of bakilacak) {
      if (/Sükûn|Sukûn/.test(oku(f))) suclular.push(f.slice(KOK.length + 1));
    }
    expect(suclular).toEqual([]);
  });

  it('paket kimliği bilerek değişmedi', () => {
    // Kimliği değiştirmek imzayı, App Store Connect kaydını ve kurulu
    // uygulamaları kırar; kullanıcıya hiçbir yerde görünmediği için kazancı
    // sıfırdır (D15).
    expect(BRAND.bundleId.ios).toBe('com.kusgrup.sukun');
    expect(BRAND.bundleId.android).toBe(BRAND.bundleId.ios);
  });
});

describe('işaret', () => {
  const mark = oku(join(KOK, 'tools/brand/mark.js'));
  /** Açıklama satırları elenir: kural koda dairdir, düzyazıya değil. */
  const markKodu = mark.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('geometri temaya göre dallanmıyor', () => {
    // Değişmez kural: koyu ve açık AYNI yolları kullanır. `mark.js` renk ya da
    // tema bilirse iki logo doğar; kodda tema adı ya da renk geçmemeli.
    expect(markKodu).not.toMatch(/\b(dark|light|koyu|acik)\b/i);
    expect(markKodu).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });

  it('üç ölçek kademesi de tanımlı', () => {
    for (const fn of ['tamYol', 'ortaYol', 'mikroYol']) {
      expect({ fn, var: mark.includes(`function ${fn}`) }).toEqual({ fn, var: true });
    }
  });

  it('mikro kademe cami siluetini çizmiyor', () => {
    // 24 pikselde kubbe ve minare çamura dönüşüyor; ölçülerek görüldü.
    const govde = mark.slice(mark.indexOf('function mikroYol'));
    const satir = govde.slice(0, govde.indexOf('}'));
    expect(satir).not.toContain('cami');
    expect(satir).not.toContain('hilal');
  });

  it('bütün marka varlıkları üretilmiş', () => {
    const beklenen = [
      'icon.png', 'adaptive-icon.png', 'adaptive-icon-mono.png',
      'splash-icon.png', 'favicon.png',
      'brand/symbol-dark.png', 'brand/symbol-light.png',
      'brand/symbol-micro-dark.png', 'brand/symbol-micro-light.png',
      'brand/app-icon-dark.png', 'brand/app-icon-light.png',
      'brand/app-icon-monochrome.png',
      'brand/symbol-dark.svg', 'brand/symbol-light.svg',
      'brand/app-icon-dark.svg', 'brand/app-icon-light.svg',
    ];
    const eksik = beklenen.filter((f) => !existsSync(join(KOK, 'assets', f)));
    expect(eksik).toEqual([]);
  });
});

describe('renk disiplini', () => {
  it('tema dışında düz renk kodu yazılmıyor', () => {
    const suclular: string[] = [];
    for (const f of [...dosyalar(join(KOK, 'src'), ['.ts', '.tsx']), ...dosyalar(join(KOK, 'app'), ['.ts', '.tsx'])]) {
      if (f.includes(`${sep}theme${sep}`)) continue;
      if (/#[0-9A-Fa-f]{6}\b/.test(oku(f))) suclular.push(f.slice(KOK.length + 1));
    }
    expect(suclular).toEqual([]);
  });

  it('açık temada saf beyaz yüzey yok', () => {
    const tema = oku(join(KOK, 'src/theme/index.ts'));
    const acik = tema.slice(tema.indexOf('background: palette.ivory'), tema.indexOf('accent:'));
    // Steril beyaz ürünü jenerik bir mobil uygulamaya çeviriyordu.
    expect(acik).not.toContain('palette.white');
  });

  it('desen opaklığı %4–8 bandında', () => {
    const tokens = oku(join(KOK, 'src/theme/tokens.ts'));
    const m = /motif:\s*([\d.]+)/.exec(tokens);
    const deger = Number(m?.[1] ?? 0);
    expect({ deger, bandda: deger >= 0.04 && deger <= 0.08 }).toEqual({ deger, bandda: true });
  });
});
