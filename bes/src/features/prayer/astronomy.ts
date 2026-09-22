/**
 * Güneş konumu — standart astronomik yöntem.
 * Jülyen günü → deklinasyon + zaman denklemi → istenen yükseklik için saat açısı.
 * Sunucu yok; hesabın tamamı cihazda yapılır (§77).
 */
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

const sinD = (d: number): number => Math.sin(d * D2R);
const cosD = (d: number): number => Math.cos(d * D2R);
const asinD = (x: number): number => R2D * Math.asin(x);
const acosD = (x: number): number => R2D * Math.acos(x);
const atan2D = (y: number, x: number): number => R2D * Math.atan2(y, x);

/** Pozitif modülo. */
export function fix(a: number, b: number): number {
  const r = a - b * Math.floor(a / b);
  return r < 0 ? r + b : r;
}

/** Miladi tarihten Jülyen günü (0h UT). */
export function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

export interface SunPosition {
  /** Deklinasyon (derece). */
  declination: number;
  /** Zaman denklemi (saat). */
  equationOfTime: number;
}

export function sunPosition(jd: number): SunPosition {
  const d = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * d, 360);
  const q = fix(280.459 + 0.98564736 * d, 360);
  const l = fix(q + 1.915 * sinD(g) + 0.020 * sinD(2 * g), 360);
  const e = 23.439 - 0.00000036 * d;
  const ra = fix(atan2D(cosD(e) * sinD(l), cosD(l)) / 15, 24);
  return {
    declination: asinD(sinD(e) * sinD(l)),
    equationOfTime: fix(q / 15 - ra + 12, 24) - 12,
  };
}

/**
 * Güneşin verilen yüksekliğe ulaştığı saat açısı (saat cinsinden).
 * Kutup bölgesinde o vakit oluşmaz; `null` döner ve **sayıya zorlanmaz**.
 */
export function hourAngle(altitude: number, latitude: number, declination: number): number | null {
  const c = (sinD(altitude) - sinD(latitude) * sinD(declination)) /
            (cosD(latitude) * cosD(declination));
  if (c > 1 || c < -1) return null;
  return acosD(c) / 15;
}

/** İkindi: gölge boyu cismin `shadow` katına ulaştığı andaki güneş yüksekliği. */
export function asrAltitude(shadow: number, latitude: number, declination: number): number {
  return R2D * Math.atan(1 / (shadow + Math.tan(Math.abs(latitude - declination) * D2R)));
}

/** Ufuk yüksekliği: atmosfer kırılması + rakım düzeltmesi. */
export function horizonAltitude(elevationMeters = 0): number {
  return -0.833 - 0.0347 * Math.sqrt(Math.max(0, elevationMeters));
}

export { D2R, R2D, sinD, cosD, atan2D };
