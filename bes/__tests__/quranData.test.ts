import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadQuran, resetQuran, getSurahs, getSurah, getSurahAyahs, getPageAyahs,
  getJuzAyahs, getAyah, getJuzStarts, searchArabic, getSource,
} from '@/features/quran/data';
import { normalizeArabic, arabicIncludes } from '@/features/quran/arabic';

const paket = JSON.parse(
  readFileSync(join(__dirname, '..', 'assets', 'quran', 'quran.json'), 'utf8'),
);

beforeAll(() => { resetQuran(); loadQuran(paket); });

describe('Arapça normalizasyon', () => {
  it('harekeler atılır', () => {
    // "بِسْمِ" → "بسم"
    expect(normalizeArabic('بِسْمِ')).toBe('بسم');
  });

  it('elif çeşitleri tek biçime iner', () => {
    for (const elif of ['أ', 'إ', 'آ', 'ٱ']) {
      expect(normalizeArabic(elif)).toBe('ا');
    }
  });

  it('tâ merbûta ve elif maksûra dönüştürülür', () => {
    expect(normalizeArabic('ة')).toBe('ه');
    expect(normalizeArabic('ى')).toBe('ي');
  });

  it('tatvîl atılır', () => {
    expect(normalizeArabic('بــس')).toBe('بس');
  });

  it('harekeli metinde harekesiz sorgu bulunur', () => {
    const harekeli = 'بِسْمِ اللَّهِ';
    expect(arabicIncludes(harekeli, 'بسم')).toBe(true);
  });

  it('boş sorgu eşleşmez', () => {
    expect(arabicIncludes('بسم', '')).toBe(false);
    expect(arabicIncludes('بسم', '   ')).toBe(false);
  });
});

describe('Kur’an veri erişimi', () => {
  it('114 sure listelenir', () => {
    expect(getSurahs()).toHaveLength(114);
    expect(getSurah(1)?.nameTr).toBe('Fâtiha');
    expect(getSurah(114)?.nameTr).toBe('Nâs');
    expect(getSurah(999)).toBeUndefined();
  });

  it('sure âyetleri eksiksiz ve sıralı gelir', () => {
    const bakara = getSurahAyahs(2);
    expect(bakara).toHaveLength(286);
    expect(bakara[0]?.ayah).toBe(1);
    expect(bakara.at(-1)?.ayah).toBe(286);
  });

  it('sayfa ve cüz erişimi çalışır', () => {
    expect(getPageAyahs(1).length).toBeGreaterThan(0);
    expect(getPageAyahs(604).length).toBeGreaterThan(0);
    expect(getPageAyahs(9999)).toHaveLength(0);
    expect(getJuzAyahs(30).length).toBeGreaterThan(0);
    // Otuz cüzün toplamı bütün mushaftır.
    let toplam = 0;
    for (let j = 1; j <= 30; j++) toplam += getJuzAyahs(j).length;
    expect(toplam).toBe(6236);
  });

  it('tekil âyet erişimi', () => {
    expect(getAyah(1, 1)?.text.length).toBeGreaterThan(5);
    expect(getAyah(114, 6)?.ayah).toBe(6);
    expect(getAyah(1, 99)).toBeUndefined();
  });

  it('cüz başlangıçları 30 tanedir ve ilki Fâtiha’dır', () => {
    const c = getJuzStarts();
    expect(c).toHaveLength(30);
    expect(c[0]).toEqual({ juz: 1, surah: 1, ayah: 1 });
    expect(c[29]).toEqual({ juz: 30, surah: 78, ayah: 1 });
  });

  it('arama harekesiz sorguyla sonuç bulur', () => {
    // "الله" lafzı mushafta çok geçer.
    const sonuc = searchArabic('الله', 10);
    expect(sonuc.length).toBe(10);
    expect(sonuc[0]?.surahName.length).toBeGreaterThan(1);
  });

  it('tek harflik sorgu aramayı tetiklemez', () => {
    expect(searchArabic('ا')).toEqual([]);
    expect(searchArabic('')).toEqual([]);
  });

  it('bulunmayan dizilim boş döner', () => {
    expect(searchArabic('بببببببب')).toEqual([]);
  });

  it('kaynak künyesi erişilebilir — arayüzde gösterilecek', () => {
    expect(getSource().name).toContain('Tanzil');
    expect(getSource().url).toContain('tanzil.net');
  });

  it('bozuk paket yüklenmez', () => {
    resetQuran();
    const bozuk = { ...paket, ayahs: paket.ayahs.slice(0, 100) };
    expect(() => loadQuran(bozuk)).toThrow();
    resetQuran();
    loadQuran(paket);
  });
});
