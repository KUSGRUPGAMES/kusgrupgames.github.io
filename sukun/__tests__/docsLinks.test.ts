/**
 * Yayın sayfalarının bağlantı denetimi — şartname §90, §91.
 *
 * `brand.json` içindeki `termsUrl`, `docs/sukun/terms.html` adresini
 * gösteriyordu ama o dosya yoktu: sayfa 404 veriyordu ve İngilizce gizlilik
 * sayfasının menüsü de olmayan iki sayfaya bağlanıyordu. App Review hem
 * gizlilik hem koşul adresini açar; kırık bağlantı doğrudan ret sebebidir.
 *
 * Bu sınama üç şeye bakar:
 *  1. `docs/sukun/` içindeki her yerel bağlantı gerçekten bir dosyaya gider.
 *  2. `brand.json` içindeki adresler o klasördeki dosyalara karşılık gelir.
 *  3. Her sayfanın Türkçe/İngilizce karşılığı var.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = join(__dirname, '..', '..', 'docs', 'sukun');
const BRAND = JSON.parse(
  readFileSync(join(__dirname, '..', 'src', 'config', 'brand.json'), 'utf8'),
) as { website: string; privacyUrl: string; termsUrl: string };

const sayfalar = readdirSync(DOCS).filter((f) => f.endsWith('.html'));

/** `href="..."` değerlerinden yalnız yerel dosya adları. */
function yerelBaglantilar(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const h = m[1] ?? '';
    if (/^(https?:|mailto:|#)/.test(h)) continue;
    out.push(h.split('#')[0] ?? '');
  }
  return out.filter(Boolean);
}

describe('yayın sayfaları', () => {
  it('sayfa kümesi eksiksiz', () => {
    expect(sayfalar.sort()).toEqual([
      'destek.html', 'gizlilik.html', 'index.html', 'kosullar.html',
      'privacy.html', 'support.html', 'terms.html',
    ]);
  });

  it('hiçbir yerel bağlantı boşa çıkmıyor', () => {
    const kirik: string[] = [];
    for (const sayfa of sayfalar) {
      for (const hedef of yerelBaglantilar(readFileSync(join(DOCS, sayfa), 'utf8'))) {
        if (!existsSync(join(DOCS, hedef))) kirik.push(`${sayfa} → ${hedef}`);
      }
    }
    expect(kirik).toEqual([]);
  });

  it('brand.json adresleri var olan sayfaları gösteriyor', () => {
    const taban = BRAND.website.replace(/\/$/, '');
    for (const [ad, adres] of [['privacyUrl', BRAND.privacyUrl], ['termsUrl', BRAND.termsUrl]] as const) {
      expect({ ad, tabanla: adres.startsWith(taban) }).toEqual({ ad, tabanla: true });
      const dosya = adres.slice(taban.length + 1);
      expect({ ad, dosya, var: existsSync(join(DOCS, dosya)) }).toEqual({ ad, dosya, var: true });
    }
  });

  it('her sayfanın diğer dildeki karşılığı var', () => {
    const ciftler: [string, string][] = [
      ['gizlilik.html', 'privacy.html'],
      ['kosullar.html', 'terms.html'],
      ['destek.html', 'support.html'],
    ];
    for (const [tr, en] of ciftler) {
      const trMetin = readFileSync(join(DOCS, tr), 'utf8');
      const enMetin = readFileSync(join(DOCS, en), 'utf8');
      expect({ tr, en, trBaglar: trMetin.includes(`href="${en}"`) })
        .toEqual({ tr, en, trBaglar: true });
      expect({ tr, en, enBaglar: enMetin.includes(`href="${tr}"`) })
        .toEqual({ tr, en, enBaglar: true });
    }
  });

  it('İngilizce sayfalar gerçekten İngilizce', () => {
    for (const en of ['privacy.html', 'terms.html', 'support.html']) {
      const s = readFileSync(join(DOCS, en), 'utf8');
      expect({ en, dil: /<html lang="en"/.test(s) }).toEqual({ en, dil: true });
    }
  });
});
