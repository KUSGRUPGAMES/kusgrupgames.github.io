/**
 * Kur'an okuma kursu — müfredat ve alıştırma üretimi (saf mantık).
 *
 * Sıra, Türkiye'deki elifbâ öğretimi ve Kaide-i Nurâniye ile aynıdır:
 * harfler → bitişme → harekeler → cezm/şedde → tenvin/med → kelime okuma →
 * kısa sureler. Her ders kartlar, dinleme ve bir alıştırmadan oluşur.
 *
 * Sesler (DECISIONS D26): harf adı ve heceler cihazın Arapça ses motoruyla
 * (`say`), Kur'an kelimeleri ve âyetler gerçek kıraatle çalınır.
 *
 * Alıştırmalar tohumlu karıştırmayla üretilir: aynı tohum aynı soruları
 * verir (sınanabilir), tekrar denemede tohum değişir (ezber olmaz).
 */
import { ARABIC_ALPHABET, type ArabicLetter } from '@/content/arabicAlphabet';
import { exampleForLetter, wordsContaining, wordsWith, PRACTICE_SURAHS, type QuranWord } from './words';

export interface Syllable { text: string }

export type Question =
  | { kind: 'hearLetter'; say: string; answer: string; options: string[] }
  | { kind: 'nameLetter'; letter: string; answer: string; options: string[] }
  | { kind: 'hearSyllable'; say: string; answer: string; options: string[] }
  | { kind: 'hearWord'; word: QuranWord; answer: string; options: string[] };

export type Step =
  | { kind: 'info'; title: string; body: string }
  | { kind: 'letter'; letter: ArabicLetter; example: QuranWord | null }
  | { kind: 'syllables'; title: string; body: string; items: Syllable[] }
  | { kind: 'words'; title: string; body: string; items: QuranWord[] }
  | { kind: 'quiz'; questions: Question[] }
  | { kind: 'surah'; surah: number };

export interface LessonMeta {
  id: string;
  unit: number;
  title: string;
  subtitle: string;
}

export interface Unit { no: number; title: string; description: string }

export const UNITS: readonly Unit[] = [
  { no: 1, title: 'Harfler', description: 'Elifbânın 28 harfini tanı, adlarını dinle.' },
  { no: 2, title: 'Harflerin bitişmesi', description: 'Harfler kelimede nasıl birleşir, hangileri bitişmez.' },
  { no: 3, title: 'Harekeler', description: 'Üstün, esre ve ötre ile ilk heceler.' },
  { no: 4, title: 'Cezm ve şedde', description: 'Sessiz harf ve iki kez okunan harf.' },
  { no: 5, title: 'Tenvin ve uzatma', description: 'Kelime sonundaki "n" sesi ve uzun okunan heceler.' },
  { no: 6, title: 'Kelime okuma', description: 'Kur’an’dan gerçek kelimeleri hafızın sesiyle oku.' },
  { no: 7, title: 'Kısa sureler', description: 'Öğrendiklerinle sure oku, kelime kelime dinle.' },
];

const HARF = (ids: string[]) => ids.map((id) => ARABIC_ALPHABET.find((l) => l.id === id)!);
const HARF_GRUPLARI: string[][] = [
  ['elif', 'be', 'te', 'se'],
  ['cim', 'ha', 'hi'],
  ['dal', 'zel', 'ra', 'ze'],
  ['sin', 'shin', 'sad', 'dad'],
  ['ti', 'zi', 'ayn', 'gayn'],
  ['fe', 'kaf', 'kef', 'lam'],
  ['mim', 'nun', 'vav', 'he', 'ye'],
];

const FETHA = 'َ';
const KESRA = 'ِ';
const DAMME = 'ُ';
const CEZM = 'ْ';

/** Hareke almış tek harf. Elif hareke alınca hemzeli yazılır. */
export function syllable(l: ArabicLetter, hareke: string): string {
  if (l.id === 'elif') return hareke === KESRA ? `إ${KESRA}` : `أ${hareke}`;
  return `${l.letter}${hareke}`;
}
/** Cezimli hece: üstünlü elif (hemze) + cezimli harf, ör. أَبْ. */
export function closedSyllable(l: ArabicLetter): string {
  return `أ${FETHA}${l.letter}${CEZM}`;
}

const SURE_ADLARI: Record<number, string> = {
  1: 'Fâtiha', 112: 'İhlâs', 113: 'Felak', 114: 'Nâs', 108: 'Kevser', 103: 'Asr',
  110: 'Nasr', 105: 'Fîl', 106: 'Kureyş', 107: 'Mâûn', 109: 'Kâfirûn', 111: 'Tebbet',
};

