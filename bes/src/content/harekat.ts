/**
 * Harekeler — Kur'an okumayı öğrenme modülünün ikinci basamağı.
 * Örnekler tutarlılık için hep "ب" (be) harfi üzerinde gösterilir.
 */

export interface Harake {
  id: string;
  order: number;
  name: string;
  /** "ب" üzerinde gösterilmiş örnek. */
  example: string;
  sound: string;
}

export const HAREKAT: readonly Harake[] = [
  { id: 'ustun', order: 1, name: 'Üstün (Fetha)', example: 'بَ', sound: 'Harfin üstüne konur, kısa "a" sesi verir.' },
  { id: 'esre', order: 2, name: 'Esre (Kesra)', example: 'بِ', sound: 'Harfin altına konur, kısa "i" sesi verir.' },
  { id: 'otre', order: 3, name: 'Ötre (Damme)', example: 'بُ', sound: 'Harfin üstüne konur, kısa "u" sesi verir.' },
  { id: 'sukun', order: 4, name: 'Sükun', example: 'بْ', sound: 'Harfin hareke almadan, sessiz okunduğunu gösterir.' },
  { id: 'sedde', order: 5, name: 'Şedde', example: 'بّ', sound: 'Harfin iki kez, vurgulu okunduğunu gösterir.' },
  { id: 'tenvin', order: 6, name: 'Tenvin', example: 'بًا بٍ بٌ', sound: 'Kelime sonunda görülür, harfe "n" sesi ekler.' },
];
