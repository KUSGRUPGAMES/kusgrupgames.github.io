/**
 * Tema katmanı — açık ve koyu şema. Şartname §8.
 * Bileşenler yalnız `ThemeColors` rollerini kullanır; ham palet adı geçmez.
 */
import { palette, spacing, radius, opacity, typography, duration, easing, stroke, elevation } from './tokens';

export interface ThemeColors {
  /** Ekranın en alt katmanı (gradyan çizilemeyen yerlerde düz karşılığı). */
  background: string;
  /**
   * Ekran zemininin gradyan durakları — **yukarıdan aşağı**, tıpkı logonun
   * zemini gibi. Uygulama tek düz renk kullandığı için logonun yanında yavan
   * duruyordu: masterın zemini üstte `#042B21`, altta `#000D08`.
   */
  backgroundGradient: readonly [string, string];
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
  /** Marka yüzeyinin gradyan durakları — ikonun kutucuğuyla aynı iniş. */
  accentGradient: readonly [string, string];
  /** Marka vurgusu üzerindeki metin. */
  onAccent: string;
  /**
   * Marka yüzeyi üzerindeki altın: geri sayım halkası, rozet, sayı.
   *
   * `highlight`ten ayrıdır ve iki temada da **aynıdır**, çünkü altın her
   * zaman zümrüdün üstünde durur — logodaki eşleşmenin ta kendisi. Açık
   * temada `highlight` fildişi zemine göre koyulaştırılmış altındır; o rengi
   * zümrüt hero kartına koyunca 2.25:1'e düşüyor ve geri sayım halkası
   * kayboluyordu.
   */
  onAccentHighlight: string;
  /** Marka yüzeyi üzerindeki ince çizgi (halka yatağı, ayırıcı). */
  onAccentBorder: string;
  /** Altın vurgu — sayılar, geri sayım, kandil. */
  highlight: string;
  danger: string;
  warning: string;
  success: string;
  /**
   * İnce çizim çizgisi: pusula kadranı, halka yatağı, grafik ızgarası.
   *
   * `border`den ayrıdır. Kenarlık bir yüzeyi ayırmak için vardır ve koyu
   * temada bilerek çok soluktur (%10 beyaz); pusula kadranı ise **okunması
   * gereken bir çizim**. Aynı token kullanılınca koyu temada kadran neredeyse
   * kayboluyordu.
   */
  hairline: string;
  /**
   * Dokunulan bir denetimin sınırı: girdi kutusu, seçilmemiş çip, ikincil
   * düğme. `border` kart kenarı gibi **dekoratif** ayrımlar içindir ve
   * bilerek soluktur; WCAG 1.4.11 ise arayüz bileşeninin sınırından 3:1
   * ister. İkisi aynı token olduğunda koyu temada girdi kutuları zeminden
   * ayırt edilemiyordu (zekât ekranı).
   */
  controlBorder: string;
  /**
   * Marka kartı üstündeki halka/ilerleme yatağı.
   *
   * `onAccentBorder`den ayrıdır. O, kart içindeki kenarlıklar için soluk bir
   * beyazdır; geri sayım halkasının yatağı ise **altın ailesinden** olmalı,
   * yoksa halka gri bir çember gibi duruyor ve altın ilerleme yayı yatağa
   * ait değilmiş gibi görünüyordu.
   */
  onAccentTrack: string;
  /** Arka plan motifi rengi (düşük opaklıkla kullanılır). */
  motif: string;
  /**
   * Kat basamakları. Koyu temada derinlik gölgeyle değil **yüzey tonuyla**
   * verilir; gölge koyu zeminde görünmüyor ve bütün kartlar birbirine
   * yapışık duruyordu.
   */
  kat1: string;
  kat2: string;
  kat3: string;
  /** Bezeme hattı (kemer, madalyon, ayraç) — altın ailesinden. */
  bezeme: string;
  /** Bezemenin soluk hâli: ikincil hatlar, iç çizgiler. */
  bezemeSolgun: string;
}

export interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  opacity: typeof opacity;
  typography: typeof typography;
  stroke: typeof stroke;
  elevation: typeof elevation;
  /** Süreler ms. Reduced-motion açıkken tema katmanı hepsini 0'a çeker. */
  duration: Record<keyof typeof duration, number>;
  easing: typeof easing;
}

const shared = { spacing, radius, opacity, typography, duration, easing, stroke, elevation };

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    // Sayfa hafif koyu krem, kartlar daha açık krem. Saf beyaz kullanılmaz
    // (BRAND_GUIDELINES: açık tema fildişidir, steril beyaz değil).
    // Zemin markanın warmIvory'si: açık ikonun zeminiyle birebir aynı renk.
    background: palette.ivory100,
    backgroundGradient: [palette.ivory50, palette.ivory200],
    surface: palette.ivory25,
    surfaceRaised: palette.ivory200,
    border: palette.ivory300,
    hairline: palette.ivory300,
    controlBorder: palette.sage600,
    text: palette.ink900,
    textMuted: palette.ink500,
    textSubtle: palette.ink300,
    accent: palette.emerald500,
    // Açık temada bile hero kartı **ikonun koyu zümrüdüdür**: marka orada
    // görünür. Fildişi sayfa + koyu zümrüt kart + altın sayı = logonun kendisi.
    accentSurface: palette.emerald600,
    accentGradient: [palette.emerald600, palette.emerald900],
    onAccent: palette.ivory50,
    onAccentHighlight: palette.gold400,
    onAccentBorder: 'rgba(251,246,236,0.20)',
    onAccentTrack: 'rgba(211,182,133,0.26)',
    highlight: palette.gold600,
    kat1: palette.ivory25,
    kat2: palette.ivory50,
    kat3: palette.ivory200,
    bezeme: palette.gold600,
    bezemeSolgun: 'rgba(138,106,42,0.34)',
    danger: palette.danger,
    warning: palette.warning,
    success: palette.emerald500,
    motif: palette.emerald600,
  },
  ...shared,
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: palette.night950,
    backgroundGradient: [palette.night900, palette.night950],
    surface: palette.night850,
    surfaceRaised: palette.night800,
    border: 'rgba(255,255,255,0.10)',
    hairline: 'rgba(251,246,236,0.34)',
    controlBorder: palette.sage400,
    text: palette.ivory50,
    textMuted: 'rgba(251,246,236,0.70)',
    // Koyu zeminde 0.44 alfa yükseltilmiş yüzeylerde 3:1'in altına düşüyordu.
    textSubtle: 'rgba(251,246,236,0.58)',
    accent: palette.emerald300,
    accentSurface: palette.emerald600,
    accentGradient: [palette.emerald600, palette.emerald950],
    onAccent: palette.ivory50,
    onAccentHighlight: palette.gold400,
    onAccentBorder: 'rgba(251,246,236,0.18)',
    onAccentTrack: 'rgba(211,182,133,0.24)',
    highlight: palette.gold400,
    kat1: palette.night850,
    kat2: palette.night800,
    kat3: palette.night700,
    bezeme: palette.gold400,
    bezemeSolgun: 'rgba(211,182,133,0.34)',
    danger: '#E0715A',
    warning: '#E0A052',
    success: palette.emerald300,
    motif: palette.gold400,
  },
  ...shared,
};

export const themes = { light: lightTheme, dark: darkTheme } as const;
export * from './tokens';