export const LESSONS: readonly LessonMeta[] = [
  ...HARF_GRUPLARI.map((g, i) => ({
    id: `harf-${i + 1}`, unit: 1,
    title: HARF(g).map((l) => l.name).join(' · '),
    subtitle: `${g.length} harf`,
  })),
  { id: 'harf-tekrar', unit: 1, title: 'Tekrar: bütün harfler', subtitle: 'Dinle ve bul' },
  { id: 'bitisme', unit: 2, title: 'Bitişen ve bitişmeyen harfler', subtitle: 'Harfin dört yazılışı' },
  { id: 'ustun', unit: 3, title: 'Üstün (fetha)', subtitle: 'Kısa "e/a" sesi' },
  { id: 'esre', unit: 3, title: 'Esre (kesra)', subtitle: 'Kısa "i" sesi' },
  { id: 'otre', unit: 3, title: 'Ötre (damme)', subtitle: 'Kısa "u" sesi' },
  { id: 'hareke-tekrar', unit: 3, title: 'Tekrar: üç hareke', subtitle: 'Dinle ve bul' },
  { id: 'cezm', unit: 4, title: 'Cezm (sükûn)', subtitle: 'Harekesiz harf' },
  { id: 'sedde', unit: 4, title: 'Şedde', subtitle: 'İki kez okunan harf' },
  { id: 'tenvin', unit: 5, title: 'Tenvin', subtitle: 'Kelime sonunda "n" sesi' },
  { id: 'med', unit: 5, title: 'Uzatma (med)', subtitle: 'Elif, vav ve ye ile uzatma' },
  { id: 'kelime-kisa', unit: 6, title: 'Kısa kelimeler', subtitle: 'İki-üç harfli kelimeler' },
  { id: 'kelime-uzun', unit: 6, title: 'Uzun kelimeler', subtitle: 'Beş harf ve üstü' },
  ...PRACTICE_SURAHS.map((s) => ({
    id: `sure-${s}`, unit: 7, title: `${SURE_ADLARI[s] ?? s} Sûresi`, subtitle: 'Kelime kelime oku',
  })),
];

export function lessonMeta(id: string): LessonMeta | undefined {
  return LESSONS.find((l) => l.id === id);
}

// ------------------------------------------------------------ karıştırma

/** Küçük, belirlenimci sözde rastgele üreteç (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function karistir<T>(arr: readonly T[], r: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Doğru cevap + havuzdan farklı üç çeldirici, karışık. */
function secenekler(dogru: string, havuz: readonly string[], r: () => number, adet = 4): string[] {
  const celdirici = karistir(havuz.filter((x) => x !== dogru), r).slice(0, adet - 1);
  return karistir([dogru, ...celdirici], r);
}

// --------------------------------------------------------------- sorular

const TUM_HARFLER = ARABIC_ALPHABET.map((l) => l.letter);
const TUM_ADLAR = ARABIC_ALPHABET.map((l) => l.name);

function harfSorulari(harfler: readonly ArabicLetter[], r: () => number, adet: number): Question[] {
  const out: Question[] = [];
  const sira = karistir(harfler, r);
  for (let i = 0; out.length < adet; i++) {
    const l = sira[i % sira.length]!;
    if (i % 2 === 0) {
      out.push({ kind: 'hearLetter', say: l.arName, answer: l.letter, options: secenekler(l.letter, TUM_HARFLER, r) });
    } else {
      out.push({ kind: 'nameLetter', letter: l.letter, answer: l.name, options: secenekler(l.name, TUM_ADLAR, r) });
    }
  }
  return out;
}

function heceSorulari(heceler: readonly string[], r: () => number, adet: number): Question[] {
  return karistir(heceler, r).slice(0, adet).map((h) => ({
    kind: 'hearSyllable' as const, say: h, answer: h, options: secenekler(h, heceler, r),
  }));
}

function kelimeSorulari(kelimeler: readonly QuranWord[], r: () => number, adet: number): Question[] {
  const metinler = kelimeler.map((w) => w.text);
  return karistir(kelimeler, r).slice(0, adet).map((w) => ({
    kind: 'hearWord' as const, word: w, answer: w.text, options: secenekler(w.text, metinler, r),
  }));
}

const harekeli = (hareke: string) => ARABIC_ALPHABET.map((l) => syllable(l, hareke));

