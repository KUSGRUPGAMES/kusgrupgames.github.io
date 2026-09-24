import { ARABIC_ALPHABET, letterForms } from '@/content/arabicAlphabet';
import { containsArabic } from '@/lib/i18n/direction';
import {
  LESSONS, UNITS, buildLesson, starsFor, nextLesson, syllable, closedSyllable, type Question,
} from '@/features/learn/course';
import {
  surahWords, exampleForLetter, wordsWith, wordAudioUrl, skeleton, PRACTICE_SURAHS,
} from '@/features/learn/words';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const quran = require('../assets/quran/quran.json') as { ayahs: { surah: number; ayah: number; text: string }[] };

describe('elifbâ — harfler', () => {
  it('28 harf eksiksiz, sıra ve kimlik tekil', () => {
    expect(ARABIC_ALPHABET).toHaveLength(28);
    expect(new Set(ARABIC_ALPHABET.map((h) => h.id)).size).toBe(28);
    expect(ARABIC_ALPHABET.map((h) => h.order)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1));
  });

  it('bitişmeyen harfler tam olarak altı tanedir: ا د ذ ر ز و', () => {
    expect(ARABIC_ALPHABET.filter((l) => !l.connects).map((l) => l.letter).join('')).toBe('ادذرزو');
  });

  it('Arapça adlar gerçekten Arapça ve harfle başlıyor (elif hariç hemzeli)', () => {
    for (const l of ARABIC_ALPHABET) {
      expect(containsArabic(l.arName)).toBe(true);
      if (l.id !== 'elif') expect(skeleton(l.arName)[0]).toBe(l.letter);
    }
  });

  it('dört yazılış harfin kendisini içerir', () => {
    for (const l of ARABIC_ALPHABET) {
      const f = letterForms(l.letter);
      for (const v of Object.values(f)) expect(v.includes(l.letter)).toBe(true);
    }
  });
});

describe('Kur’an kelimeleri — doğrulanmış veri', () => {
  it('pratik surelerinin her kelimesi kendi Tanzil metnimizde aynı sırada', () => {
    for (const s of PRACTICE_SURAHS) {
      for (const a of surahWords(s)) {
        const kayit = quran.ayahs.find((x) => x.surah === s && x.ayah === a.ayah)!;
        let metin = kayit.text.split(/\s+/);
        if (a.ayah === 1 && s !== 1 && s !== 9) metin = metin.slice(4);
        expect(a.words.map((w) => w.text)).toEqual(metin);
      }
    }
  });

  it('her harf için Kur’an’dan, o harfle başlayan bir örnek bulunur', () => {
    for (const l of ARABIC_ALPHABET) {
      const w = exampleForLetter(l.letter);
      expect({ harf: l.name, bulundu: w !== null }).toEqual({ harf: l.name, bulundu: true });
      if (l.id === 'elif') expect(/^[أإ]/.test(w!.text)).toBe(true);
      else expect(skeleton(w!.text).startsWith(l.letter)).toBe(true);
    }
  });

  it('ses adresi Quran Foundation kelime kelime biçiminde', () => {
    const w = surahWords(112)[0]!.words[3]!;
    expect(wordAudioUrl(w)).toBe('https://audio.qurancdn.com/wbw/112_001_004.mp3');
  });

  it('konu kelimeleri konusuna uyar', () => {
    for (const w of wordsWith('shadda', 8)) expect(w.text.includes('ّ')).toBe(true);
    for (const w of wordsWith('tanween', 8)) expect(/[ً-ٍ]/.test(w.text)).toBe(true);
    const med = wordsWith('madd', 8).map((w) => w.text);
    expect(med).not.toContain('هُوَ');
    expect(med).not.toContain('كُفُوًا');
    expect(wordsWith('shadda', 8)).toHaveLength(8);
    expect(wordsWith('tanween', 8)).toHaveLength(8);
    expect(wordsWith('madd', 8)).toHaveLength(8);
    expect(wordsWith('cezm', 8)).toHaveLength(8);
  });
});

describe('müfredat', () => {
  it('her ders bir üniteye bağlı, kimlikler tekil', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) expect(UNITS.some((u) => u.no === l.unit)).toBe(true);
  });

  it('her ders boş olmayan adımlar üretir', () => {
    for (const l of LESSONS) expect(buildLesson(l.id).length).toBeGreaterThan(0);
  });

  it('bütün sorularda doğru cevap seçenekler içinde ve seçenekler tekil', () => {
    for (const l of LESSONS) {
      for (const adim of buildLesson(l.id)) {
        if (adim.kind !== 'quiz') continue;
        expect(adim.questions.length).toBeGreaterThan(0);
        for (const q of adim.questions as Question[]) {
          expect(q.options).toContain(q.answer);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('aynı deneme aynı soruları, farklı deneme farklı sırayı verir', () => {
    expect(buildLesson('harf-1', 0)).toEqual(buildLesson('harf-1', 0));
    expect(JSON.stringify(buildLesson('harf-tekrar', 0))).not.toBe(JSON.stringify(buildLesson('harf-tekrar', 1)));
  });

  it('heceler hareke taşır; elif hemzeli yazılır', () => {
    const be = ARABIC_ALPHABET[1]!;
    const elif = ARABIC_ALPHABET[0]!;
    expect(syllable(be, 'َ')).toBe('بَ');
    expect(syllable(elif, 'ِ')).toBe('إِ');
    expect(closedSyllable(be)).toBe('أَبْ');
  });

  it('yıldız ve sıradaki ders', () => {
    expect(starsFor(9, 10)).toBe(3);
    expect(starsFor(7, 10)).toBe(2);
    expect(starsFor(3, 10)).toBe(1);
    expect(nextLesson(new Set())?.id).toBe('harf-1');
    expect(nextLesson(new Set(['harf-1']))?.id).toBe('harf-2');
    expect(nextLesson(new Set(LESSONS.map((l) => l.id)))).toBeNull();
  });
});
