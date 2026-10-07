/**
 * Doğrulanmış Kur'an kelimeleri — DECISIONS D26.
 *
 * Veri `tools/learn-words.js` ile üretildi: kelimeler kendi Tanzil metnimizden,
 * ses dosyası numarası Quran Foundation ile tek tek eşleştirilerek. Burada
 * yalnız **seçim** yapılır; seçim belirlenimcidir (her açılışta aynı kelime).
 */
import data from '@/content/learnData.json';

export interface QuranWord {
  surah: number;
  ayah: number;
  /** Âyetteki sıra (1 tabanlı). */
  index: number;
  /** Quran Foundation ses dosyası numarası. */
  audio: number;
  text: string;
}

type Ham = { ayah: number; words: [string, number][] }[];
const SURELER = data.surahs as unknown as Record<string, Ham>;

export const PRACTICE_SURAHS: readonly number[] = data.practice;

const pad = (n: number) => String(n).padStart(3, '0');
export const WBW_BASE = 'https://audio.qurancdn.com/';
export function wordAudioUrl(w: Pick<QuranWord, 'surah' | 'ayah' | 'audio'>): string {
  return `${WBW_BASE}wbw/${pad(w.surah)}_${pad(w.ayah)}_${pad(w.audio)}.mp3`;
}

export function surahWords(surah: number): { ayah: number; words: QuranWord[] }[] {
  const ham = SURELER[String(surah)] ?? [];
  return ham.map((a) => ({
    ayah: a.ayah,
    words: a.words.map(([text, audio], i) => ({ surah, ayah: a.ayah, index: i + 1, audio, text })),
  }));
}

/** Seçim sırası: önce pratik sureleri (öğretim sırasıyla), sonra Amme cüzü. */
const HAVUZ: QuranWord[] = (() => {
  const sira = [...PRACTICE_SURAHS, ...Object.keys(SURELER).map(Number).filter((n) => !PRACTICE_SURAHS.includes(n))];
  return sira.flatMap((s) => surahWords(s).flatMap((a) => a.words));
})();

const HAREKE = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
/** Harf iskeleti: hareke ve işaretler atılmış, elif türleri birleştirilmiş. */
export function skeleton(text: string): string {
  return text.replace(HAREKE, '').replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي');
}

const TENVIN = /[ً-ٍ]/;
const SEDDE = /ّ/;
const CEZM = /[ْۡ]/;
/** Uzatma: üstün+elif, ötre+harekesiz vav, esre+harekesiz ye ya da dik elif.
 *  Kendi harekesi olan vav/ye (هُوَ, كُفُوًا) uzatma değil, ünsüzdür. */
const MED = /\u064E\u0627|\u064F\u0648(?![\u064B-\u0651])|\u0650\u064A(?![\u064B-\u0651])|\u0670/;

function tekil(liste: QuranWord[], adet: number): QuranWord[] {
  const gorulen = new Set<string>();
  const out: QuranWord[] = [];
  for (const w of liste) {
    const k = w.text;
    if (gorulen.has(k)) continue;
    gorulen.add(k);
    out.push(w);
    if (out.length >= adet) break;
  }
  return out;
}

/** Harfle başlayan, kısa ve açık bir Kur'an kelimesi. */
export function exampleForLetter(letter: string): QuranWord | null {
  const aday = HAVUZ.filter((w) => {
    const s = skeleton(w.text);
    if (letter === 'ا') return /^[أإ]/.test(w.text) && s.length >= 2;
    // "ve" ve "fe" bağlaçlı kelimeler harfi tanıtmak için kötü örnek.
    return s.startsWith(letter) && s.length >= 2;
  });
  const kisa = aday.filter((w) => skeleton(w.text).length <= 4);
  return (kisa[0] ?? aday[0]) ?? null;
}

/** Harfi içeren (başta değil) kelimeler — bitişme dersinde kullanılır. */
export function wordsContaining(letter: string, adet: number): QuranWord[] {
  return tekil(HAVUZ.filter((w) => skeleton(w.text).slice(1).includes(letter) && skeleton(w.text).length <= 5), adet);
}

export type WordFeature = 'cezm' | 'shadda' | 'tanween' | 'madd' | 'short' | 'long';

export function wordsWith(feature: WordFeature, adet: number): QuranWord[] {
  const uygun = (w: QuranWord) => {
    const s = skeleton(w.text);
    switch (feature) {
      case 'cezm': return CEZM.test(w.text) && !SEDDE.test(w.text) && s.length <= 4;
      case 'shadda': return SEDDE.test(w.text) && s.length <= 5;
      case 'tanween': return TENVIN.test(w.text) && s.length <= 5;
      case 'madd': return MED.test(w.text) && !SEDDE.test(w.text) && s.length <= 5;
      case 'short': return s.length >= 2 && s.length <= 3;
      case 'long': return s.length >= 5 && s.length <= 7;
    }
  };
  return tekil(HAVUZ.filter(uygun), adet);
}
