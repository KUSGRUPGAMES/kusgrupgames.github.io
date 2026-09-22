import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  verifyAyahs, ayahsChecksum, checksum, SURAH_COUNT, AYAH_COUNT,
  type AyahRecord, type SurahMeta,
} from '@/features/quran/verify';

interface Paket {
  source: { name: string; url: string };
  checksum: string;
  surahs: SurahMeta[];
  ayahs: (AyahRecord & { page: number; juz: number; sajda: boolean })[];
}

const paket: Paket = JSON.parse(
  readFileSync(join(__dirname, '..', 'assets', 'quran', 'quran.json'), 'utf8'),
);

describe('Kur’an metni bütünlüğü', () => {
  it('114 sure ve 6236 âyet', () => {
    expect(paket.surahs).toHaveLength(SURAH_COUNT);
    expect(paket.ayahs).toHaveLength(AYAH_COUNT);
  });

  it('doğrulama sorunsuz geçer', () => {
    const r = verifyAyahs(paket.ayahs, paket.surahs);
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('bilinen âyet sayıları tutuyor', () => {
    const sayi = (n: number) => paket.surahs.find((s) => s.number === n)?.ayahCount;
    expect(sayi(1)).toBe(7);     // Fâtiha
    expect(sayi(2)).toBe(286);   // Bakara — en uzun sure
    expect(sayi(9)).toBe(129);   // Tevbe
    expect(sayi(18)).toBe(110);  // Kehf
    expect(sayi(36)).toBe(83);   // Yâsîn
    expect(sayi(55)).toBe(78);   // Rahmân
    expect(sayi(67)).toBe(30);   // Mülk
    expect(sayi(108)).toBe(3);   // Kevser — en kısa sure
    expect(sayi(112)).toBe(4);   // İhlâs
    expect(sayi(114)).toBe(6);   // Nâs
  });

  it('sayfa ve cüz numaraları sınırlar içinde ve azalmayan sırada', () => {
    let sayfa = 0;
    let cuz = 0;
    for (const a of paket.ayahs) {
      expect(a.page).toBeGreaterThanOrEqual(1);
      expect(a.page).toBeLessThanOrEqual(604);
      expect(a.juz).toBeGreaterThanOrEqual(1);
      expect(a.juz).toBeLessThanOrEqual(30);
      expect(a.page).toBeGreaterThanOrEqual(sayfa);
      expect(a.juz).toBeGreaterThanOrEqual(cuz);
      sayfa = a.page;
      cuz = a.juz;
    }
    expect(sayfa).toBe(604);
    expect(cuz).toBe(30);
  });

  it('cüz başlangıçları bilinen yerlerdedir', () => {
    const ilkAyet = (cuz: number) => paket.ayahs.find((a) => a.juz === cuz);
    expect(ilkAyet(1)).toMatchObject({ surah: 1, ayah: 1 });
    expect(ilkAyet(2)).toMatchObject({ surah: 2, ayah: 142 });
    expect(ilkAyet(30)).toMatchObject({ surah: 78, ayah: 1 });
  });

  it('secde âyetleri işaretlidir ve sayısı 15’tir', () => {
    const secdeler = paket.ayahs.filter((a) => a.sajda);
    expect(secdeler).toHaveLength(15);
    expect(secdeler[0]).toMatchObject({ surah: 7, ayah: 206 });
  });

  it('her sure Türkçe adı ve anlamıyla gelir', () => {
    for (const s of paket.surahs) {
      expect({ n: s.number, ad: s.nameTr.length > 1 }).toEqual({ n: s.number, ad: true });
      // Sâd (38) ve Kâf (50) sureleri tek harflidir; uzunluk şartı 1'dir.
      expect({ n: s.number, ar: s.nameAr.length >= 1 }).toEqual({ n: s.number, ar: true });
      expect(['mekki', 'medeni']).toContain(s.revelation);
    }
  });

  it('kaynak künyesi pakette yazılıdır — atıf şartı', () => {
    expect(paket.source.name).toContain('Tanzil');
    expect(paket.source.url).toContain('tanzil.net');
  });

  it('sağlama pakette kayıtlı değerle aynıdır', () => {
    expect(ayahsChecksum(paket.ayahs)).toBe(paket.checksum);
  });
});

describe('doğrulayıcı gerçekten yakalıyor mu', () => {
  const gecerli: AyahRecord[] = [
    { surah: 1, ayah: 1, text: 'بسم' },
    { surah: 1, ayah: 2, text: 'الحمد' },
  ];
  const meta: SurahMeta[] = [{
    number: 1, ayahCount: 2, nameAr: 'ا', nameTr: 'F', nameEn: 'F',
    revelation: 'mekki', pageStart: 1, juzStart: 1,
  }];

  it('eksik âyeti yakalar', () => {
    const r = verifyAyahs([gecerli[0]!], meta);
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toContain('sure 1');
  });

  it('sıra bozukluğunu yakalar', () => {
    const r = verifyAyahs([gecerli[0]!, { surah: 1, ayah: 3, text: 'xب' }], meta);
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toContain('sırası bozuk');
  });

  it('boş metni yakalar', () => {
    const r = verifyAyahs([gecerli[0]!, { surah: 1, ayah: 2, text: '   ' }], meta);
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toContain('boş âyet');
  });

  it('Arapça olmayan metni yakalar', () => {
    const r = verifyAyahs([gecerli[0]!, { surah: 1, ayah: 2, text: 'latin harf' }], meta);
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toContain('Arapça harf');
  });

  it('sağlama tek harf değişince değişir', () => {
    const a = ayahsChecksum(gecerli);
    const b = ayahsChecksum([gecerli[0]!, { surah: 1, ayah: 2, text: 'الحمخ' }]);
    expect(a).not.toBe(b);
    expect(checksum('a')).not.toBe(checksum('b'));
    expect(checksum('abc')).toBe(checksum('abc'));
  });
});
