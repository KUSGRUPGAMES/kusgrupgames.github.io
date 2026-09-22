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
const DOCS = join(KOK, '..', 'docs', 'bes');
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
/**
 * Masterın iç bölgesinden bir piksel kümesinin parlaklık yüzdeliği.
 *
 * Pencere (120–900) kutucuğun kesinlikle içinde ve yuvarlak köşelerden uzak;
 * sunum çerçevesine hiç değmiyor. Sınıflama parlaklıkla yapılır, böylece
 * üreticinin kutucuk bulma mantığı burada tekrarlanmaz.
 */
const kumeler = new Map<string, [number, number, number, number][]>();

function kume(dosya: string, ad: string, sec: (r: number, g: number, b: number, L: number) => boolean) {
  const anahtar = `${dosya}:${ad}`;
  const hazir = kumeler.get(anahtar);
  if (hazir) return hazir;
  const png = PNG.sync.read(readFileSync(join(PAKET, 'png', dosya)));
  const px: [number, number, number, number][] = [];
  for (let y = 120; y <= 900; y += 1) {
    for (let x = 120; x <= 900; x += 1) {
      const i = (y * png.width + x) * 4;
      const r = png.data[i] ?? 0; const g = png.data[i + 1] ?? 0; const b = png.data[i + 2] ?? 0;
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (sec(r, g, b, L)) px.push([L, r, g, b]);
    }
  }
  px.sort((a, b) => a[0] - b[0]);
  kumeler.set(anahtar, px);
  return px;
}

