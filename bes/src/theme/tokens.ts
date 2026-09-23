/**
 * Design token'ları — şartname §8.
 * Ham değerler burada durur; bileşenler **asla** düz renk kodu yazmaz,
 * her zaman tema üzerinden okur.
 *
 * **Renkler logodan ölçüldü.** Marka paketinin `brand.tokens.json` dosyası
 * beş "önerilen değer" veriyor (`#003F32`, `#D6B46A` …) ama onaylı logonun
 * kendisi o değerleri kullanmıyor: zemin düz bir yeşil değil, yukarıdan aşağı
 * koyulaşan bir gradyan; altın da tek ton değil, açık bir şampanyadan bronza
 * inen bir rampa. Uygulama düz "önerilen" değerleri kullandığı için logonun
 * yanında yavan duruyordu. Artık bütün marka renkleri
 * `assets/brand/png/BES_AppIcon_{Dark,Light}_1024.png` masterlarının
 * piksellerinden **ölçülerek** alınıyor; `brand.test.ts` her çalıştığında
 * masterı yeniden ölçüp buradaki değerlerle karşılaştırıyor (D17, D18).
 *
 * Ölçüm penceresi masterın iç bölgesi (120–900), sınıflama parlaklıkla:
 *
 * | Token | Kaynak | Ölçülen |
 * |---|---|---|
 * | `emerald950` | koyu zemin %10 dilimi | `#000D08` |
 * | `emerald900` | koyu zemin ortancası | `#011D13` |
 * | `emerald800` | koyu zemin %90 dilimi | `#042B21` |
 * | `gold500` | altın %5 dilimi | `#A88652` |
 * | `gold400` | altın ortancası | `#D3B685` |
 * | `gold300` | altın %70 dilimi | `#E9CFA6` |
 * | `gold200` | altın %95 dilimi | `#F6E5C8` |
 * | `ivory50` | açık zemin %90 dilimi | `#FBF6EC` |
 * | `ivory100` | açık zemin ortancası | `#F6F1E4` |
 * | `ivory200` | açık zemin %10 dilimi | `#EDE4D3` |
 * | `ink900` | açık masterdaki figür ortancası | `#011E17` |
 *
 * Ara basamaklar (`emerald700`, `emerald600`, `emerald500`, `ivory300`,
 * `gold600`) ölçülen uçlar arasından türetilmiştir; hepsi WCAG sınamasından
 * geçer.
 *
 * Açık temada saf beyaz **kullanılmaz**: ürünün karakteri sıcak fildişidir,
 * steril beyaz onu jenerik bir mobil uygulamaya çeviriyordu.
 */

/** Ham palet. Tema katmanı bunlardan anlamlı rolleri türetir. */
export const palette = {
  // --- Zümrüt: koyu masterın zemin gradyanı.
  emerald950: '#000D08',   // ölçüm: koyu zemin %10 — gradyanın dibi
  emerald900: '#011D13',   // ölçüm: koyu zemin ortancası — koyu tema tabanı
  emerald850: '#03241B',   // türetilmiş: koyu temada kart yüzeyi
  emerald800: '#042B21',   // ölçüm: koyu zemin %90 — gradyanın tepesi
  emerald700: '#06382B',   // türetilmiş: yükseltilmiş yüzey
  emerald600: '#0A4636',   // türetilmiş: marka yüzeyi (hero kart, düğme)
  emerald500: '#0A5A45',   // türetilmiş: açık temada bağlantı ve ikon (AA)
  emerald400: '#2E9B80',
  emerald300: '#63BFA6',   // koyu temada ön plan vurgusu

  // --- Gece rampası: koyu temanın yüzey basamakları.
  //
  // Ürün sahibi koyu temada "lacivert / antrasit / gece" istedi. Saf lacivert
  // denendiğinde marka bezemeleriyle çakışıyor: paketten gelen bütün
  // çerçeveler, alınlıklar ve köşe işlemeleri **yeşil + altın**; mavi bir
  // zeminde yeşil dolgular kirli duruyor.
  //
  // Çözüm ikisinin ortası: ölçülen zümrütlerin üstüne çok az mavi katılarak
  // türetilen, doygunluğu düşük bir gece rampası. Gözle "gece/antrasit"
  // okunuyor, bezemelerle aynı aileden kalıyor.
  //
  // Basamaklar birbirinden **görülebilir** ölçüde ayrı: kat farkı olmadan
  // kart zeminden ayrılmıyor ve ekran düz bir leke gibi duruyordu.
  night950: '#050B0A',     // en dip — ekran zemini
  night900: '#081311',     // zemin gradyanının tepesi
  night850: '#0B1A17',     // birinci kat: kart
  night800: '#10231F',     // ikinci kat: yükseltilmiş kart, girdi
  night700: '#16302A',     // üçüncü kat: basılı hâl, seçili satır
  night600: '#1D3D35',     // kenarlık zemini

  // --- Altın: koyu masterdaki "5"in rampası.
  gold600: '#8A6A2A',      // türetilmiş: açık zeminde okunabilir koyu altın
  gold500: '#A88652',      // ölçüm: altın %5 — rampanın koyu ucu
  gold400: '#D3B685',      // ölçüm: altın ortancası — markanın imza altını
  gold300: '#E9CFA6',      // ölçüm: altın %70
  gold200: '#F6E5C8',      // ölçüm: altın %95 — parlama

  // --- Fildişi: açık masterın zemini.
  ivory25: '#FDFAF3',      // türetilmiş: açık temada kart yüzeyi
  ivory50: '#FBF6EC',      // ölçüm: açık zemin %90 — kartın üst ucu
  ivory100: '#F6F1E4',     // ölçüm: açık zemin ortancası — açık tema tabanı
  ivory200: '#EDE4D3',     // ölçüm: açık zemin %10 — gradyanın dibi
  ivory300: '#DFD4BC',     // türetilmiş: kenarlık ve ayırıcı

  // --- Adaçayı: denetim kenarlığı. WCAG 1.4.11 arayüz bileşeninin sınırından
  // 3:1 ister; `ivory300` / %10 beyaz kenarlıkla alan sınırı 1.3:1 ve 1.43:1
  // kalıyordu. Koyu temada zekât ekranında girdi kutuları neredeyse
  // görünmüyordu — ekran karesinde böyle görüldü. Bu iki ton her iki temada
  // da zemin, yüzey ve gradyanın her durağına karşı 3:1'in üstünde.
  sage600: '#5E8375',      // açık tema: en düşük 3.34:1 (ivory200'e karşı)
  sage400: '#75897F',      // koyu tema: en düşük 3.51:1 (emerald700'e karşı)

  // --- Metin: açık masterdaki figürün koyusu.
  ink900: '#011E17',       // ölçüm: açık master figür ortancası
  ink700: '#20302A',
  ink500: '#4F625B',
  // WCAG AA: üçüncül metin de en az 3:1 olmalı. Eski değer (#8FA29B) ivory
  // zeminde 2.54:1 veriyordu — künye satırı okunmuyordu, kontrast sınaması
  // yakaladı. Bu değer fildişi zeminde 3.9:1.
  ink300: '#6E817A',

  white: '#FFFFFF',
  black: '#000000',

  // Uyarı rampası da fildişi zemine göre koyulaştırıldı: eski `#B9761F`
  // gradyanın alt durağında (`ivory200`) 2.93:1 veriyordu, eşiğin altında.
  danger: '#A83F2A',
  warning: '#A96A17',
  success: '#2E9B80',
} as const;

