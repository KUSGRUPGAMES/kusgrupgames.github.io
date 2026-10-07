/**
 * Paylaşım kartı — şartname §62, §107. Saf yerleşim kuralları.
 *
 * Üç boyut: hikâye (9:16), kare (1:1), dikey (4:5). Kart artık SVG değil,
 * gerçek bileşenlerle çizilip görsele alınıyor (`ShareCard.tsx`). SVG
 * çizicisi Arapça harfleri birleştiremiyor, satırları kaydırıyor ve
 * `&apos;` gibi kaçış dizilerini çözmeden yazıyordu; kart okunmaz çıkıyordu.
 *
 * Değişmez kural: **kaynak künyesi karttan silinemez.** Âyet ya da meal
 * paylaşılıyorsa mütercim adı ve kaynak kartın üzerindedir; bu, metni
 * bağlamından kopuk dolaştırmamak içindir (CONTENT_SOURCES kuralı 3).
 */

export type CardFormat = 'story' | 'square' | 'portrait';

export interface CardSize { width: number; height: number }

/** Çıktı piksel ölçüleri. */
export const CARD_SIZES: Record<CardFormat, CardSize> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};

export interface CardContent {
  /** Üstte küçük başlık: "Cuma mesajı", "Günün âyeti"… */
  eyebrow?: string;
  /** Arapça metin — varsa üstte, ortalı. */
  arabic?: string;
  /** Türkçe metin (meal, dua, mesaj). */
  body: string;
  /** "Bakara 255" gibi künye satırı. */
  reference?: string;
  /** Kaynak künyesi — **zorunlu**, boş verilemez. */
  source: string;
  /** Uygulama adı, kartın altında. */
  brand: string;
}

/** Kart metninin sığacağı en uzun hâli; aşan metin kısaltılır. */
export const MAX_BODY_CHARS = 420;
export const MAX_ARABIC_CHARS = 260;

export function truncateBody(text: string, max = MAX_BODY_CHARS): string {
  const t = text.trim();
  if (t.length <= max) return t;
  // Kelimeyi ortadan kesmemek için son boşluktan kırp.
  const kirpik = t.slice(0, max);
  const son = kirpik.lastIndexOf(' ');
  return `${(son > max * 0.6 ? kirpik.slice(0, son) : kirpik).trimEnd()}…`;
}

/**
 * HTML varlıklarını çözer. Bazı kaynak metinlerde `&apos;` ya da `&quot;`
 * gibi kaçış dizileri kalmış olabilir; kartta olduğu gibi görünüyorlardı.
 */
export function decodeEntities(text: string): string {
  return text
    .replace(/&apos;|&#0?39;/g, '’')
    .replace(/&quot;|&#0?34;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** Kaynaksız kart üretilmez: metni bağlamından koparmamak için. */
export function assertSource(content: Pick<CardContent, 'source'>): void {
  if (!content.source.trim()) throw new Error('Paylaşım kartında kaynak künyesi zorunludur');
}

export interface CardTypography {
  arabic: number;
  body: number;
}

/**
 * Metin uzunluğuna ve boyuta göre yazı punto (kart genişliği 360 birim
 * kabul edilir). Kısa mesaj büyük, uzun meal küçük yazılır; alt sınırlar
 * telefonda okunaklı kalacak şekilde seçildi. Son güvence olarak metin
 * bileşeni ayrıca sığdırarak küçültür (`adjustsFontSizeToFit`).
 */
export function cardTypography(format: CardFormat, bodyLength: number, arabicLength: number): CardTypography {
  const alan = format === 'story' ? 1.25 : format === 'portrait' ? 1 : 0.8;
  const toplam = bodyLength + arabicLength * 1.4;
  // Tahmin temkinli: web'de ve Android'de sığdırarak küçültme yok, iOS da
  // yalnız satır sayısına bakıyor; uzun Arapça kemerin tepesine taşıyordu.
  const govde = toplam < 60 ? 22 : toplam < 140 ? 17 : toplam < 260 ? 14.5 : toplam < 400 ? 13 : 11.5;
  const arapca = arabicLength < 40 ? 28 : arabicLength < 90 ? 21 : arabicLength < 150 ? 18 : arabicLength < 210 ? 16 : 14.5;
  const k = Math.min(1.15, Math.max(0.8, alan));
  return { arabic: Math.round(arapca * k * 2) / 2, body: Math.round(govde * k * 2) / 2 };
}
