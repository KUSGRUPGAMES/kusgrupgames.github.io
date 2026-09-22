/**
 * Kontrast denetimi — şartname §79.
 *
 * WCAG 2.1 AA: normal metin için 4.5:1, büyük metin (18pt+ ya da 14pt kalın)
 * için 3:1. Bu sınama tema token'larını ölçer; bir renk değiştiğinde göz
 * kararıyla değil, sayıyla yakalanır.
 */
import { lightTheme, darkTheme, type Theme } from '@/theme';

/** '#RRGGBB' ya da 'rgba(r,g,b,a)' — tema her ikisini de kullanıyor. */
function parseColor(input: string, arkaPlan?: [number, number, number]): [number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(input.trim());
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = /^rgba?\(([^)]+)\)$/i.exec(input.trim());
  if (rgba) {
    const parcalar = rgba[1]!.split(',').map((x) => Number(x.trim()));
    const [r, g, b] = [parcalar[0] ?? 0, parcalar[1] ?? 0, parcalar[2] ?? 0];
    const a = parcalar[3] ?? 1;
    if (a >= 1 || !arkaPlan) return [r, g, b];
    // Yarı saydam renk, arkasındaki zeminle harmanlanarak ölçülür.
    return [
      Math.round(r * a + arkaPlan[0] * (1 - a)),
      Math.round(g * a + arkaPlan[1] * (1 - a)),
      Math.round(b * a + arkaPlan[2] * (1 - a)),
    ];
  }
  throw new Error(`çözülemeyen renk: ${input}`);
}

function luminance([r, g, b]: [number, number, number]): number {
  const kanal = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
}

export function contrast(on: string, bg: string): number {
  const zemin = parseColor(bg);
  const metin = parseColor(on, zemin);
  const a = luminance(metin);
  const b = luminance(zemin);
  const [ust, alt] = a > b ? [a, b] : [b, a];
  return (ust + 0.05) / (alt + 0.05);
}

const AA_NORMAL = 4.5;
const AA_BUYUK = 3;

const temalar: [string, Theme][] = [['açık', lightTheme], ['koyu', darkTheme]];

/**
 * Ekran zemini artık düz değil, gradyan (D18). Metin gradyanın **her iki
 * ucunda** da okunmalı: yalnız ortalama renge bakmak, sayfanın altındaki
 * koyu/açık ucu gözden kaçırır.
 */
const zeminler = (tema: Theme): [string, string][] => [
  ['background', tema.colors.background],
  ['gradyan üst', tema.colors.backgroundGradient[0]],
  ['gradyan alt', tema.colors.backgroundGradient[1]],
  ['surface', tema.colors.surface],
  ['surfaceRaised', tema.colors.surfaceRaised],
];

