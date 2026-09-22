import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES } from '@/lib/i18n/translate';
import { uiDirection, containsArabic, textDirection, SCRIPTURE_DIRECTION, SCRIPTURE_ALIGN, RTL_LANGUAGES } from '@/lib/i18n/direction';

describe('yön katmanı', () => {
  it('Türkçe ve İngilizce soldan sağa, Arapça sağdan sola', () => {
    expect(uiDirection('tr')).toBe('ltr');
    expect(uiDirection('en')).toBe('ltr');
    expect(uiDirection('ar')).toBe('rtl');
    // Almanca ve Fransızca sonradan eklendi; tipin dışında kalınca Arapçadan
    // onlara geçişte aynalama kapanmıyordu.
    expect(uiDirection('de')).toBe('ltr');
    expect(uiDirection('fr')).toBe('ltr');
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

describe('yön uygulaması', () => {
  it('dil değişiminde yön her dil için uygulanır', () => {
    // Çağıran taraf listeyi elle daraltıyordu (`lang === 'tr' || 'en' || 'ar'`).
    // Almanca ve Fransızca dışarıda kaldığı için Arapçadan onlara geçen
    // kullanıcıda `forceRTL(false)` hiç çağrılmıyor, arayüz aynalanmış
    // kalıyordu. Daraltma geri gelirse bu sınama kırılır.
    const kaynak = readFileSync(join(__dirname, '..', 'src', 'boot', 'AppProviders.tsx'), 'utf8');
    expect(kaynak).toContain('applyUiDirection(lang);');
    expect(/if\s*\([^)]*lang\s*===[^)]*\)\s*applyUiDirection/.test(kaynak)).toBe(false);
  });

  it('desteklenen her dil UiLanguage tipinde', () => {
    // LANGUAGES ile UiLanguage ayrı yerlerde duruyor; biri büyüyüp öbürü
    // büyümezse yön katmanı sessizce eksik kalır.
    for (const lang of LANGUAGES) {
      expect(['ltr', 'rtl']).toContain(uiDirection(lang));
    }
  });
});
