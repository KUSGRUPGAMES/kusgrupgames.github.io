import { uiDirection, containsArabic, textDirection, SCRIPTURE_DIRECTION, SCRIPTURE_ALIGN, RTL_LANGUAGES } from '@/lib/i18n/direction';

describe('yön katmanı', () => {
  it('Türkçe ve İngilizce soldan sağa, Arapça sağdan sola', () => {
    expect(uiDirection('tr')).toBe('ltr');
    expect(uiDirection('en')).toBe('ltr');
    expect(uiDirection('ar')).toBe('rtl');
  });

  it('RTL dil listesi yalnız Arapça içerir', () => {
    expect([...RTL_LANGUAGES]).toEqual(['ar']);
  });

  it('dinî metin arayüz dilinden bağımsız olarak sağdan sola akar', () => {
    expect(SCRIPTURE_DIRECTION).toBe('rtl');
    expect(SCRIPTURE_ALIGN).toBe('right');
  });

  it('Arapça harf algılama', () => {
    expect(containsArabic('بسم')).toBe(true);
    expect(containsArabic('Besmele')).toBe(false);
    expect(containsArabic('Sure: الفاتحة')).toBe(true);
  });

  it('Türkçe özel harfler Arapça sanılmaz', () => {
    for (const s of ['ığüşöçİĞÜŞÖÇ', 'Kur’an meali', 'BEŞ', 'BEŞ – Ezan & Namaz Vakitleri']) {
      expect(containsArabic(s)).toBe(false);
      expect(textDirection(s)).toBe('ltr');
    }
  });

  it('sunum biçimi bloğundaki harfler de Arapça sayılır', () => {
    expect(containsArabic('ﻻ')).toBe(true);
    expect(textDirection('ﷺ')).toBe('rtl');
  });
});
