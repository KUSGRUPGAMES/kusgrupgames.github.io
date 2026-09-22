/**
 * Gömülü metin denetimi — şartname §61.
 *
 * Ekran dosyalarında kullanıcıya görünen metin doğrudan yazılamaz; `t()`
 * üzerinden gelmelidir. Bu sınama, kuralı kod incelemesine bırakmaz.
 *
 * Denetlenen: `app/` (ekranlar) ve `src/features/**\/*.tsx` (ekran parçaları).
 * `src/ui/` denetlenmez: oradaki bileşenler metni dışarıdan alır, kendileri
 * metin yazmaz — zaten yazsalardı bu sınama onları da yakalardı.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

function tsxFiles(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out = out.concat(tsxFiles(full));
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/**
 * JSX içindeki düz metin: `<Text>Merhaba</Text>`.
 * Kapanış etiketi (`</`) şart: aksi hâlde `a > b` karşılaştırması ve
 * `useMemo<T>` gibi tip parametreleri metin sanılır.
 */
const JSX_TEXT = />\s*([^<>{}\n][^<>{}]*?)\s*<\//g;
/** Kullanıcıya görünen prop'lara verilen düz metin: title="Merhaba" */
const TEXT_PROP = /\b(title|subtitle|label|description|accessibilityLabel|accessibilityHint|value|actionLabel|retryLabel)\s*=\s*"([^"]+)"/g;

/** Metin sayılmayanlar: noktalama, tek simge, sayı. */
function anlamliMetin(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  if (/^[\d\s.,:;/|·—–-]+$/.test(t)) return false;
  return /\p{L}/u.test(t);
}

describe('gömülü metin yok', () => {
  const dosyalar = [...tsxFiles(join(ROOT, 'app')), ...tsxFiles(join(ROOT, 'src', 'features'))];

  it('denetlenecek dosya bulunur', () => {
    expect(dosyalar.length).toBeGreaterThan(0);
  });

  it.each(dosyalar)('%s içinde düz metin yok', (dosya) => {
    const kaynak = readFileSync(dosya, 'utf8');
    // Yorum satırları denetim dışı: açıklama Türkçe yazılır.
    const kod = kaynak.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

    const bulunanlar: string[] = [];
    for (const m of kod.matchAll(JSX_TEXT)) {
      const metin = m[1] ?? '';
      if (anlamliMetin(metin)) bulunanlar.push(metin);
    }
    for (const m of kod.matchAll(TEXT_PROP)) {
      const metin = m[2] ?? '';
      if (anlamliMetin(metin)) bulunanlar.push(`${m[1]}="${metin}"`);
    }
    expect(bulunanlar).toEqual([]);
  });
});
