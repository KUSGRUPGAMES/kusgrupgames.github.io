/**
 * Kıble yönü ve Kâbe'ye uzaklık (§36).
 * Yön, bulunduğun noktadan Kâbe'ye giden BÜYÜK DAİRENİN başlangıç açısıdır —
 * Mercator haritasındaki düz çizgi değildir.
 */
import { D2R, R2D, fix } from '../prayer/astronomy';

export const KAABA = { latitude: 21.4225, longitude: 39.8262 } as const;
const EARTH_RADIUS_KM = 6371;

/** Kuzeyden saat yönünde derece (0–360). */
export function qiblaBearing(latitude: number, longitude: number): number {
  const dLon = (KAABA.longitude - longitude) * D2R;
  const p1 = latitude * D2R;
  const p2 = KAABA.latitude * D2R;
  const y = Math.sin(dLon);
  const x = Math.cos(p1) * Math.tan(p2) - Math.sin(p1) * Math.cos(dLon);
  return fix(R2D * Math.atan2(y, x), 360);
}

/** Büyük daire mesafesi, kilometre. */
export function distanceToKaaba(latitude: number, longitude: number): number {
  const p1 = latitude * D2R;
  const p2 = KAABA.latitude * D2R;
  const dp = (KAABA.latitude - latitude) * D2R;
  const dl = (KAABA.longitude - longitude) * D2R;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Cihazın baktığı yön ile kıble arasındaki işaretli fark (-180..180). */
export function headingDelta(qibla: number, heading: number): number {
  return fix(qibla - heading + 180, 360) - 180;
}

/** Hizalanma toleransı (derece) — bu aralıkta haptic verilir. */
export const ALIGN_TOLERANCE = 3;

export function isAligned(qibla: number, heading: number): boolean {
  return Math.abs(headingDelta(qibla, heading)) < ALIGN_TOLERANCE;
}

export type CompassAccuracy = 'high' | 'medium' | 'low' | 'unreliable';

/** Pusula doğruluğunu kullanıcıya anlatılabilir bir seviyeye indirger. */
export function classifyAccuracy(accuracyDegrees: number | null): CompassAccuracy {
  if (accuracyDegrees === null || accuracyDegrees < 0) return 'unreliable';
  if (accuracyDegrees <= 5) return 'high';
  if (accuracyDegrees <= 15) return 'medium';
  if (accuracyDegrees <= 30) return 'low';
  return 'unreliable';
}
