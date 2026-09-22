/**
 * Bildirim planı — şartname §16, §65.
 *
 * Saf mantık: çizelgeden hangi anlarda bildirim kurulacağını üretir.
 * Platform katmanı bu planı alır ve kurar; böylece "yanlış anda çaldı"
 * sorusu sınamayla yanıtlanabilir.
 *
 * İki tuzak burada kapalı:
 * 1. **Geçmiş an kurulmaz.** Kurulursa iOS onu hemen çalar.
 * 2. **iOS'ta bekleyen bildirim sınırı 64'tür.** Sınır aşılırsa iOS
 *    fazlasını sessizce atar ve kullanıcı "bildirim gelmiyor" der; bu yüzden
 *    plan zaman sırasına dizilip baştan kesilir.
 */
import type { DaySchedule } from '@/features/prayer/schedule';
import { OBLIGATORY_KEYS, PRAYER_KEYS, type PrayerKey } from '@/features/prayer/methods';

export interface NotificationSettings {
  enabled: boolean;
  /** Vakit bazlı açık/kapalı. Belirtilmeyen vakit **açık** sayılır. */
  perPrayer: Partial<Record<PrayerKey, boolean>>;
  /** Vaktin kaç dakika öncesinde uyarılsın (0 = tam vaktinde). */
  beforeMinutes: number;
  /** Güneş doğuşu için bildirim — varsayılan kapalı, namaz vakti değildir. */
  includeSunrise: boolean;
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  perPrayer: {},
  beforeMinutes: 0,
  includeSunrise: false,
};

export interface PlannedNotification {
  /** Kararlı kimlik: aynı vakit yeniden planlanınca aynı kimliği alır. */
  id: string;
  key: PrayerKey;
  at: Date;
  /** Vaktin kendisi (uyarı erken kurulmuşsa bundan farklıdır). */
  prayerAt: Date;
  beforeMinutes: number;
}

/** iOS'un bekleyen yerel bildirim sınırı. */
export const PLATFORM_LIMIT = 64;

function enabledFor(settings: NotificationSettings, key: PrayerKey): boolean {
  if (key === 'sunrise' && !settings.includeSunrise) return false;
  return settings.perPrayer[key] ?? true;
}

function idFor(day: DaySchedule, key: PrayerKey): string {
  const ay = String(day.month + 1).padStart(2, '0');
  const gun = String(day.day).padStart(2, '0');
  return `prayer-${day.year}${ay}${gun}-${key}`;
}

/**
 * Verilen günlerden bildirim planı üretir.
 * @param now Şu an; bundan önceki hiçbir an planlanmaz.
 */
export function planNotifications(
  days: readonly DaySchedule[],
  settings: NotificationSettings,
  now: Date = new Date(),
  limit: number = PLATFORM_LIMIT,
): PlannedNotification[] {
  if (!settings.enabled) return [];
  const before = Math.max(0, Math.min(120, Math.round(settings.beforeMinutes)));
  const out: PlannedNotification[] = [];

  for (const day of days) {
    for (const key of PRAYER_KEYS) {
      if (!enabledFor(settings, key)) continue;
      const entry = day.entries.find((e) => e.key === key);
      // Kutupta oluşmayan vakit için bildirim kurulmaz.
      if (!entry?.at) continue;
      const at = new Date(entry.at.getTime() - before * 60000);
      if (at.getTime() <= now.getTime()) continue;
      out.push({ id: idFor(day, key), key, at, prayerAt: entry.at, beforeMinutes: before });
    }
  }

  out.sort((a, b) => a.at.getTime() - b.at.getTime());
  return out.slice(0, Math.max(0, limit));
}

/**
 * Kaç gün ileriye plan kurulabilir: sınıra sığacak gün sayısı.
 * Beş vakit açıksa 64 bildirim ≈ 12 gün; hepsi açıksa ≈ 10 gün.
 */
export function coverageDays(settings: NotificationSettings, limit: number = PLATFORM_LIMIT): number {
  const gunluk = OBLIGATORY_KEYS.filter((k) => enabledFor(settings, k)).length
    + (enabledFor(settings, 'sunrise') ? 1 : 0);
  if (gunluk === 0) return 0;
  return Math.floor(limit / gunluk);
}
