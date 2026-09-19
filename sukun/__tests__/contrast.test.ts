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

describe('renk kontrastı', () => {
  it.each(temalar)('%s tema: birincil metin zeminde AA geçer', (_ad, tema) => {
    expect(contrast(tema.colors.text, tema.colors.background)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrast(tema.colors.text, tema.colors.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrast(tema.colors.text, tema.colors.surfaceRaised)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it.each(temalar)('%s tema: ikincil metin AA geçer', (_ad, tema) => {
    expect(contrast(tema.colors.textMuted, tema.colors.background)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrast(tema.colors.textMuted, tema.colors.surface)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it.each(temalar)('%s tema: vurgu üzerindeki metin AA geçer', (_ad, tema) => {
    expect(contrast(tema.colors.onAccent, tema.colors.accent)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it.each(temalar)('%s tema: uyarı ve hata renkleri en az büyük metin eşiğini geçer', (_ad, tema) => {
    for (const renk of [tema.colors.danger, tema.colors.warning, tema.colors.success]) {
      expect(contrast(renk, tema.colors.background)).toBeGreaterThanOrEqual(AA_BUYUK);
      expect(contrast(renk, tema.colors.surface)).toBeGreaterThanOrEqual(AA_BUYUK);
    }
  });

  it.each(temalar)('%s tema: altın vurgu büyük metin eşiğini geçer', (_ad, tema) => {
    expect(contrast(tema.colors.highlight, tema.colors.background)).toBeGreaterThanOrEqual(AA_BUYUK);
    expect(contrast(tema.colors.highlight, tema.colors.surface)).toBeGreaterThanOrEqual(AA_BUYUK);
  });

  it('üçüncül metin yalnız büyük/ikincil kullanım için yeterlidir ve bu bilinçlidir', () => {
    // `textSubtle` künye ve ipucu satırlarında kullanılır; AA normal eşiğini
    // geçmesi beklenmez ama 3:1'in altına düşmemelidir.
    for (const [, tema] of temalar) {
      expect(contrast(tema.colors.textSubtle, tema.colors.background)).toBeGreaterThanOrEqual(AA_BUYUK);
    }
  });

  it('ölçüm işlevi bilinen değerleri doğru veriyor', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrast('#767676', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});
