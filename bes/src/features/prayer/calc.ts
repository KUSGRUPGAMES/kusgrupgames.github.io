/**
 * Namaz vakti hesabı (§14, §15).
 *
 * Bu motor `seher/` içinde yazıldı, bilinen değerlerle karşılaştırıldı ve üç
 * ayrı cihaz saat diliminde aynı sonucu verdiği doğrulandı; buraya tiplenerek
 * taşındı. Testleri `__tests__/prayer.test.ts` içinde.
 */
import { julianDay, sunPosition, hourAngle, asrAltitude, horizonAltitude } from './astronomy';
import { METHODS, PRAYER_KEYS, type MethodId, type AsrShadow, type PrayerKey } from './methods';

export interface PrayerOptions {
  method: MethodId;
  asrShadow: AsrShadow;
  /** Rakım (metre). Ufuk düzeltmesinde kullanılır. */
  elevation?: number;
  /** Vakit başına dakika düzeltmesi ("temkin"). */
  adjustments?: Partial<Record<PrayerKey, number>>;
}

/** Gün içindeki ondalık saat; kutupta oluşmayan vakit için `null`. */
export type PrayerTimes = Record<PrayerKey, number | null>;

export const DEFAULT_OPTIONS: PrayerOptions = { method: 'diyanet', asrShadow: 1 };

/**
 * Verilen takvim günü ve konum için ham vakitler (dakika düzeltmesi hariç).
 * @param utcOffset Konumun O GÜNKÜ UTC farkı — sabit fark değil.
 */
export function computeRaw(
  year: number, month: number, day: number,
  latitude: number, longitude: number, utcOffset: number,
  options: PrayerOptions = DEFAULT_OPTIONS,
): PrayerTimes {
  const method = METHODS[options.method] ?? METHODS.diyanet;
  const shadow = options.asrShadow ?? 1;
  const elevation = options.elevation ?? 0;

  const jd = julianDay(year, month + 1, day);
  const sun = sunPosition(jd + 0.5 - longitude / 360);
  const dec = sun.declination;

  const noon = 12 - sun.equationOfTime - longitude / 15 + utcOffset;
  const haSun = hourAngle(horizonAltitude(elevation), latitude, dec);
  const haFajr = hourAngle(-method.fajrAngle, latitude, dec);
  const haAsr = hourAngle(asrAltitude(shadow, latitude, dec), latitude, dec);
  const haIsha = method.ishaMinutes === undefined && method.ishaAngle !== undefined
    ? hourAngle(-method.ishaAngle, latitude, dec)
    : null;

  const sunrise = haSun === null ? null : noon - haSun;
  const maghrib = haSun === null ? null : noon + haSun;

  return {
    fajr: haFajr === null ? null : noon - haFajr,
    sunrise,
    dhuhr: noon,
    asr: haAsr === null ? null : noon + haAsr,
    maghrib,
    isha: method.ishaMinutes !== undefined
      ? (maghrib === null ? null : maghrib + method.ishaMinutes / 60)
      : (haIsha === null ? null : noon + haIsha),
  };
}

/** Ham vakitlere kullanıcının dakika düzeltmesini uygular. */
export function applyAdjustments(times: PrayerTimes, adjustments?: Partial<Record<PrayerKey, number>>): PrayerTimes {
  if (!adjustments) return times;
  const out = {} as PrayerTimes;
  for (const key of PRAYER_KEYS) {
    const v = times[key];
    out[key] = v === null ? null : v + (adjustments[key] ?? 0) / 60;
  }
  return out;
}

export function computeTimes(
  year: number, month: number, day: number,
  latitude: number, longitude: number, utcOffset: number,
  options: PrayerOptions = DEFAULT_OPTIONS,
): PrayerTimes {
  return applyAdjustments(computeRaw(year, month, day, latitude, longitude, utcOffset, options), options.adjustments);
}

export interface NextPrayer {
  key: PrayerKey;
  /** Gün içindeki ondalık saat; yarına sarkıyorsa 24'ten büyük olabilir. */
  at: number;
  /** Yarının vakti mi. */
  tomorrow: boolean;
}

/**
 * Şu anki saate göre sıradaki vakit. Bugün vakit kalmadıysa yarının imsakı
 * `at = saat + 24` olarak döner; böylece geri sayım tek çıkarmayla bulunur.
 */
export function findNext(today: PrayerTimes, tomorrowFajr: number | null, nowHours: number): NextPrayer | null {
  for (const key of PRAYER_KEYS) {
    const v = today[key];
    if (v !== null && v > nowHours) return { key, at: v, tomorrow: false };
  }
  if (tomorrowFajr === null) return null;
  return { key: 'fajr', at: tomorrowFajr + 24, tomorrow: true };
}

/** Şu an içinde bulunulan vakit (geçmiş en son vakit). */
export function findCurrent(today: PrayerTimes, nowHours: number): PrayerKey | null {
  let current: PrayerKey | null = null;
  for (const key of PRAYER_KEYS) {
    const v = today[key];
    if (v !== null && nowHours >= v) current = key;
  }
  return current;
}

/** Ondalık saati "HH:MM" biçimine çevirir; 24'ü aşan değer sarmalanır. */
export function formatHM(hours: number | null): string {
  if (hours === null || Number.isNaN(hours)) return '--:--';
  const total = Math.round(((hours % 24) + 24) % 24 * 60);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Kalan süreyi "HH:MM:SS" biçiminde verir. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