/**
 * Boşluk ölçeği — 4 piksellik ızgara.
 *
 * Ara değer yok: bir yere 14 ya da 18 yazmak gerekiyorsa ölçek yanlış
 * seçilmiş demektir. Dağınıklığın en büyük sebebi rastgele boşluktur.
 */
export const spacing = {
  none: 0, xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, giant: 56,
  /** Ekranın yatay kenar boşluğu — her ekranda aynı olmalı. */
  gutter: 20,
  /** Bölümler arası nefes payı. */
  section: 28,
} as const;

export const radius = {
  none: 0, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999,
} as const;

/**
 * Çizgi kalınlıkları.
 *
 * Premium his ince ve **tutarlı** çizgiden gelir. Aynı ekranda 1, 1.5 ve 2
 * piksellik kenarlıkların karışması işi amatör gösteriyordu.
 */
export const stroke = {
  /** Ayırıcı ve kart kenarı. */
  hair: 1,
  /** Vurgulu kenar: seçili satır, odaklı girdi. */
  bold: 1.5,
  /** Bezeme hattı: kemer, madalyon. */
  ornament: 2,
} as const;

/**
 * Yükseklik (gölge) basamakları.
 *
 * Koyu temada gölge **görünmez**; derinlik yüzey renginin açılmasıyla
 * verilir. O yüzden her basamak hem gölgeyi hem hangi yüzey tonuna
 * karşılık geldiğini taşır. Sadece gölgeye güvenmek koyu temada bütün
 * kartları düz ve birbirine yapışık gösteriyordu.
 */
export const elevation = {
  flat: { shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  kart: { shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  yukseltilmis: { shadowOpacity: 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  kaplama: { shadowOpacity: 0.28, shadowRadius: 40, shadowOffset: { width: 0, height: 18 }, elevation: 12 },
} as const;

export const opacity = {
  disabled: 0.38,
  muted: 0.62,
  /** Arka plan motifleri — şartname §9: düşük opaklık, gösterişsiz. */
  motif: 0.06,
  /**
   * Motif opaklığı yüzeye göre değişir. Tek bir değer her yerde yanlıştı:
   * ekran zemininde görünmeyen desen, kartın içinde bağırıyordu.
   */
  motifEkran: 0.05,
  motifKart: 0.035,
  motifVurgu: 0.09,
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
  /**
   * Bölüm üstü küçük etiket — harf aralığı açık, hep büyük harf.
   * Hiyerarşinin en üst katmanını başlıktan ayırır.
   */
  eyebrow: { size: 12, lineHeight: 16, weight: '700' },
  /**
   * Geri sayım ve sayaç rakamları. Tablo rakamı gerekir: değişen saniye
   * rakamların genişliğini değiştirince sayı zıplıyordu.
   */
  numeric: { size: 44, lineHeight: 50, weight: '700' },
  numericSmall: { size: 24, lineHeight: 28, weight: '700' },
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
export type Stroke = keyof typeof stroke;
export type Elevation = keyof typeof elevation;
export type Radius = keyof typeof radius;
export type TypographyToken = keyof typeof typography;
