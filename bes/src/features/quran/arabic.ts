/**
 * Arapça arama normalizasyonu — şartname §35, §78.
 *
 * Kullanıcı mushaf metnini harekesiz ve sadeleştirilmiş yazar. Eşleşme için
 * metin şu adımlardan geçirilir:
 * - Harekeler ve Kur'an durak işaretleri atılır.
 * - Elif çeşitleri tek biçime indirilir (أ إ آ ٱ → ا).
 * - Tâ merbûta hâ'ya, elif maksûra yâ'ya çevrilir (ة → ه, ى → ي).
 * - Tatvîl (uzatma çizgisi) atılır.
 *
 * Bu dönüşüm **yalnız aramada** kullanılır; ekranda gösterilen metin her zaman
 * kaynaktaki hâliyle kalır (CONTENT_SOURCES kuralı 1: metin değiştirilmez).
 */

/** Harekeler, tenvin, sukûn, şedde ve Kur'an durak işaretleri. */
const MARKS = /[ً-ٰٟۖ-ۭ࣓-ࣿ]/g;
const TATWEEL = /ـ/g;

const MAP: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
  'ة': 'ه',
  'ى': 'ي',
  'ؤ': 'و',
  'ئ': 'ي',
};

export function normalizeArabic(input: string): string {
  let out = '';
  for (const ch of input.replace(MARKS, '').replace(TATWEEL, '')) {
    out += MAP[ch] ?? ch;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Arama sorgusu metinde geçiyor mu (her ikisi de normalize edilerek). */
export function arabicIncludes(haystack: string, needle: string): boolean {
  const n = normalizeArabic(needle);
  if (n.length === 0) return false;
  return normalizeArabic(haystack).includes(n);
}
