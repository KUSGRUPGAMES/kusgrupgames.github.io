import {
  CARD_SIZES, truncateBody, decodeEntities, assertSource, cardTypography, MAX_BODY_CHARS,
} from '@/features/share/card';
import { resolveTemplate } from '@/features/share/templates';
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES } from '@/content/cardTemplates';
import { getAyah, getTranslation } from '@/features/quran/data';

const etiket = { greetingSource: 'Tebrik mesajı', translationSource: (n: string) => `${n} meali`, brand: 'BEŞ' };

describe('paylaşım kartı — yerleşim kuralları', () => {
  it('üç boyut doğru oranda', () => {
    expect(CARD_SIZES.story).toEqual({ width: 1080, height: 1920 });
    expect(CARD_SIZES.square).toEqual({ width: 1080, height: 1080 });
    expect(CARD_SIZES.portrait).toEqual({ width: 1080, height: 1350 });
  });

  it('uzun metin kelime ortasından kesilmeden kısaltılır', () => {
    const uzun = 'kelime '.repeat(200);
    const k = truncateBody(uzun);
    expect(k.length).toBeLessThanOrEqual(MAX_BODY_CHARS + 1);
    expect(k.endsWith('…')).toBe(true);
    expect(k.slice(0, -1).trim().split(' ').every((w) => w === 'kelime')).toBe(true);
  });

  it('HTML kaçış dizileri kartta çözülür (eskiden "&apos;" yazıyordu)', () => {
    expect(decodeEntities('Allah&apos;a &quot;hamd&quot; &amp; şükür')).toBe('Allah’a "hamd" & şükür');
  });

  it('kaynaksız kart üretilmez', () => {
    expect(() => assertSource({ source: '  ' })).toThrow();
    expect(() => assertSource({ source: 'Elmalılı meali' })).not.toThrow();
  });

  it('uzun metinde punto küçülür, okunaklı sınırın altına inmez', () => {
    const kisa = cardTypography('portrait', 40, 0);
    const uzun = cardTypography('portrait', 420, 250);
    expect(uzun.body).toBeLessThan(kisa.body);
    expect(uzun.body).toBeGreaterThanOrEqual(10);
    expect(cardTypography('story', 100, 0).body).toBeGreaterThanOrEqual(cardTypography('square', 100, 0).body);
  });
});

describe('hazır kartlar', () => {
  it('her kategori dolu, kimlikler tekil', () => {
    for (const k of TEMPLATE_CATEGORIES) expect(CARD_TEMPLATES.some((s) => s.category === k)).toBe(true);
    expect(new Set(CARD_TEMPLATES.map((s) => s.id)).size).toBe(CARD_TEMPLATES.length);
  });

  it('âyet kartlarının hepsi pakette var; metin paketten gelir, elle yazılmaz', () => {
    for (const s of CARD_TEMPLATES) {
      const c = resolveTemplate(s, etiket);
      expect({ id: s.id, var: c !== null }).toEqual({ id: s.id, var: true });
      if (s.kind === 'verse') {
        expect(c!.arabic).toBe(getAyah(s.surah, s.ayah)!.text);
        expect(c!.body).toBe(getTranslation(s.surah, s.ayah));
        expect(c!.source).toContain('meali');
        expect(c!.reference).toMatch(new RegExp(`${s.ayah}$`));
      } else {
        expect(c!.source).toBe('Tebrik mesajı');
      }
    }
  });

  it('âyet kartları kısaltılmadan sığacak uzunlukta', () => {
    for (const s of CARD_TEMPLATES) {
      if (s.kind !== 'verse') continue;
      expect({ id: s.id, uzun: (getTranslation(s.surah, s.ayah) ?? '').length > MAX_BODY_CHARS }).toEqual({ id: s.id, uzun: false });
    }
  });
});
