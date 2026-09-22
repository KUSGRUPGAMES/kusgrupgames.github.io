/**
 * Yazı tipleri — şartname §10.
 *
 * Latin/Türkçe arayüz **sistem yazı tipini** kullanır: iOS'ta San Francisco,
 * Android'de Roboto. Gerekçe, Dynamic Type ve dil desteğiyle en uyumlu
 * seçenek olması ve paket boyutunu şişirmemesidir (DECISIONS D9).
 *
 * Arapça metin için iki yüz bulunur ve ikisi de **SIL Open Font License 1.1**
 * altındadır; lisans metni `assets/fonts/Amiri-OFL.txt` içinde birlikte
 * dağıtılır (OFL'nin şartı budur).
 *
 * - `Amiri`      — dua, zikir, esmâ, başlıklardaki Arapça.
 * - `AmiriQuran` — mushaf metni; hareke ve durak işaretleri için ayarlanmıştır.
 */
// Expo varlık yükleyicisi font dosyalarını `require` ile çözer; ESM `import`
// bir .ttf için modül kimliği üretmez. Bu iki satır bu yüzden istisnadır.
/* eslint-disable @typescript-eslint/no-require-imports */
export const FONT_ASSETS = {
  Amiri: require('../../../assets/fonts/Amiri-Regular.ttf'),
  AmiriQuran: require('../../../assets/fonts/AmiriQuran-Regular.ttf'),
} as const;
/* eslint-enable @typescript-eslint/no-require-imports */

export type ArabicFont = keyof typeof FONT_ASSETS;

export const ARABIC_FONT_LICENSE = {
  name: 'Amiri',
  license: 'SIL Open Font License 1.1',
  copyright: 'Copyright 2010-2022 The Amiri Project Authors',
  url: 'https://github.com/aliftype/amiri',
  bundledLicenseFile: 'assets/fonts/Amiri-OFL.txt',
} as const;

/**
 * Mushaf metni hangi yüzle çizilir. Kullanıcı ayarından gelir; varsayılan
 * `AmiriQuran`, çünkü hareke yerleşimi mushaf için ayarlanmıştır.
 */
export function scriptureFont(preference?: ArabicFont): ArabicFont {
  return preference ?? 'AmiriQuran';
}