// ------------------------------------------------------------------ dersler

/** Dersin adımlarını üretir. `attempt` tekrar denemede soruları değiştirir. */
export function buildLesson(id: string, attempt = 0): Step[] {
  const r = rng(hash(id) + attempt * 7919);

  const grupNo = /^harf-(\d)$/.exec(id);
  if (grupNo) {
    const harfler = HARF(HARF_GRUPLARI[Number(grupNo[1]) - 1]!);
    return [
      ...(id === 'harf-1' ? [{
        kind: 'info' as const,
        title: 'Elifbâya hoş geldin',
        body: 'Arapça sağdan sola okunur. Her kartta harfin şeklini gör, adını dinle ve Kur’an’dan bir örnekte hafızın sesiyle duy. Sonunda kısa bir alıştırma var.',
      }] : []),
      ...harfler.map((l) => ({ kind: 'letter' as const, letter: l, example: exampleForLetter(l.letter) })),
      { kind: 'quiz', questions: harfSorulari(harfler, r, Math.max(6, harfler.length * 2)) },
    ];
  }

  switch (id) {
    case 'harf-tekrar':
      return [
        { kind: 'info', title: 'Bütün harfler', body: 'Yirmi sekiz harfin hepsinden karışık sorular. Duyduğun harfi bul, gördüğün harfin adını seç.' },
        { kind: 'quiz', questions: harfSorulari(ARABIC_ALPHABET, r, 14) },
      ];
    case 'bitisme': {
      const bitismeyen = ARABIC_ALPHABET.filter((l) => !l.connects);
      return [
        { kind: 'info', title: 'Harfler bitişerek yazılır', body: 'Kelimede harfler birbirine bağlanır; bu yüzden bir harfin başta, ortada ve sonda farklı görünen yazılışları vardır. Her harf kartında dört yazılışı görebilirsin.' },
        { kind: 'info', title: 'Altı harf sonrakine bitişmez', body: `${bitismeyen.map((l) => `${l.name} (${l.letter})`).join(', ')}. Bu harflerden sonra gelen harf, kelimenin başındaymış gibi yazılır.` },
        ...bitismeyen.map((l) => ({ kind: 'letter' as const, letter: l, example: exampleForLetter(l.letter) })),
        { kind: 'words', title: 'Kelimenin içinde', body: 'Bu kelimelerde harfleri kelimenin ortasında ve sonunda gör. Dokun, hafızın sesiyle dinle.', items: [...wordsContaining('ب', 2), ...wordsContaining('ل', 2), ...wordsContaining('ر', 2)] },
        { kind: 'quiz', questions: harfSorulari(bitismeyen, r, 6) },
      ];
    }
    case 'ustun':
    case 'esre':
    case 'otre': {
      const hareke = id === 'ustun' ? FETHA : id === 'esre' ? KESRA : DAMME;
      const bilgi: [string, string] = ({
        ustun: ['Üstün (fetha)', 'Harfin üstüne konan eğik çizgi. Harfi kısa bir "e" ya da kalın harflerde "a" sesiyle okutur: بَ "be", صَ "sa".'],
        esre: ['Esre (kesra)', 'Harfin altına konan eğik çizgi. Harfi kısa bir "i" ya da kalın harflerde "ı" sesiyle okutur: بِ "bi", صِ "sı".'],
        otre: ['Ötre (damme)', 'Harfin üstüne konan küçük vav. Harfi ince harflerde kısa bir "ü", kalın harflerde "u" sesiyle okutur: بُ "bü", صُ "su".'],
      } as Record<string, [string, string]>)[id]!;
      const heceler = harekeli(hareke);
      return [
        { kind: 'info', title: bilgi[0], body: bilgi[1] },
        { kind: 'syllables', title: bilgi[0], body: 'Her heceye dokun ve dinle. Soldan sağa değil, sağdan sola ilerle.', items: heceler.map((text) => ({ text })) },
        { kind: 'quiz', questions: heceSorulari(heceler, r, 8) },
      ];
    }
    case 'hareke-tekrar': {
      const karisik = [...harekeli(FETHA), ...harekeli(KESRA), ...harekeli(DAMME)];
      return [
        { kind: 'info', title: 'Üç hareke birlikte', body: 'Aynı harf üç ayrı sesle okunabilir: بَ بِ بُ. Duyduğun heceyi bul.' },
        { kind: 'syllables', title: 'Aynı harf, üç ses', body: 'Dokun ve farkı dinle.', items: ARABIC_ALPHABET.slice(1, 7).flatMap((l) => [FETHA, KESRA, DAMME].map((h) => ({ text: syllable(l, h) }))) },
        { kind: 'quiz', questions: heceSorulari(karisik, r, 10) },
      ];
    }
    case 'cezm': {
      const heceler = ARABIC_ALPHABET.slice(1).map(closedSyllable);
      const kelimeler = wordsWith('cezm', 8);
      return [
        { kind: 'info', title: 'Cezm (sükûn)', body: 'Harfin üstündeki küçük daire harfin harekesiz, yani sessiz okunduğunu gösterir. Cezimli harf kendinden önceki harekeli harfe bağlanır: أَبْ "eb".' },
        { kind: 'syllables', title: 'Cezimli heceler', body: 'Dokun ve dinle.', items: heceler.map((text) => ({ text })) },
        { kind: 'words', title: 'Kur’an’dan kelimeler', body: 'Cezimli harfi bul, sonra dokunup hafızın sesiyle dinle.', items: kelimeler },
        { kind: 'quiz', questions: kelimeSorulari(kelimeler, r, 6) },
      ];
    }
    case 'sedde': {
      const kelimeler = wordsWith('shadda', 8);
      return [
        { kind: 'info', title: 'Şedde', body: 'Harfin üstündeki küçük "w" benzeri işaret, harfin iki kez okunduğunu gösterir: ilki cezimli, ikincisi harekeli. رَبِّ "Rab-bi" diye okunur.' },
        { kind: 'words', title: 'Kur’an’dan kelimeler', body: 'Şeddeli harfe dikkat et, dokunup dinle.', items: kelimeler },
        { kind: 'quiz', questions: kelimeSorulari(kelimeler, r, 6) },
      ];
    }
    case 'tenvin': {
      const kelimeler = wordsWith('tanween', 8);
      return [
        { kind: 'info', title: 'Tenvin', body: 'Çift üstün, çift esre ya da çift ötre kelimenin sonuna "n" sesi ekler: أَحَدٌ "ehadun". Durakta tenvin okunmaz.' },
        { kind: 'words', title: 'Kur’an’dan kelimeler', body: 'Dokun ve kelime sonundaki "n" sesini dinle.', items: kelimeler },
        { kind: 'quiz', questions: kelimeSorulari(kelimeler, r, 6) },
      ];
    }
    case 'med': {
      const kelimeler = wordsWith('madd', 8);
      return [
        { kind: 'info', title: 'Uzatma (med)', body: 'Üstünden sonra elif, ötreden sonra vav, esreden sonra ye gelirse hece uzatılarak okunur: قَالَ "kâle". Harfin üstündeki küçük dik elif de uzatır.' },
        { kind: 'words', title: 'Kur’an’dan kelimeler', body: 'Uzatılan heceyi dinle.', items: kelimeler },
        { kind: 'quiz', questions: kelimeSorulari(kelimeler, r, 6) },
      ];
    }
    case 'kelime-kisa':
    case 'kelime-uzun': {
      const kelimeler = wordsWith(id === 'kelime-kisa' ? 'short' : 'long', 10);
      return [
        { kind: 'info', title: id === 'kelime-kisa' ? 'Kısa kelimeler' : 'Uzun kelimeler', body: 'Önce kendin okumayı dene, sonra dokunup hafızın sesiyle karşılaştır.' },
        { kind: 'words', title: 'Oku ve dinle', body: 'Sağdan sola, hece hece.', items: kelimeler },
        { kind: 'quiz', questions: kelimeSorulari(kelimeler, r, 8) },
      ];
    }
  }

  const sure = /^sure-(\d+)$/.exec(id);
  if (sure) return [{ kind: 'surah', surah: Number(sure[1]) }];
  return [];
}

// ------------------------------------------------------------- değerlendirme

/** Doğruluk oranından yıldız: %90 ve üstü üç, %70 ve üstü iki, gerisi bir. */
export function starsFor(correct: number, total: number): 1 | 2 | 3 {
  if (total <= 0) return 3;
  const oran = correct / total;
  if (oran >= 0.9) return 3;
  if (oran >= 0.7) return 2;
  return 1;
}

/** Sıradaki ders: tamamlanmamış ilk ders; hepsi bittiyse null. */
export function nextLesson(done: ReadonlySet<string>): LessonMeta | null {
  return LESSONS.find((l) => !done.has(l.id)) ?? null;
}
