/**
 * Günün içeriği seçimi — şartname §22–§25.
 *
 * Gereksinimler:
 * 1. **Aynı gün aynı içerik**: kullanıcı uygulamayı gün içinde beş kez açsa da
 *    "Günün Duası" değişmez. Bu yüzden rastgelelik yok, tarihten türetme var.
 *    (Sunucuya da sormaz: çevrimdışı çalışır.)
 * 2. **Herhangi N ardışık günde tekrar yok**: liste N maddeyse, hangi günden
 *    başlarsanız başlayın sonraki N gün boyunca aynı madde iki kez çıkmaz.
 *
 * Çözüm: N ile aralarında asal bir adımla ilerlemek. Tur sınırında karıştırma
 * yapan bir çözüm de denendi; o çözümde tur sınırını kesen pencerelerde tekrar
 * oluşuyordu (34 günlük pencerede 34 yerine 26 farklı madde). Aralarında asal
 * adım bu tekrarı yapısal olarak imkânsız kılar.
 *
 * Adım, altın orana yakın seçilir: sıralama kullanıcıya düzenli bir örüntü
 * gibi görünmesin diye.
 */

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) { const t = y; y = x % y; x = t; }
  return x;
}

/** N ile aralarında asal, altın orana en yakın adım. */
export function strideFor(length: number): number {
  if (length <= 2) return 1;
  const hedef = Math.round(length * 0.6180339887);
  for (let d = 0; d < length; d++) {
    for (const aday of [hedef - d, hedef + d]) {
      if (aday > 0 && aday < length && gcd(aday, length) === 1) return aday;
    }
  }
  return 1;
}

/** 1970-01-01'den bu yana geçen gün sayısı (takvim günü, saat dilimi yok). */
export function dayNumber(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month, day) / 86400000);
}

export interface DailyPickInput {
  year: number;
  month: number;
  day: number;
  /** Seçilecek listenin uzunluğu. */
  length: number;
  /** Farklı içerik türleri aynı gün aynı indise düşmesin diye ayırıcı. */
  salt?: number;
}

/** Verilen gün için liste indisi. */
export function dailyIndex({ year, month, day, length, salt = 0 }: DailyPickInput): number {
  if (length <= 0) return -1;
  const gun = dayNumber(year, month, day);
  const adim = strideFor(length);
  return (((gun * adim + salt) % length) + length) % length;
}

/** Listeden o günün maddesini verir. Liste boşsa null. */
export function pickDaily<T>(items: readonly T[], input: Omit<DailyPickInput, 'length'>): T | null {
  const i = dailyIndex({ ...input, length: items.length });
  return i < 0 ? null : (items[i] ?? null);
}
