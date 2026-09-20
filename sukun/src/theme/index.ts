/**
 * Tema katmanı — açık ve koyu şema. Şartname §8.
 * Bileşenler yalnız `ThemeColors` rollerini kullanır; ham palet adı geçmez.
 */
import { palette, spacing, radius, opacity, typography, duration, easing } from './tokens';

export interface ThemeColors {
  /** Ekranın en alt katmanı. */
  background: string;
  /** Kart ve yüzeyler. */
  surface: string;
  /** Kart üzerindeki ikincil yüzey. */
  surfaceRaised: string;
  /** Ayırıcı çizgi. */
  border: string;
  /** Birincil metin. */
  text: string;
  /** İkincil metin. */
  textMuted: string;
  /** Üçüncül / ipucu metni. */
  textSubtle: string;
  /** Marka vurgusu (emerald). */
  /** Ön plan vurgusu: ikon, bağlantı, seçili sekme. Zeminin üstünde okunur. */
  accent: string;
  /**
   * Marka yüzeyi: hero kartı, birincil düğme, seçili çip. Üstüne `onAccent`
   * yazılır. `accent`ten ayrıdır çünkü ikisi TERS yön ister: koyu temada ön
   * plan vurgusu AÇIK olmalı, dolgu yüzeyi ise KOYU. Tek token'a sıkıştırılınca
   * koyu temada hero kartı nane yeşiline dönüyor, marka zümrütü kayboluyordu.
   */
  accentSurface: string;
  /** Marka vurgusu üzerindeki metin. */
  onAccent: string;
  /** Altın vurgu — sayılar, geri sayım, kandil. */
  highlight: string;
  danger: string;
  warning: string;
  success: string;
  /** Arka plan motifi rengi (düşük opaklıkla kullanılır). */
  motif: string;
}

export interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  opacity: typeof opacity;
  typography: typeof typography;
  /** Süreler ms. Reduced-motion açıkken tema katmanı hepsini 0'a çeker. */
  duration: Record<keyof typeof duration, number>;
  easing: typeof easing;
}

const shared = { spacing, radius, opacity, typography, duration, easing };

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    // Sayfa hafif koyu krem, kartlar daha açık krem. Saf beyaz kullanılmaz
    // (BRAND_GUIDELINES: açık tema fildişidir, steril beyaz değil).
    // Zemin markanın warmIvory'si: açık ikonun zeminiyle birebir aynı renk.
    background: palette.ivory100,
    surface: palette.ivory50,
    surfaceRaised: palette.ivory200,
    border: palette.ivory200,
    text: palette.ink900,
    textMuted: palette.ink500,
    textSubtle: palette.ink300,
    accent: palette.emerald600,
    accentSurface: palette.emerald600,
    onAccent: palette.ivory50,
    highlight: palette.gold600,
    danger: palette.danger,
    warning: palette.warning,
    success: palette.emerald500,
    motif: palette.emerald700,
  },
  ...shared,
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: palette.emerald900,
    surface: palette.emerald800,
    surfaceRaised: palette.emerald700,
    border: 'rgba(255,255,255,0.10)',
    text: palette.ivory50,
    textMuted: 'rgba(251,248,241,0.68)',
    // Koyu zeminde 0.44 alfa yükseltilmiş yüzeylerde 3:1'in altına düşüyordu.
    textSubtle: 'rgba(251,248,241,0.56)',
    accent: palette.emerald300,
    accentSurface: palette.emerald700,
    onAccent: palette.ivory50,
    highlight: palette.gold400,
    danger: '#E0715A',
    warning: '#E0A052',
    success: palette.emerald300,
    motif: palette.gold400,
  },
  ...shared,
};

export const themes = { light: lightTheme, dark: darkTheme } as const;
export * from './tokens';
