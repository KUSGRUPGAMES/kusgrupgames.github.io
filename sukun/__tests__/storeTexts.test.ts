/**
 * Mağaza metinleri — şartname §90, §91.
 *
 * Apple ve Google alan uzunluklarını **gönderim anında** reddeder; o noktada
 * hata bulmak pahalıdır. Sınırlar burada, yazarken denetlenir.
 *
 * Ayrıca mağaza adının `brand.json` ile birebir aynı olduğuna bakılır:
 * iki yerde ayrı ad yazmak, uygulamanın içindeki adla mağaza kaydının
 * tutmaması demektir.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KOK = join(__dirname, '..');
const oku = (p: string) => readFileSync(join(KOK, p), 'utf8');

const BRAND = JSON.parse(oku('src/config/brand.json')) as { storeName: string; appName: string };

/** `## Başlık` altındaki ilk ``` bloğunun içeriği. */
function blok(metin: string, baslik: string): string {
  const i = metin.indexOf(`## ${baslik}`);
  if (i < 0) throw new Error(`bölüm yok: ${baslik}`);
  const ac = metin.indexOf('```', i);
  const kapa = metin.indexOf('```', ac + 3);
  if (ac < 0 || kapa < 0) throw new Error(`kod bloğu yok: ${baslik}`);
  return metin.slice(ac + 3, kapa).trim();
}

const APPSTORE = oku('store/app-store.md');
const PLAY = oku('store/play-store.md');

describe('App Store alanları', () => {
  const sinirlar: [string, number][] = [
    ['Ad (30 karakter sınırı)', 30],
    ['Alt başlık (30 karakter sınırı)', 30],
    ['Anahtar kelimeler (100 karakter sınırı, virgülle, boşluksuz)', 100],
    ['Tanıtım metni (170 karakter sınırı)', 170],
    ['Açıklama (4000 karakter sınırı)', 4000],
  ];

  for (const [baslik, sinir] of sinirlar) {
    it(`${baslik.split(' (')[0]} sınıra sığıyor`, () => {
      const uzunluk = blok(APPSTORE, baslik).length;
      expect({ baslik, uzunluk, sigiyor: uzunluk <= sinir }).toEqual({ baslik, uzunluk, sigiyor: true });
    });
  }

  it('anahtar kelimelerde boşluk yok', () => {
    // App Store virgülden sonraki boşluğu da karakter sayar; boşa harcanır.
    expect(blok(APPSTORE, 'Anahtar kelimeler (100 karakter sınırı, virgülle, boşluksuz)')).not.toMatch(/\s/);
  });

  it('anahtar kelimeler başlıkta ve alt başlıkta geçen kelimeleri tekrar etmiyor', () => {
    // Üç alan birlikte taranır; tekrar eden kelime 100 karakterden boşuna yer.
    const gorunur = new Set(
      `${blok(APPSTORE, 'Ad (30 karakter sınırı)')} ${blok(APPSTORE, 'Alt başlık (30 karakter sınırı)')}`
        .toLocaleLowerCase('tr')
        .split(/[^\p{L}]+/u)
        .filter(Boolean),
    );
    const tekrar = blok(APPSTORE, 'Anahtar kelimeler (100 karakter sınırı, virgülle, boşluksuz)')
      .toLocaleLowerCase('tr')
      .split(',')
      .filter((k) => gorunur.has(k));
    expect(tekrar).toEqual([]);
  });
});

describe('Google Play alanları', () => {
  const sinirlar: [string, number][] = [
    ['Uygulama adı (30 karakter sınırı)', 30],
    ['Kısa açıklama (80 karakter sınırı)', 80],
    ['Tam açıklama (4000 karakter sınırı)', 4000],
  ];

  for (const [baslik, sinir] of sinirlar) {
    it(`${baslik.split(' (')[0]} sınıra sığıyor`, () => {
      const uzunluk = blok(PLAY, baslik).length;
      expect({ baslik, uzunluk, sigiyor: uzunluk <= sinir }).toEqual({ baslik, uzunluk, sigiyor: true });
    });
  }
});

describe('ad tutarlılığı', () => {
  it('iki mağazada ve brand.json içinde aynı ad', () => {
    const ios = blok(APPSTORE, 'Ad (30 karakter sınırı)');
    const play = blok(PLAY, 'Uygulama adı (30 karakter sınırı)');
    expect({ ios, play, brand: BRAND.storeName }).toEqual({ ios, play: ios, brand: ios });
  });

  it('mağaza adı marka adıyla başlıyor', () => {
    // "Ezan Vakti" bize ait değil, "Sükûn" ait. Marka önde durur.
    expect(BRAND.storeName.startsWith(BRAND.appName)).toBe(true);
  });

  it('adda yanıltıcı ya da başkasına ait sözcük yok', () => {
    // "Pro": uygulama ücretsiz, Pro yalnız bir katman — Apple reddedebiliyor.
    // "Diyanet": kurum adı, izinsiz kullanımı uygulamayı kaldırtır.
    const yasak = ['pro', 'diyanet', 'resmi', 'official'];
    const kelimeler = BRAND.storeName.toLocaleLowerCase('tr').split(/[^\p{L}]+/u);
    expect(kelimeler.filter((k) => yasak.includes(k))).toEqual([]);
  });
});
