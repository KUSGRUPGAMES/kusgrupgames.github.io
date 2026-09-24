import { ARABIC_ALPHABET } from '@/content/arabicAlphabet';
import { HAREKAT } from '@/content/harekat';
import { containsArabic } from '@/lib/i18n/direction';

describe('Kur’an okuma eğitimi — içerik', () => {
  it('28 harf eksiksizdir', () => {
    expect(ARABIC_ALPHABET).toHaveLength(28);
  });

  it('harf kimlikleri ve sırası tekildir', () => {
    expect(new Set(ARABIC_ALPHABET.map((h) => h.id)).size).toBe(28);
    expect(new Set(ARABIC_ALPHABET.map((h) => h.order)).size).toBe(28);
    expect(ARABIC_ALPHABET.map((h) => h.order)).toEqual([...ARABIC_ALPHABET].sort((a, b) => a.order - b.order).map((h) => h.order));
  });

  it('her harf ve örnek kelime gerçekten Arapça', () => {
    for (const h of ARABIC_ALPHABET) {
      expect(containsArabic(h.letter)).toBe(true);
      expect(containsArabic(h.example)).toBe(true);
      expect(h.name.length).toBeGreaterThan(0);
      expect(h.soundHint.length).toBeGreaterThan(0);
      expect(h.exampleMeaning.length).toBeGreaterThan(0);
    }
  });

  it('örnek kelime seçili harfi içerir', () => {
    for (const h of ARABIC_ALPHABET) {
      expect(h.example.includes(h.letter)).toBe(true);
    }
  });

  it('6 hareke eksiksizdir, kimlikleri tekildir', () => {
    expect(HAREKAT).toHaveLength(6);
    expect(new Set(HAREKAT.map((h) => h.id)).size).toBe(6);
  });

  it('her hareke örneği Arapça akar', () => {
    for (const h of HAREKAT) {
      expect(containsArabic(h.example)).toBe(true);
      expect(h.sound.length).toBeGreaterThan(0);
    }
  });
});
