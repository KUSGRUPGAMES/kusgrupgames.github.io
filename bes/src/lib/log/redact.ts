/**
 * Günlük temizleyici — şartname §83, §84, §85.
 *
 * Kural: kişisel veri günlüğe **hiç** yazılmaz. Bu ürün konum, ibadet kaydı ve
 * dua talebi tutuyor; bunlar sızdırılmaması gereken en hassas veri sınıfıdır.
 * Bu yüzden temizleme "isteğe bağlı bir güzellik" değil, günlük yolunun
 * zorunlu geçidi: her kayıt buradan geçer.
 */

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const BEARER = /\b(bearer|token|apikey|api_key|secret|password|authorization)\b\s*[:=]?\s*\S+/gi;
const JWT = /\beyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const PHONE = /\+?\d[\d ()-]{8,}\d/g;

/** Konum, ibadet ve topluluk alanları: anahtar adına göre tamamen gizlenir. */
const SENSITIVE_KEYS = new Set([
  'latitude', 'longitude', 'lat', 'lng', 'lon', 'coords', 'coordinates',
  'address', 'city', 'district', 'email', 'password', 'token', 'accessToken',
  'refreshToken', 'apiKey', 'authorization', 'body', 'note', 'prayerRequest',
  'displayName', 'fullName', 'phone', 'pushToken', 'deviceId',
]);

export const MASK = '[gizlendi]';

/** Metin içindeki kalıpları maskeler. */
export function redactText(input: string): string {
  return input
    .replace(JWT, MASK)
    .replace(BEARER, (m) => m.split(/[:=]/)[0] + '=' + MASK)
    .replace(EMAIL, MASK)
    .replace(PHONE, MASK);
}

/**
 * Nesneyi derinlemesine temizler. Döngüsel başvuru güvenlidir; bilinmeyen tip
 * metne çevrilip temizlenir, böylece "şu tip unutuldu" diye sızma olmaz.
 */
export function redact(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactText(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Error) {
    return { name: value.name, message: redactText(value.message) };
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) return '[döngü]';
    seen.add(value);
    return value.map((v) => redact(v, seen));
  }
  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[döngü]';
    seen.add(value as object);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k) ? MASK : redact(v, seen);
    }
    return out;
  }
  return redactText(String(value));
}