describe('renk kontrastı', () => {
  it.each(temalar)('%s tema: birincil metin her zeminde AA geçer', (_ad, tema) => {
    for (const [ad, zemin] of zeminler(tema)) {
      expect({ ad, gecti: contrast(tema.colors.text, zemin) >= AA_NORMAL }).toEqual({ ad, gecti: true });
    }
  });

  it.each(temalar)('%s tema: ikincil metin AA geçer', (_ad, tema) => {
    for (const [ad, zemin] of zeminler(tema)) {
      expect({ ad, gecti: contrast(tema.colors.textMuted, zemin) >= AA_NORMAL }).toEqual({ ad, gecti: true });
    }
  });

  it.each(temalar)('%s tema: marka yüzeyindeki metin AA geçer', (_ad, tema) => {
    // `onAccent` artık `accentSurface` üstünde durur. İkisi ayrıldı: koyu
    // temada ön plan vurgusu AÇIK, dolgu yüzeyi KOYU olmak zorunda.
    // Kart da gradyanlı; iki durak da denetlenir.
    for (const zemin of [tema.colors.accentSurface, ...tema.colors.accentGradient]) {
      expect({ zemin, gecti: contrast(tema.colors.onAccent, zemin) >= AA_NORMAL })
        .toEqual({ zemin, gecti: true });
    }
  });

  it.each(temalar)('%s tema: marka yüzeyindeki altın büyük metin eşiğini geçer', (_ad, tema) => {
    // Geri sayım halkası ve rozet burada duruyor. Açık temanın koyulaştırılmış
    // altını (`highlight`) zümrüt kartta 2.25:1'e düşüyordu; `onAccentHighlight`
    // bu yüzden ayrı bir rol ve iki temada da logonun altını.
    for (const zemin of [tema.colors.accentSurface, ...tema.colors.accentGradient]) {
      expect({ zemin, gecti: contrast(tema.colors.onAccentHighlight, zemin) >= AA_BUYUK })
        .toEqual({ zemin, gecti: true });
    }
  });

  it.each(temalar)('%s tema: vurgu rengi her zeminde AA geçer', (_ad, tema) => {
    // `accent` bağlantı metni ve ikon rengidir; zeminin üstünde okunmalı.
    for (const [ad, zemin] of zeminler(tema)) {
      expect({ ad, gecti: contrast(tema.colors.accent, zemin) >= AA_NORMAL }).toEqual({ ad, gecti: true });
    }
  });

  it.each(temalar)('%s tema: uyarı ve hata renkleri en az büyük metin eşiğini geçer', (_ad, tema) => {
    for (const renk of [tema.colors.danger, tema.colors.warning, tema.colors.success]) {
      for (const [ad, zemin] of zeminler(tema)) {
        expect({ renk, ad, gecti: contrast(renk, zemin) >= AA_BUYUK }).toEqual({ renk, ad, gecti: true });
      }
    }
  });

  it.each(temalar)('%s tema: altın vurgu büyük metin eşiğini geçer', (_ad, tema) => {
    for (const [ad, zemin] of zeminler(tema)) {
      expect({ ad, gecti: contrast(tema.colors.highlight, zemin) >= AA_BUYUK }).toEqual({ ad, gecti: true });
    }
  });

  it('üçüncül metin yalnız büyük/ikincil kullanım için yeterlidir ve bu bilinçlidir', () => {
    // `textSubtle` künye ve ipucu satırlarında kullanılır; AA normal eşiğini
    // geçmesi beklenmez ama 3:1'in altına düşmemelidir — gradyanın iki
    // ucunda da.
    for (const [, tema] of temalar) {
      for (const [ad, zemin] of zeminler(tema)) {
        expect({ ad, gecti: contrast(tema.colors.textSubtle, zemin) >= AA_BUYUK }).toEqual({ ad, gecti: true });
      }
    }
  });

  it.each(temalar)('%s tema: denetim sınırı 1.4.11 eşiğini geçer', (_ad, tema) => {
    // WCAG 2.1 SC 1.4.11 "Non-text Contrast": dokunulan bir bileşenin sınırı
    // komşu zeminden 3:1 ayrılmalı. Girdi kutusu, seçilmemiş çip ve ikincil
    // düğme `border` kullanıyordu: açık temada 1.30:1, koyu temada 1.43:1.
    // Koyu temada zekât ekranındaki kutular gerçekten kayboluyordu.
    for (const [ad, zemin] of zeminler(tema)) {
      expect({ ad, gecti: contrast(tema.colors.controlBorder, zemin) >= AA_BUYUK })
        .toEqual({ ad, gecti: true });
    }
  });

  it('kart kenarı ile denetim sınırı ayrı token', () => {
    // Aynı token'a bağlanırsa biri düzeltilirken öbürü bozulur: kart kenarı
    // bilerek soluk, denetim sınırı bilerek belirgin.
    for (const [, tema] of temalar) {
      expect(tema.colors.controlBorder).not.toBe(tema.colors.border);
    }
  });

  it('ölçüm işlevi bilinen değerleri doğru veriyor', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrast('#767676', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
