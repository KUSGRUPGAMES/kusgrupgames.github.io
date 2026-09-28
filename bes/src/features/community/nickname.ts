/**
 * Takma ad — topluluğa girerken gerçek ad/e-posta hiç istenmez (D31).
 * Kullanıcı isterse kendi adını yazabilir; istemezse burada üretilen
 * saygın, dinî açıdan nötr bir öneri kullanılır.
 */

const SIFATLAR = [
  'Sabırlı', 'Şükreden', 'Mütevazı', 'Cömert', 'Vefalı', 'Çalışkan',
  'Umutlu', 'Merhametli', 'Sakin', 'Azimli',
] as const;

const ISIMLER = [
  'Yolcu', 'Kardeş', 'Misafir', 'Talebe', 'Bahçıvan', 'Yıldız', 'Rüzgâr',
  'Deniz', 'Güneş', 'Ay',
] as const;

export function isValidNickname(ad: string): boolean {
  const temiz = ad.trim();
  return temiz.length >= 2 && temiz.length <= 24;
}

/** Kararlı: aynı tohum (ör. kullanıcı kimliği) aynı öneriyi üretir. */
export function suggestNickname(tohum: string): string {
  let h = 0;
  for (let i = 0; i < tohum.length; i += 1) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const sifat = SIFATLAR[h % SIFATLAR.length];
  const isim = ISIMLER[Math.floor(h / SIFATLAR.length) % ISIMLER.length];
  const sayi = (h % 90) + 10;
  return `${sifat} ${isim} ${sayi}`;
}
