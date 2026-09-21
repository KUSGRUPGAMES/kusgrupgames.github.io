/**
 * Marka tutarlılığı — DECISIONS D15, D17.
 *
 * **Logo bu depoda çizilmez.** Kaynak, verilen bitmiş master PNG'lerdir:
 *
 *     assets/brand/png/BES_AppIcon_Dark_1024.png
 *     assets/brand/png/BES_AppIcon_Light_1024.png
 *
 * Bir kez bunun tersi yapıldı ve pahalıya mal oldu: pakette gelen elle
 * çizilmiş `BES_AppIcon_*.svg` / `BES_Symbol_*.svg` dosyaları onaylanan
 * logonun **yaklaşık rekonstrüksiyonlarıydı**; platform ikonları onlardan
 * üretilince marka tasarımı bozuldu. Buradaki sınamalar o yolun kapalı
 * kaldığını denetler: depoda logo vektörü yoktur, üreticide yol verisi
 * yoktur, üretilen ikonlar masterın oranını birebir taşır.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import { PNG } from 'pngjs';

const KOK = join(__dirname, '..');
const PAKET = join(KOK, 'assets', 'brand');
const DOCS = join(KOK, '..', 'docs', 'sukun');
const oku = (p: string) => readFileSync(p, 'utf8');

const TOKENS = JSON.parse(oku(join(PAKET, 'brand.tokens.json'))) as {
  brandName: string; brandSymbol: string;
  colors: {
    deepEmerald: string; emerald: string; warmIvory: string;
    softBeige: string; mutedGold: string; goldDark: string;
  };
  usage: { appDisplayName: string; suggestedStoreTitle: string; tagline: string };
};

const BRAND = JSON.parse(oku(join(KOK, 'src/config/brand.json'))) as {
  appName: string; storeName: string; tagline: string;
  bundleId: { ios: string; android: string };
};

const PALET = oku(join(KOK, 'src/theme/tokens.ts'));
const URETICI = oku(join(KOK, 'tools/gen-brand.js'));

function dosyalar(dir: string, uzantilar: string[]): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(dosyalar(full, uzantilar));
    else if (uzantilar.some((u) => entry.endsWith(u))) out.push(full);
  }
  return out;
}

interface Kutu { x0: number; y0: number; x1: number; y1: number; w: number; h: number }

const bosKutu = (): Kutu => ({ x0: Infinity, y0: Infinity, x1: -1, y1: -1, w: 0, h: 0 });

function kutula(png: PNG, secici: (i: number, d: Buffer) => boolean): Kutu {
  const k = bosKutu();
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (!secici((y * png.width + x) * 4, png.data)) continue;
      if (x < k.x0) k.x0 = x;
      if (x > k.x1) k.x1 = x;
      if (y < k.y0) k.y0 = y;
      if (y > k.y1) k.y1 = y;
    }
  }
  k.w = k.x1 - k.x0 + 1;
  k.h = k.y1 - k.y0 + 1;
  return k;
}

// Aynı dosya birkaç sınamada okunuyor; çözme pahalı (1024² PNG ≈ 1,5 s).
const onbellek = new Map<string, PNG>();
function gorsel(yol: string): PNG {
  const hazir = onbellek.get(yol);
  if (hazir) return hazir;
  const png = PNG.sync.read(readFileSync(join(KOK, 'assets', yol)));
  onbellek.set(yol, png);
  return png;
}
/** Alfası dolu bölge. */
const alfaKutusu = (yol: string) => kutula(gorsel(yol), (i, d) => (d[i + 3] ?? 0) >= 128);
/** Altın figür: kâğıt zemin nötr (R−B ≈ 10), altın sıcaktır (R−B > 40). */
const altinKutusu = (yol: string) => kutula(gorsel(yol), (i, d) => {
  const r = d[i] ?? 0; const g = d[i + 1] ?? 0; const b = d[i + 2] ?? 0;
  return r - b > 40 && 0.2126 * r + 0.7152 * g + 0.0722 * b > 120;
});

