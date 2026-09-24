/**
 * Arap alfabesi (elifbâ) — Kur'an okuma kursunun ilk ünitesi.
 *
 * Harf adları, sırası ve şekilleri standart elifbâ dizilişidir (28 harf).
 * `arName` cihazın Arapça ses motoruna harfin adını söyletmek içindir.
 * `soundHint` **basit bir başlangıç yaklaşıklamasıdır**; doğru mahreç bir
 * hocadan öğrenilir (ekranda ayrıca yazılıdır).
 *
 * `connects`: harf kendinden sonraki harfe bitişir mi. Bitişmeyen altı harf
 * (ا د ذ ر ز و) elifbâ öğretiminin sabit konusudur.
 *
 * Örnek kelimeler burada elle yazılmaz; `features/learn/words.ts`
 * doğrulanmış Kur'an kelimelerinden seçer (DECISIONS D26).
 */

export interface ArabicLetter {
  id: string;
  order: number;
  /** Türkçe okunuşu. */
  name: string;
  /** Arapça adı — ses motoru için. */
  arName: string;
  /** Tek başına (izole) şekli. */
  letter: string;
  soundHint: string;
  connects: boolean;
}

export const ARABIC_ALPHABET: readonly ArabicLetter[] = [
  { id: 'elif', order: 1, name: 'Elif', arName: 'أَلِف', letter: 'ا', connects: false, soundHint: 'Hareke alınca hemze gibi okunur; harekesiz uzatma harfidir' },
  { id: 'be', order: 2, name: 'Be', arName: 'بَاء', letter: 'ب', connects: true, soundHint: 'Türkçe "b" sesine yakın' },
  { id: 'te', order: 3, name: 'Te', arName: 'تَاء', letter: 'ت', connects: true, soundHint: 'Türkçe "t" sesine yakın, ince' },
  { id: 'se', order: 4, name: 'Se', arName: 'ثَاء', letter: 'ث', connects: true, soundHint: 'Dil ucu ön dişlere hafifçe değerek, peltek bir "s"' },
  { id: 'cim', order: 5, name: 'Cim', arName: 'جِيم', letter: 'ج', connects: true, soundHint: 'Türkçe "c" sesine yakın' },
  { id: 'ha', order: 6, name: 'Ha', arName: 'حَاء', letter: 'ح', connects: true, soundHint: 'Boğazın ortasından, hırıltısız ve sert bir "h"' },
  { id: 'hi', order: 7, name: 'Hı', arName: 'خَاء', letter: 'خ', connects: true, soundHint: 'Boğazın üst kısmından, hırıltılı bir "h"' },
  { id: 'dal', order: 8, name: 'Dal', arName: 'دَال', letter: 'د', connects: false, soundHint: 'Türkçe "d" sesine yakın' },
  { id: 'zel', order: 9, name: 'Zel', arName: 'ذَال', letter: 'ذ', connects: false, soundHint: 'Dil ucu ön dişlere hafifçe değerek, peltek bir "z"' },
  { id: 'ra', order: 10, name: 'Ra', arName: 'رَاء', letter: 'ر', connects: false, soundHint: 'Türkçe "r" sesine yakın, çoğunlukla kalın' },
  { id: 'ze', order: 11, name: 'Ze', arName: 'زَاي', letter: 'ز', connects: false, soundHint: 'Türkçe "z" sesine yakın' },
  { id: 'sin', order: 12, name: 'Sin', arName: 'سِين', letter: 'س', connects: true, soundHint: 'Türkçe "s" sesine yakın' },
  { id: 'shin', order: 13, name: 'Şın', arName: 'شِين', letter: 'ش', connects: true, soundHint: 'Türkçe "ş" sesine yakın' },
  { id: 'sad', order: 14, name: 'Sad', arName: 'صَاد', letter: 'ص', connects: true, soundHint: 'Kalın bir "s"' },
  { id: 'dad', order: 15, name: 'Dad', arName: 'ضَاد', letter: 'ض', connects: true, soundHint: 'Dilin yanlarından çıkan kalın bir "d"' },
  { id: 'ti', order: 16, name: 'Tı', arName: 'طَاء', letter: 'ط', connects: true, soundHint: 'Kalın bir "t"' },
  { id: 'zi', order: 17, name: 'Zı', arName: 'ظَاء', letter: 'ظ', connects: true, soundHint: 'Dil ucu dişlere değerek, kalın ve peltek bir "z"' },
  { id: 'ayn', order: 18, name: 'Ayn', arName: 'عَيْن', letter: 'ع', connects: true, soundHint: 'Boğazın ortasından, sıkıştırılarak çıkan kendine özgü bir ses' },
  { id: 'gayn', order: 19, name: 'Ğayn', arName: 'غَيْن', letter: 'غ', connects: true, soundHint: 'Boğazın üst kısmından, gargaraya benzer bir "ğ"' },
  { id: 'fe', order: 20, name: 'Fe', arName: 'فَاء', letter: 'ف', connects: true, soundHint: 'Türkçe "f" sesine yakın' },
  { id: 'kaf', order: 21, name: 'Kaf', arName: 'قَاف', letter: 'ق', connects: true, soundHint: 'Dilin en gerisinden, kalın bir "k"' },
  { id: 'kef', order: 22, name: 'Kef', arName: 'كَاف', letter: 'ك', connects: true, soundHint: 'Türkçe ince "k" sesine yakın' },
  { id: 'lam', order: 23, name: 'Lam', arName: 'لَام', letter: 'ل', connects: true, soundHint: 'Türkçe "l" sesine yakın' },
  { id: 'mim', order: 24, name: 'Mim', arName: 'مِيم', letter: 'م', connects: true, soundHint: 'Türkçe "m" sesine yakın' },
  { id: 'nun', order: 25, name: 'Nun', arName: 'نُون', letter: 'ن', connects: true, soundHint: 'Türkçe "n" sesine yakın' },
  { id: 'vav', order: 26, name: 'Vav', arName: 'وَاو', letter: 'و', connects: false, soundHint: 'Dudaklar yuvarlanarak bir "v"; harekesiz uzatma harfidir' },
  { id: 'he', order: 27, name: 'He', arName: 'هَاء', letter: 'ه', connects: true, soundHint: 'Boğazın en dibinden, yumuşak bir "h"' },
  { id: 'ye', order: 28, name: 'Ye', arName: 'يَاء', letter: 'ي', connects: true, soundHint: 'Türkçe "y" sesine yakın; harekesiz uzatma harfidir' },
];

/** Harfin dört yazılışı. Sıfır genişlikli birleştirici (ZWJ) yazı tipinin
 *  bağlamsal şekli seçmesini sağlar; bitişmeyen harfte baş ve orta şekil
 *  kendiliğinden tek/son şekille aynı çıkar — bu doğru davranıştır. */
const ZWJ = '‍';
export function letterForms(letter: string): { isolated: string; initial: string; medial: string; final: string } {
  return {
    isolated: letter,
    initial: `${letter}${ZWJ}`,
    medial: `${ZWJ}${letter}${ZWJ}`,
    final: `${ZWJ}${letter}`,
  };
}
