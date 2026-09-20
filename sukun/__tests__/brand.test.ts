/**
 * Marka tutarlılığı — `assets/brand/docs/CLAUDE_HANDOFF.md`, DECISIONS D15.
 *
 * Marka varlıkları **dışarıdan verilen pakettir**; bu depoda çizilmez,
 * izlenmez, yeniden üretilmez. Buradaki sınamalar paketin kurallarını koda
 * bağlar: sembol geometrisi iki temada aynı kalmalı, renkler paketin
 * `brand.tokens.json`'undan gelmeli, eski marka adı hiçbir yerde kalmamalı.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, sep } from 'node:path';

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

function dosyalar(dir: string, uzantilar: string[]): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(dosyalar(full, uzantilar));
    else if (uzantilar.some((u) => entry.endsWith(u))) out.push(full);
  }
  return out;
}

/** SVG içindeki bütün `d="..."` yol verileri, sırasıyla. */
function yollar(svg: string): string[] {
  return [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => (m[1] ?? '').replace(/\s+/g, ' ').trim());
}

describe('verilen paket', () => {
  it('bütün kaynak dosyalar yerinde', () => {
    const beklenen = [
      'brand.tokens.json',
      'docs/CLAUDE_HANDOFF.md',
      'svg/BES_AppIcon_Dark.svg',
      'svg/BES_AppIcon_Light.svg',
      'svg/BES_Symbol_Gold.svg',
      'svg/BES_Symbol_Emerald.svg',
      'svg/BES_Symbol_Monochrome_Black.svg',
      'svg/BES_Symbol_Monochrome_White.svg',
      'svg/BES_Android_Adaptive_Foreground.svg',
      'svg/BES_Android_Notification_Monochrome.svg',
      'svg/BES_Pattern_Dark.svg',
      'svg/BES_Pattern_Light.svg',
    ];
    expect(beklenen.filter((f) => !existsSync(join(PAKET, f)))).toEqual([]);
  });

  it('platform ikonları paketten üretilmiş', () => {
    const beklenen = [
      'icon.png', 'adaptive-icon.png', 'adaptive-icon-mono.png',
      'splash-icon.png', 'favicon.png',
      'brand/notification-icon.png', 'brand/app-icon-ios-light.png',
      'brand/splash-icon-light.png',
      'brand/symbol-micro-dark.png', 'brand/symbol-micro-light.png',
      'brand/pattern-dark.png', 'brand/pattern-light.png',
    ];
    expect(beklenen.filter((f) => !existsSync(join(KOK, 'assets', f)))).toEqual([]);
  });
});

describe('sembol geometrisi', () => {
  const koyu = oku(join(PAKET, 'svg/BES_AppIcon_Dark.svg'));
  const acik = oku(join(PAKET, 'svg/BES_AppIcon_Light.svg'));

  it('koyu ve açık ikon BİREBİR aynı yolları kullanıyor', () => {
    // Paketin pazarlıksız kuralı: "Dark and Light variants use the SAME symbol
    // geometry. Only theme colors/background treatment differ."
    expect(yollar(acik)).toEqual(yollar(koyu));
  });

  it('iki ikon yalnız zemin ve renkte ayrışıyor', () => {
    const zemin = (s: string) => /<rect[^>]*fill="(#[0-9A-Fa-f]{6})"/.exec(s)?.[1];
    expect(zemin(koyu)).toBe(TOKENS.colors.deepEmerald);
    expect(zemin(acik)).toBe(TOKENS.colors.warmIvory);
  });

  it('sembol varyantları da aynı geometriyi taşıyor', () => {
    const referans = yollar(oku(join(PAKET, 'svg/BES_Symbol_Gold.svg')));
    for (const ad of ['BES_Symbol_Emerald.svg', 'BES_Symbol_Monochrome_Black.svg',
      'BES_Symbol_Monochrome_White.svg', 'BES_Android_Adaptive_Foreground.svg']) {
      expect({ ad, ayni: yollar(oku(join(PAKET, 'svg', ad))) }).toEqual({ ad, ayni: referans });
    }
  });

  it('depoda logoyu yeniden çizen bir üretici yok', () => {
    // Paket kuralı 8: "Do not feed these files to an image generator. Import
    // them directly." Eski `tools/brand/mark.js` işareti kendisi çiziyordu;
    // kaldırıldı ve geri gelmemeli.
    expect(existsSync(join(KOK, 'tools', 'brand', 'mark.js'))).toBe(false);
    const uretici = oku(join(KOK, 'tools/gen-brand.js'));
    expect(uretici).toContain('assets/brand');
    // Üretici yalnız rasterler; içinde yol verisi (kavis komutu) olmamalı.
    expect(uretici).not.toMatch(/\bd="M[\d.]/);
  });
});

describe('iOS ikonu', () => {
  it('Apple maskesinin içine ikinci bir yuvarlak köşe konmuyor', () => {
    // Paket kuralı 3. Verilen master `rx="220"` taşıyor; iki yuvarlama üst
    // üste binince köşelerde açık renk bir hâle kalıyor.
    const uretici = oku(join(KOK, 'tools/gen-brand.js'));
    expect(uretici).toContain('koseleriDuzle');
    expect(uretici).toMatch(/rx="220"/);
    // Kaynak dosyaya dokunulmaz; düzeltme yalnız üretim anında yapılır.
    expect(oku(join(PAKET, 'svg/BES_AppIcon_Dark.svg'))).toContain('rx="220"');
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