describe('verilen master', () => {
  it('kaynak dosyalar yerinde', () => {
    const beklenen = [
      'brand.tokens.json',
      'docs/CLAUDE_HANDOFF.md',
      'reference/BES_Brand_Guideline_Board.png',
      'png/BES_AppIcon_Dark_1024.png',
      'png/BES_AppIcon_Light_1024.png',
    ];
    expect(beklenen.filter((f) => !existsSync(join(PAKET, f)))).toEqual([]);
  });

  it('master 1024×1024', () => {
    for (const ad of ['BES_AppIcon_Dark_1024.png', 'BES_AppIcon_Light_1024.png']) {
      const png = PNG.sync.read(readFileSync(join(PAKET, 'png', ad)));
      expect({ ad, w: png.width, h: png.height }).toEqual({ ad, w: 1024, h: 1024 });
    }
  });

  it('depoda logonun vektör kopyası yok', () => {
    // Elle çizilmiş `BES_*.svg` dosyaları kaldırıldı (D17) ve geri gelmemeli;
    // logo yalnız bitmiş rasterden gelir.
    expect(dosyalar(PAKET, ['.svg'])).toEqual([]);
    expect(existsSync(join(KOK, 'tools', 'brand', 'mark.js'))).toBe(false);
  });
});

describe('üretici', () => {
  it('kaynağı master PNG', () => {
    expect(URETICI).toContain("path.join(ASSETS, 'brand', 'png')");
    expect(URETICI).toContain('BES_AppIcon_Dark_1024.png');
  });

  it('logoyu yeniden çizecek hiçbir şey içermiyor', () => {
    // Yol verisi, yazı tipiyle "5", SVG çizimi — üçü de yasak (D17).
    for (const yasak of [/\bd="M[\d.]/, /<path/i, /<svg/i, /font-family/i, /fillText/]) {
      expect({ yasak: String(yasak), var: yasak.test(URETICI) })
        .toEqual({ yasak: String(yasak), var: false });
    }
  });

  it('yapılandırma ikonları dosya olarak gösteriyor', () => {
    const cfg = oku(join(KOK, 'app.config.ts'));
    expect(cfg).not.toMatch(/\.svg['"]/);
  });
});

describe('üretilen platform ikonları', () => {
  const beklenen: [string, number][] = [
    ['icon.png', 1024],
    ['adaptive-icon.png', 1024],
    ['adaptive-icon-mono.png', 1024],
    ['splash-icon.png', 1024],
    ['favicon.png', 96],
    ['brand/app-icon-ios-light.png', 1024],
    ['brand/logo-dark.png', 512],
    ['brand/logo-light.png', 512],
    ['brand/notification-icon.png', 512],
    ['brand/splash-icon-light.png', 1024],
    ['brand/symbol-micro-light.png', 256],
    ['brand/symbol-micro-dark.png', 256],
  ];

  it('hepsi var ve kare', () => {
    for (const [ad, boy] of beklenen) {
      const png = gorsel(ad);
      expect({ ad, w: png.width, h: png.height }).toEqual({ ad, w: boy, h: boy });
    }
  });

  it('iOS ikonu alfasız ve köşeleri kutucuğun zemininde', () => {
    // Apple saydamlığı kabul etmiyor; ayrıca master kendi yuvarlak köşesini
    // taşıyor ve Apple'ınkiyle üst üste binince köşede açık bir hâle kalıyor.
    // Köşeler artık kutucuğun koyu zümrüdü olmalı, sunum kâğıdının beyazı
    // değil (CLAUDE_HANDOFF kuralı 3).
    const ham = readFileSync(join(KOK, 'assets', 'icon.png'));
    expect(ham[25]).toBe(2); // IHDR colorType 2 = RGB, alfa kanalı yok
    const png = gorsel('icon.png');
    const kose = [[0, 0], [1023, 0], [0, 1023], [1023, 1023]] as const;
    for (const [x, y] of kose) {
      const i = (y * png.width + x) * 4;
      const L = 0.2126 * (png.data[i] ?? 0) + 0.7152 * (png.data[i + 1] ?? 0)
        + 0.0722 * (png.data[i + 2] ?? 0);
      expect({ x, y, koyu: L < 80 }).toEqual({ x, y, koyu: true });
    }
  });

  it('master ile üretilen ikonun oranı aynı — hiçbir yerde esnetme yok', () => {
    const master = altinKutusu(join('brand', 'png', 'BES_AppIcon_Dark_1024.png'));
    const oran = (k: Kutu) => k.w / k.h;
    const hedef = oran(master);
    // Üretilenlerin ölçüsü alfadan, masterınki renkten okunuyor; iki ölçüt
    // sembolün yumuşak kenarında birkaç piksel ayrışır, %5 bant onu karşılar.
    // Gerçek bir esnetme hatası bu bandın çok dışına düşer.
    for (const ad of ['splash-icon.png', 'adaptive-icon.png', 'brand/notification-icon.png']) {
      const sapma = Math.abs(oran(alfaKutusu(ad)) - hedef) / hedef;
      expect({ ad, bandda: sapma < 0.05 }).toEqual({ ad, bandda: true });
    }
    // Aynı figürden gelenler kendi aralarında neredeyse birebir olmalı.
    const a = oran(alfaKutusu('splash-icon.png'));
    const b = oran(alfaKutusu('adaptive-icon.png'));
    expect(Math.abs(a - b) / a).toBeLessThan(0.01);
  });

  it('simge tuvalde ortalanmış', () => {
    for (const ad of ['splash-icon.png', 'adaptive-icon.png']) {
      const png = gorsel(ad);
      const k = alfaKutusu(ad);
      expect({ ad, yatay: Math.abs(k.x0 - (png.width - 1 - k.x1)) <= 2 })
        .toEqual({ ad, yatay: true });
      expect({ ad, dikey: Math.abs(k.y0 - (png.height - 1 - k.y1)) <= 2 })
        .toEqual({ ad, dikey: true });
    }
  });

  it('Android uyarlanabilir ikon güvenli dairenin içinde', () => {
    // Yuvarlak maskeli başlatıcılarda yalnız ortadaki %66'lık daire garanti.
    // Sınırlayıcı dikdörtgeni %66'ya oturtmak yetmiyordu: "5"in kanadı ve
    // kâsesi köşelere uzandığı için piksellerin %1,5'i dışarıda kalıyordu.
    for (const ad of ['adaptive-icon.png', 'adaptive-icon-mono.png']) {
      const png = gorsel(ad);
      const c = png.width / 2;
      const r = png.width * 0.33;
      let disarida = 0;
      for (let y = 0; y < png.height; y += 1) {
        for (let x = 0; x < png.width; x += 1) {
          if ((png.data[(y * png.width + x) * 4 + 3] ?? 0) < 128) continue;
          if (Math.hypot(x + 0.5 - c, y + 0.5 - c) > r) disarida += 1;
        }
      }
      expect({ ad, disarida }).toEqual({ ad, disarida: 0 });
    }
  });

  it('tek renk yüzeyler gerçekten tek renk', () => {
    // Android bildirim ikonunu ve temalı ikonu yalnız alfadan okur; renkli
    // piksel verilirse durum çubuğunda beyaz bir kare görünür.
    for (const ad of ['adaptive-icon-mono.png', 'brand/notification-icon.png']) {
      const png = gorsel(ad);
      let renkli = 0;
      for (let i = 0; i < png.data.length; i += 4) {
        if ((png.data[i + 3] ?? 0) === 0) continue;
        if (png.data[i] !== 255 || png.data[i + 1] !== 255 || png.data[i + 2] !== 255) renkli += 1;
      }
      expect({ ad, renkli }).toEqual({ ad, renkli: 0 });
    }
  });

  it('açılış sembolleri saydam zeminli', () => {
    for (const ad of ['splash-icon.png', 'brand/splash-icon-light.png']) {
      const png = gorsel(ad);
      const kose = png.data[0 * 4 + 3];
      expect({ ad, kose }).toEqual({ ad, kose: 0 });
    }
  });
});

describe('marka adı', () => {
  it('ad, mağaza adı ve slogan paketle aynı', () => {
    expect(BRAND.appName).toBe(TOKENS.usage.appDisplayName);
    expect(BRAND.storeName).toBe(TOKENS.usage.suggestedStoreTitle);
    expect(BRAND.tagline).toBe(TOKENS.usage.tagline);
  });

  it('BEŞ — Ş harfi doğru kod noktası', () => {
    // U+015E LATIN CAPITAL LETTER S WITH CEDILLA. Bazı dönüştürücüler bunu
    // "S" + birleştirici işaret olarak yazar ve yazı tipi eşleşmesi bozulur.
    expect([...BRAND.appName].map((c) => c.codePointAt(0))).toEqual([0x42, 0x45, 0x15e]);
  });

  it('mağaza adı marka adıyla başlar ve 30 karaktere sığar', () => {
    expect(BRAND.storeName.startsWith(TOKENS.brandName)).toBe(true);
    expect(BRAND.storeName.length).toBeLessThanOrEqual(30);
  });

  it('eski marka adı kullanıcıya görünen hiçbir yerde kalmadı', () => {
    const suclular: string[] = [];
    for (const f of [
      ...dosyalar(join(KOK, 'src'), ['.ts', '.tsx']),
      ...dosyalar(join(KOK, 'app'), ['.ts', '.tsx']),
      ...dosyalar(join(KOK, 'store'), ['.md']),
      ...dosyalar(DOCS, ['.html']),
    ]) {
      if (/Sükûn|Sukûn/.test(oku(f))) suclular.push(f.slice(KOK.length + 1));
    }
    expect(suclular).toEqual([]);
  });

  it('paket kimliği bilerek değişmedi', () => {
    // Kimliği değiştirmek imzayı, App Store Connect kaydını ve kurulu
    // uygulamaları kırar; kullanıcıya hiçbir yerde görünmediği için kazancı
    // sıfırdır (D15, paket kuralı 2).
    expect(BRAND.bundleId.ios).toBe('com.kusgrup.sukun');
    expect(BRAND.bundleId.android).toBe(BRAND.bundleId.ios);
  });
});

describe('renk disiplini', () => {
  it('paletteki marka renkleri pakettekiyle birebir aynı', () => {
    const eslesme: [string, string][] = [
      ['emerald900', TOKENS.colors.deepEmerald],
      ['emerald700', TOKENS.colors.emerald],
      ['ivory100', TOKENS.colors.warmIvory],
      ['ivory200', TOKENS.colors.softBeige],
      ['gold400', TOKENS.colors.mutedGold],
      ['gold500', TOKENS.colors.goldDark],
    ];
    for (const [token, renk] of eslesme) {
      const m = new RegExp(`${token}:\\s*'(#[0-9A-Fa-f]{6})'`).exec(PALET);
      expect({ token, renk: m?.[1]?.toUpperCase() }).toEqual({ token, renk: renk.toUpperCase() });
    }
  });

  it('tema dışında düz renk kodu yazılmıyor', () => {
    const suclular: string[] = [];
    for (const f of [...dosyalar(join(KOK, 'src'), ['.ts', '.tsx']), ...dosyalar(join(KOK, 'app'), ['.ts', '.tsx'])]) {
      if (f.includes(`${sep}theme${sep}`)) continue;
      if (/#[0-9A-Fa-f]{6}\b/.test(oku(f))) suclular.push(f.slice(KOK.length + 1));
    }
    expect(suclular).toEqual([]);
  });

  it('açık tema zemini markanın fildişi rengi', () => {
    const tema = oku(join(KOK, 'src/theme/index.ts'));
    // Dilim `lightTheme` gövdesidir. `accent:` gibi genel anahtarlarla
    // sınırlamak işe yaramıyor: aynı ad arayüz bildiriminde de geçiyor ve
    // dilim boş dönüyordu — sınama sessizce hiçbir şeye bakmaz hâle geliyor.
    const acik = tema.slice(tema.indexOf('export const lightTheme'), tema.indexOf('export const darkTheme'));
    expect(acik.length).toBeGreaterThan(200);
    expect(acik).toContain('background: palette.ivory100');
    // Steril beyaz ürünü jenerik bir mobil uygulamaya çeviriyordu.
    expect(acik).not.toContain('palette.white');
  });

  it('desen opaklığı %4–8 bandında', () => {
    const m = /motif:\s*([\d.]+)/.exec(PALET);
    const deger = Number(m?.[1] ?? 0);
    expect({ deger, bandda: deger >= 0.04 && deger <= 0.08 }).toEqual({ deger, bandda: true });
  });
});
