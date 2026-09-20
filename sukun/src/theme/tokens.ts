/**
 * Design token'ları — şartname §8.
 * Ham değerler burada durur; bileşenler **asla** düz renk kodu yazmaz,
 * her zaman tema üzerinden okur.
 *
 * BEŞ marka paleti. Adlandırılmış renkler **verilen marka paketinden** gelir:
 * `assets/brand/brand.tokens.json`. Ara basamaklar (tema katmanları için
 * gereken açık/koyu tonlar) o beş renkten türetilmiştir; marka renkleri
 * burada birebir yazılıdır ve `brand.test.ts` paketle karşılaştırır.
 *
 * Altın rampasının açık iki ucu (`gold300`, `gold200`) uydurma değildir:
 * verilen `BES_AppIcon_Dark.svg` içindeki altın gradyanın duraklarıdır.
 * Böylece arayüzün altını ikonun altınıyla aynı olur.
 *
 * Açık temada saf beyaz **kullanılmaz**: ürünün karakteri sıcak fildişidir,
 * steril beyaz onu jenerik bir mobil uygulamaya çeviriyordu.
 */

/** Ham palet. Tema katmanı bunlardan anlamlı rolleri türetir. */
export const palette = {
  emerald900: '#003F32',   // paket: deepEmerald — koyu tema zemini, ikon zemini
  emerald800: '#004A3E',
  emerald700: '#005343',   // paket: emerald
  emerald600: '#006451',
  emerald500: '#0A7A62',
  emerald400: '#2E9B80',
  emerald300: '#63BFA6',

  gold600: '#8A6A1F',      // açık zeminde okunabilir koyu altın (WCAG)
  gold500: '#B98E42',      // paket: goldDark
  gold400: '#D6B46A',      // paket: mutedGold
  gold300: '#E9D19B',      // ikon gradyanı
  gold200: '#FFF9E9',      // ikon gradyanı

  ivory50: '#FDFBF6',
  ivory100: '#F7F3E8',     // paket: warmIvory — açık tema zemini, ikon zemini
  ivory200: '#EADFC7',     // paket: softBeige
  ivory300: '#DCCFB2',

  ink900: '#0C1512',
  ink700: '#24312C',
  ink500: '#566862',
  // WCAG AA: üçüncül metin de en az 3:1 olmalı. Eski değer (#8FA29B) ivory
  // zeminde 2.54:1 veriyordu — künye satırı okunmuyordu, kontrast sınaması
  // yakaladı. Bu değer 3.89:1.
  ink300: '#6E817A',

  white: '#FFFFFF',
  black: '#000000',

  danger: '#B4452F',
  warning: '#B9761F',
  success: '#2E9B80',
} as const;

export const spacing = {
  none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, giant: 56,
} as const;

export const radius = {
  none: 0, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999,
} as const;

export const opacity = {
  disabled: 0.38,
  muted: 0.62,
  /** Arka plan motifleri — şartname §9: düşük opaklık, gösterişsiz. */
  motif: 0.06,
  overlay: 0.72,
  full: 1,
} as const;

/** Tipografi ölçeği. Dynamic Type ile ölçeklenir (§79). */
export const typography = {
  display: { size: 40, lineHeight: 46, weight: '800' },
  title1: { size: 28, lineHeight: 34, weight: '800' },
  title2: { size: 22, lineHeight: 28, weight: '700' },
  title3: { size: 18, lineHeight: 24, weight: '700' },
  body: { size: 16, lineHeight: 24, weight: '400' },
  bodyStrong: { size: 16, lineHeight: 24, weight: '600' },
  callout: { size: 15, lineHeight: 21, weight: '500' },
  caption: { size: 13, lineHeight: 18, weight: '500' },
  micro: { size: 11, lineHeight: 15, weight: '600' },
  /** Kur'an metni — diacritics için geniş satır aralığı (§10). */
  arabic: { size: 30, lineHeight: 58, weight: '400' },
  arabicSmall: { size: 22, lineHeight: 44, weight: '400' },
} as const;

export const duration = {
  instant: 0, fast: 140, normal: 220, slow: 360, deliberate: 560,
} as const;

/** Reduced-motion açıkken hareket süreleri sıfırlanır (§79). */
export const easing = {
  standard: 'ease-out',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type TypographyToken = keyof typeof typography;
