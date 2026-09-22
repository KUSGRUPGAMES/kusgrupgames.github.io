import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadQuran, resetQuran, loadTranslation, resetTranslations,
  getTranslation, getSurahTranslations, searchTranslation, getTranslationInfo,
  DEFAULT_TRANSLATION,
} from '@/features/quran/data';
import { verifyTranslation, translationChecksum } from '@/features/quran/verify';

const quranPaket = JSON.parse(
  readFileSync(join(__dirname, '..', 'assets', 'quran', 'quran.json'), 'utf8'),
);
const mealPaket = JSON.parse(
  readFileSync(join(__dirname, '..', 'assets', 'quran', 'translations', 'tr-yazir.json'), 'utf8'),
);

beforeAll(() => {
  resetQuran();
  resetTranslations();
  loadQuran(quranPaket);
  loadTranslation(DEFAULT_TRANSLATION, mealPaket);
});

describe('meal bütünlüğü', () => {
  it('6236 satır', () => {
    expect(mealPaket.rows).toHaveLength(6236);
  });

  it('doğrulama sorunsuz geçer', () => {
    const satirlar = mealPaket.rows.map((body: string, i: number) => ({
      surah: quranPaket.ayahs[i].surah,
      ayah: quranPaket.ayahs[i].ayah,
      body,
    }));
    const r = verifyTranslation(satirlar, quranPaket.surahs);
    expect(r.problems).toEqual([]);
  });

  it('hiçbir satır boş değil', () => {
    const bos = mealPaket.rows.filter((r: string) => r.trim().length === 0);
    expect(bos).toHaveLength(0);
  });

  it('sağlama pakette kayıtlı değerle aynı', () => {
    const satirlar = mealPaket.rows.map((body: string, i: number) => ({
      surah: quranPaket.ayahs[i].surah,
      ayah: quranPaket.ayahs[i].ayah,
      body,
    }));
    expect(translationChecksum(satirlar)).toBe(mealPaket.checksum);
  });

  it('telif künyesi kamu malı olarak kayıtlı', () => {
    const info = getTranslationInfo();
    expect(info.name).toContain('Elmalılı');
    expect(info.rights).toBe('kamu-mali');
    expect(info.rightsNote).toContain('1942');
    expect(info.source.url).toContain('tanzil.net');
  });
});

describe('meal erişimi', () => {
  it('âyet meali doğru satıra denk gelir', () => {
    expect(getTranslation(1, 1)).toContain('Rahmân');
    expect(getTranslation(112, 1)).toContain('Allah');
    const nas = getTranslation(114, 6);
    expect(nas).not.toBeNull();
    expect(nas!.length).toBeGreaterThan(5);
  });

  it('sure meali âyet sayısıyla aynı uzunlukta', () => {
    expect(getSurahTranslations(1)).toHaveLength(7);
    expect(getSurahTranslations(2)).toHaveLength(286);
    expect(getSurahTranslations(108)).toHaveLength(3);
  });

  it('olmayan âyet için null döner, uydurulmaz', () => {
    expect(getTranslation(1, 99)).toBeNull();
    expect(getTranslation(999, 1)).toBeNull();
  });
});

describe('meal araması', () => {
  it('Türkçe kelime bulunur', () => {
    const r = searchTranslation('sabır', 10);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]!.body.toLowerCase()).toContain('sab');
  });

  it('şapkasız ve büyük harfle de bulunur', () => {
    const a = searchTranslation('RAHMAN', 5);
    const b = searchTranslation('rahmân', 5);
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
  });

  it('çok kısa sorgu aramayı tetiklemez', () => {
    expect(searchTranslation('ab')).toEqual([]);
    expect(searchTranslation('')).toEqual([]);
  });

  it('sonuçlar sure adı ve âyet numarasıyla gelir', () => {
    const r = searchTranslation('namaz', 5);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]!.surahName.length).toBeGreaterThan(1);
    expect(r[0]!.ayah).toBeGreaterThan(0);
  });

  it('bulunmayan dizilim boş döner', () => {
    expect(searchTranslation('zzzqqqxxx')).toEqual([]);
  });

  it('bozuk meal paketi yüklenmez', () => {
    resetTranslations();
    const bozuk = { ...mealPaket, rows: mealPaket.rows.slice(0, 100) };
    expect(() => loadTranslation(DEFAULT_TRANSLATION, bozuk)).toThrow();
    resetTranslations();
    loadTranslation(DEFAULT_TRANSLATION, mealPaket);
  });
});