function dilim(dosya: string, ad: string, sec: (r: number, g: number, b: number, L: number) => boolean, f: number): string {
  const px = kume(dosya, ad, sec);
  const v = px[Math.min(px.length - 1, Math.floor(px.length * f))] ?? [0, 0, 0, 0];
  return `#${[v[1], v[2], v[3]].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

const KOYU_MASTER = 'BES_AppIcon_Dark_1024.png';
const ACIK_MASTER = 'BES_AppIcon_Light_1024.png';
const zeminDilimi = (f: number) => dilim(KOYU_MASTER, 'zemin', (_r, _g, _b, L) => L < 70, f);
const altinDilimi = (f: number) => dilim(KOYU_MASTER, 'altin', (r, _g, b, L) => r - b > 40 && L > 100, f);
const acikDilimi = (f: number) => dilim(ACIK_MASTER, 'zemin', (_r, _g, _b, L) => L > 170, f);
const figurDilimi = (f: number) => dilim(ACIK_MASTER, 'figur', (_r, _g, _b, L) => L < 70, f);

/** İki rengin kanal başına en büyük farkı. */
function fark(a: string, b: string): number {
  const oku16 = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return Math.max(...[0, 1, 2].map((i) => Math.abs(oku16(a, i) - oku16(b, i))));
}

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

  it('paket kimliği ürünün kendi adı üzerinden ve iki platformda aynı', () => {
    // D21: geçici geliştirme adı (`sukun`) depodan tamamen kalktı. Kardeş
    // ürünlerin kalıbı: `com.kusgrup.<ürün>`. Kimlik yayınlandıktan sonra
    // **değiştirilemez**, bu yüzden sabit yazılıp sınamaya bağlandı.
    expect(BRAND.bundleId.ios).toBe('com.kusgrup.bes');
    expect(BRAND.bundleId.android).toBe(BRAND.bundleId.ios);
  });

  it('kimlik yüzeylerinin hepsi aynı ada bakar', () => {
    // Paket kimliği, Pages adresi, derin bağlantı şeması ve Expo slug'ı ayrı
    // dosyalarda duruyor; biri yeniden adlandırılıp öbürü unutulursa
    // uygulama açılır ama gizlilik bağlantısı 404 verir.
    expect(BRAND.website).toBe('https://kusgrupgames.github.io/bes');
    expect(BRAND.privacyUrl.startsWith(BRAND.website)).toBe(true);
    expect(BRAND.termsUrl.startsWith(BRAND.website)).toBe(true);
    const cfg = oku(join(KOK, 'app.config.ts'));
    expect(cfg).toContain("slug: 'bes'");
    expect(cfg).toContain("scheme: 'bes'");
  });

  it('geçici geliştirme adı depoda hiç kalmadı', () => {
    // Klasör, paket kimliği, adresler, akış dosyaları, depolama öneki ve
    // derin bağlantı şeması hep birlikte `bes` oldu (D21). Tek bir yerde
    // `sukun` kalırsa bağlantı kırılır ya da iki ad yan yana görünür.
    const suclular: string[] = [];
    for (const f of [
      ...dosyalar(join(KOK, 'src'), ['.ts', '.tsx']),
      ...dosyalar(join(KOK, 'app'), ['.ts', '.tsx']),
      ...dosyalar(join(KOK, 'store'), ['.md']),
      ...dosyalar(join(KOK, 'tools'), ['.js', '.sh']),
      ...dosyalar(DOCS, ['.html']),
      join(KOK, 'app.config.ts'),
      join(KOK, 'package.json'),
      join(KOK, 'src', 'config', 'brand.json'),
    ]) {
      if (/sukun/i.test(oku(f))) suclular.push(f.slice(KOK.length + 1));
    }
    expect(suclular).toEqual([]);
  });
});

describe('renk disiplini', () => {
  it('marka renkleri logonun kendisinden ölçülmüş', () => {
    // D18: paketin `brand.tokens.json`'u beş "önerilen değer" veriyor ama
    // onaylı logo onları kullanmıyor — zemin gradyan, altın rampa. Uygulama
    // düz önerilen değerleri kullandığı için logonun yanında yavan duruyordu.
    // Bu sınama masterı her çalıştığında yeniden ölçüp paletle karşılaştırır.
    const eslesme: [string, string][] = [
      ['emerald950', zeminDilimi(0.1)],
      ['emerald900', zeminDilimi(0.5)],
      ['emerald800', zeminDilimi(0.9)],
      ['gold500', altinDilimi(0.05)],
      ['gold400', altinDilimi(0.5)],
      ['gold300', altinDilimi(0.7)],
      ['gold200', altinDilimi(0.95)],
      ['ivory50', acikDilimi(0.9)],
      ['ivory100', acikDilimi(0.5)],
      ['ivory200', acikDilimi(0.1)],
      ['ink900', figurDilimi(0.5)],
    ];
    for (const [token, olculen] of eslesme) {
      const m = new RegExp(`${token}:\\s*'(#[0-9A-Fa-f]{6})'`).exec(PALET);
      const yazili = (m?.[1] ?? '').toUpperCase();
      // Kanal başına 2 birimlik pay: master değişirse fark hemen görünür,
      // JPEG benzeri yuvarlama gürültüsü ise sınamayı kırmaz.
      expect({ token, yazili, olculen, uyum: yazili !== '' && fark(yazili, olculen) <= 2 })
        .toEqual({ token, yazili, olculen, uyum: true });
    }
  });

  it('paketin önerdiği düz değerler artık kullanılmıyor', () => {
    // `#003F32` masterın zemin dağılımının en açık ucunda; düz kullanılınca
    // ikonun yanında açık ve yavan kalıyordu (kullanıcı bunu bildirdi).
    // Yalnız **değer** konumlarına bakılır; açıklama satırları eski değeri
    // neden bıraktığımızı anlatmak için anabilir.
    const degerler = [...PALET.matchAll(/:\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => (m[1] ?? '').toUpperCase());
    for (const eski of [TOKENS.colors.deepEmerald, TOKENS.colors.mutedGold, TOKENS.colors.warmIvory]) {
      expect({ eski, var: degerler.includes(eski.toUpperCase()) }).toEqual({ eski, var: false });
    }
  });

  it('zemin gradyanı masterın inişini taşıyor', () => {
    const tema = oku(join(KOK, 'src/theme/index.ts'));
    const koyu = tema.slice(tema.indexOf('export const darkTheme'));
    const acik = tema.slice(tema.indexOf('export const lightTheme'), tema.indexOf('export const darkTheme'));
    // Üst durak alt duraktan açık olmalı; ters çevrilirse ekran tepeden
    // aşağı açılıyor ve ikonla ters düşüyor.
    expect(koyu).toContain('backgroundGradient: [palette.emerald800, palette.emerald950]');
    expect(acik).toContain('backgroundGradient: [palette.ivory50, palette.ivory200]');
    // Marka kartı iki temada da ikonun kutucuğu gibi koyulaşır.
    expect(koyu).toContain('accentGradient: [palette.emerald600, palette.emerald950]');
    expect(acik).toContain('accentGradient: [palette.emerald600, palette.emerald900]');
  });

  it('marka yüzeyindeki altın iki temada da aynı — logodaki eşleşme', () => {
    const tema = oku(join(KOK, 'src/theme/index.ts'));
    const kez = [...tema.matchAll(/onAccentHighlight:\s*palette\.(\w+)/g)].map((m) => m[1]);
    expect(kez).toEqual(['gold400', 'gold400']);
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
