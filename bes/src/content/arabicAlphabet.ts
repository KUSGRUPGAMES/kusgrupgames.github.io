/**
 * Arap alfabesi (elifbâ) — Kur'an okumayı öğrenme modülünün ilk basamağı.
 *
 * İçerik durumu: harf adları, sırası ve şekilleri standart elifbâ dizilişidir
 * (28 harf), tartışmalı değildir. `soundHint` alanı **basit bir başlangıç
 * yaklaşıklamasıdır** — tam mahreç (çıkış noktası) bir hocadan öğrenilir; bu
 * uygulama onun yerine geçmez (ekranda ayrıca yazılıdır).
 *
 * Örnek kelimeler harfin gerçek bir kelimede nasıl bağlandığını göstermek
 * içindir: harfi elle "başta/ortada/sonda" biçimine sokmak yerine, Arapça
 * metin dizilimi bunu otomatik yapar — doğru şekil zaten kelimenin içinde
 * görünür.
 */

export interface ArabicLetter {
  id: string;
  order: number;
  /** Türkçe okunuşu. */
  name: string;
  /** Tek başına (izole) şekli. */
  letter: string;
  /** Kısa, basit bir telaffuz yaklaşıklaması. */
  soundHint: string;
  /** Harfi içeren örnek kelime. */
  example: string;
  exampleMeaning: string;
}

export const ARABIC_ALPHABET: readonly ArabicLetter[] = [
  { id: 'elif', order: 1, name: 'Elif', letter: 'ا', soundHint: 'Uzun "a" sesi taşır, tek başına sessizdir', example: 'اسم', exampleMeaning: 'isim' },
  { id: 'be', order: 2, name: 'Be', letter: 'ب', soundHint: 'Türkçe "b" sesine yakın', example: 'باب', exampleMeaning: 'kapı' },
  { id: 'te', order: 3, name: 'Te', letter: 'ت', soundHint: 'Türkçe "t" sesine yakın', example: 'تمر', exampleMeaning: 'hurma' },
  { id: 'se', order: 4, name: 'Se', letter: 'ث', soundHint: 'İngilizce "think" kelimesindeki "th" sesine yakın', example: 'ثوب', exampleMeaning: 'elbise' },
  { id: 'cim', order: 5, name: 'Cim', letter: 'ج', soundHint: 'Türkçe "c" sesine yakın', example: 'جبل', exampleMeaning: 'dağ' },
  { id: 'ha', order: 6, name: 'Ha', letter: 'ح', soundHint: 'Boğazın ortasından, yumuşak bir "h"', example: 'حليب', exampleMeaning: 'süt' },
  { id: 'hi', order: 7, name: 'Hı', letter: 'خ', soundHint: 'Boğazdan, Türkçe "h"den daha kalın bir ses', example: 'خبز', exampleMeaning: 'ekmek' },
  { id: 'dal', order: 8, name: 'Dal', letter: 'د', soundHint: 'Türkçe "d" sesine yakın', example: 'دار', exampleMeaning: 'ev' },
  { id: 'zel', order: 9, name: 'Zel', letter: 'ذ', soundHint: 'İngilizce "this" kelimesindeki "th" sesine yakın', example: 'ذهب', exampleMeaning: 'altın' },
  { id: 'ra', order: 10, name: 'Ra', letter: 'ر', soundHint: 'Türkçe "r" sesine yakın, tek vuruşlu', example: 'رزق', exampleMeaning: 'rızık' },
  { id: 'ze', order: 11, name: 'Ze', letter: 'ز', soundHint: 'Türkçe "z" sesine yakın', example: 'زيت', exampleMeaning: 'zeytinyağı' },
  { id: 'sin', order: 12, name: 'Sin', letter: 'س', soundHint: 'Türkçe "s" sesine yakın', example: 'سماء', exampleMeaning: 'gökyüzü' },
  { id: 'shin', order: 13, name: 'Şın', letter: 'ش', soundHint: 'Türkçe "ş" sesine yakın', example: 'شمس', exampleMeaning: 'güneş' },
  { id: 'sad', order: 14, name: 'Sad', letter: 'ص', soundHint: 'Kalın, dilin damağa yaslanmasıyla çıkan bir "s"', example: 'صبر', exampleMeaning: 'sabır' },
  { id: 'dad', order: 15, name: 'Dad', letter: 'ض', soundHint: 'Kalın, dilin kenarlarından çıkan bir "d"', example: 'ضوء', exampleMeaning: 'ışık' },
  { id: 'ti', order: 16, name: 'Tı', letter: 'ط', soundHint: 'Kalın, dilin damağa yaslanmasıyla çıkan bir "t"', example: 'طعام', exampleMeaning: 'yemek' },
  { id: 'zi', order: 17, name: 'Zı', letter: 'ظ', soundHint: 'Kalın bir "z" ile "d" arası ses', example: 'ظل', exampleMeaning: 'gölge' },
  { id: 'ayn', order: 18, name: 'Ayn', letter: 'ع', soundHint: 'Boğazın en dibinden, kendine özgü bir ses', example: 'علم', exampleMeaning: 'ilim' },
  { id: 'gayn', order: 19, name: 'Ğayn', letter: 'غ', soundHint: 'Boğazdan, Fransızca "r"ye benzer bir ses', example: 'غنم', exampleMeaning: 'koyun' },
  { id: 'fe', order: 20, name: 'Fe', letter: 'ف', soundHint: 'Türkçe "f" sesine yakın', example: 'فجر', exampleMeaning: 'şafak' },
  { id: 'kaf', order: 21, name: 'Kaf', letter: 'ق', soundHint: 'Boğazın en gerisinden, kalın bir "k"', example: 'قلب', exampleMeaning: 'kalp' },
  { id: 'kef', order: 22, name: 'Kef', letter: 'ك', soundHint: 'Türkçe "k" sesine yakın', example: 'كتاب', exampleMeaning: 'kitap' },
  { id: 'lam', order: 23, name: 'Lam', letter: 'ل', soundHint: 'Türkçe "l" sesine yakın', example: 'ليل', exampleMeaning: 'gece' },
  { id: 'mim', order: 24, name: 'Mim', letter: 'م', soundHint: 'Türkçe "m" sesine yakın', example: 'ماء', exampleMeaning: 'su' },
  { id: 'nun', order: 25, name: 'Nun', letter: 'ن', soundHint: 'Türkçe "n" sesine yakın', example: 'نور', exampleMeaning: 'ışık/nur' },
  { id: 'vav', order: 26, name: 'Vav', letter: 'و', soundHint: 'Türkçe "v" sesine, bazen uzun "u" sesine yakın', example: 'وقت', exampleMeaning: 'zaman' },
  { id: 'he', order: 27, name: 'He', letter: 'ه', soundHint: 'Yumuşak bir "h" sesi', example: 'هواء', exampleMeaning: 'hava' },
  { id: 'ye', order: 28, name: 'Ye', letter: 'ي', soundHint: 'Türkçe "y" sesine, bazen uzun "i" sesine yakın', example: 'يد', exampleMeaning: 'el' },
];
