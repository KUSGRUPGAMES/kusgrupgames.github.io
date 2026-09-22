/**
 * Yön (LTR/RTL) — saf mantık. Şartname §10.
 * Bu dosya **React Native'e bağlı değildir**; böylece düğüm ortamında sınanır.
 * Platforma dokunan kısım `rtl.ts` içindedir.
 *
 * Arayüz dili beş dilden biridir; yalnız Arapça RTL'dir ve seçildiğinde tüm
 * düzen aynalanır (React Native köprüsü: `rtl.ts`). Bağımsız olarak,
 * **Kur'an ve dua metni her zaman RTL akar** — arayüz dili ne olursa olsun.
 * Bu ikisi karıştırılmamalıdır: aşağıdaki iki ayrı işlev tam da bunu ayırır.
 *
 * `UiLanguage` bir zamanlar yalnız üç dildi (Almanca ve Fransızca sonra
 * eklendi) ve çağıran taraf listeyi elle daraltıyordu. Sonuç: Arapçadan
 * Almancaya geçen kullanıcıda `forceRTL(false)` hiç çağrılmıyor, arayüz
 * aynalanmış kalıyordu. Tip artık desteklenen bütün dilleri kapsar.
 */

export type UiLanguage = 'tr' | 'en' | 'ar' | 'de' | 'fr';
export type Direction = 'ltr' | 'rtl';

export const RTL_LANGUAGES: readonly UiLanguage[] = ['ar'];

/** Arayüz dilinin yönü. */
export function uiDirection(lang: UiLanguage): Direction {
  return RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
}

/** Dinî metin (Kur'an, dua, zikir) daima sağdan sola akar. */
export const SCRIPTURE_DIRECTION: Direction = 'rtl';

/** Arapça metnin hizası — arayüz yönünden bağımsızdır. */
export const SCRIPTURE_ALIGN = 'right' as const;

/**
 * Metinde Arapça harf var mı — karışık metinde doğru yönü seçmek için.
 * Arap bloğu (0600–06FF), Arapça ek (0750–077F), sunum biçimleri (FB50–FDFF, FE70–FEFF).
 */
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function containsArabic(text: string): boolean {
  return ARABIC_RANGE.test(text);
}

/** Verilen metnin kendi doğal yönü. */
export function textDirection(text: string): Direction {
  return containsArabic(text) ? 'rtl' : 'ltr';
}
