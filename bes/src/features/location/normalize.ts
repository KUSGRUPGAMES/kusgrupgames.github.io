/**
 * Türkçe ve Arapça arama normalizasyonu — şartname §78.
 *
 * Türkçe'de üç tuzak vardır ve üçü de burada çözülür:
 * 1. Noktasız ı / noktalı i. `'İSTANBUL'.toLowerCase()` çoğu yerde 'i̇stanbul'
 *    üretir (birleşik nokta ile) — "istanbul" ile eşleşmez.
 * 2. Kullanıcı şapkasız yazar: "sanliurfa" → "Şanlıurfa" bulunmalı.
 * 3. Arapça harekeler: arama metninde hareke olmamalı.
 */

const TR_MAP: Record<string, string> = {
  'ı': 'i', 'İ': 'i', 'I': 'i', 'i': 'i',
  'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
  'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o',
  'ç': 'c', 'Ç': 'c', 'â': 'a', 'Â': 'a',
  'î': 'i', 'Î': 'i', 'û': 'u', 'Û': 'u',
};

/** Arapça hareke ve tanvin işaretleri (U+064B–U+0652, U+0670, U+06D6–U+06ED). */
const ARABIC_MARKS = /[ً-ْٰۖ-ۭـ]/g;

/**
 * Aramada kullanılacak biçim: küçük harf, şapkasız, haresiz, tek boşluklu.
 * `toLowerCase` **kullanılmaz** — Türkçe I/İ tuzağı yüzünden harf harf eşlenir.
 */
export function normalizeSearch(input: string): string {
  let out = '';
  for (const ch of input) {
    const mapped = TR_MAP[ch];
    out += mapped ?? ch.toLowerCase();
  }
  return out
    .replace(ARABIC_MARKS, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Arama eşleşmesi: baştan eşleşme öne alınır, sonra içinde geçme. */
export function matchScore(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = normalizeSearch(haystack);
  const n = normalizeSearch(needle);
  if (h === n) return 3;
  if (h.startsWith(n)) return 2;
  if (h.includes(n)) return 1;
  return 0;
}
