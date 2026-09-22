/**
 * Saat dilimi katmanı — tek çerçeve kuralı.
 *
 * Namaz vakitleri **seçili konumun** saat diliminde hesaplanır, "şimdi" ise
 * cihazdan okunur. İkisi aynı çerçeveden okunmazsa başka şehre bakan ya da
 * yurt dışındaki kullanıcının geri sayımı saatlerce şaşar; bu hata tek bir
 * saat diliminde test edilirken hiç görülmez.
 *
 * Bu yüzden konum **sabit fark değil, IANA dilim adı** tutar: sabit fark,
 * yaz saati uygulayan her yerde yılın yarısında bir saat hatalıdır.
 */

/** Bir IANA saat diliminin verilen andaki gerçek UTC farkı (saat cinsinden). */
export function zoneOffset(zone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const wall = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  return Math.round((wall - Math.floor(date.getTime() / 1000) * 1000) / 60000) / 60;
}

/** Cihazın kendi UTC farkı — dilim adı bilinmiyorsa kullanılır. */
export function deviceOffset(date: Date): number {
  return -date.getTimezoneOffset() / 60;
}

export interface ZonedNow {
  /** Konumun takvim yılı. */
  year: number;
  /** Konumun takvim ayı (0-11). */
  month: number;
  /** Konumun takvim günü. */
  day: number;
  /** Gün içindeki ondalık saat (13.5 = 13:30). */
  hours: number;
  /** O andaki UTC farkı. */
  offset: number;
}

/** Seçili konumun "şimdi"si: takvim günü + gün içindeki ondalık saat. */
export function zonedNow(zone: string | null, now: Date = new Date()): ZonedNow {
  const offset = zone ? safeOffset(zone, now) : deviceOffset(now);
  const w = new Date(now.getTime() + offset * 3600000);
  return {
    year: w.getUTCFullYear(),
    month: w.getUTCMonth(),
    day: w.getUTCDate(),
    hours: w.getUTCHours() + w.getUTCMinutes() / 60 + w.getUTCSeconds() / 3600,
    offset,
  };
}

/** Geçersiz dilim adı sessizce cihaz dilimine düşer, uygulamayı düşürmez. */
export function safeOffset(zone: string, date: Date): number {
  try {
    return zoneOffset(zone, date);
  } catch {
    return deviceOffset(date);
  }
}

/**
 * Konumun duvar saatindeki bir anı gerçek (mutlak) zamana çevirir.
 * Bildirimler bununla kurulur: cihaz başka dilimdeyken doğrudan
 * `new Date(y, m, d, ...)` kurmak bildirimi yanlış anda çalar.
 */
export function wallClockToInstant(
  year: number, month: number, day: number, hours: number, offset: number,
): Date {
  return new Date(Date.UTC(year, month, day) - offset * 3600000 + Math.round(hours * 3600000));
}

/** Verilen takvim gününde konumun UTC farkı (yaz saati geçişleri için gün gün). */
export function offsetForDay(zone: string | null, year: number, month: number, day: number, fallback: number): number {
  if (!zone) return fallback;
  return safeOffset(zone, new Date(Date.UTC(year, month, day, 12)));
}
