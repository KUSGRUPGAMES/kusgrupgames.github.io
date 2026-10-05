/**
 * Vakit penceresi — reklam kuralı §68 için "vakte ne kadar kaldı, vakit ne
 * kadar önce girdi" sorusunun cevabı. Ekran bileşeninden bağımsız: reklam
 * kararı verildiği anda depolardaki konum ve ayarla hesaplanır.
 */
import type { MethodId, PrayerKey } from './methods';
import { nowView, type ScheduleInput } from './schedule';

export interface PrayerWindow {
  secondsToNextPrayer: number | null;
  secondsSincePrayer: number | null;
}

interface KonumLike { latitude: number; longitude: number; timezone: string; elevation?: number | undefined; diyanetId?: string | undefined }
interface AyarLike { method: string; asrShadow: ScheduleInput['options']['asrShadow']; adjustments: unknown }

/** Ana sayfa ile aynı girdi; ikisi ayrışırsa reklam kuralı yanlış vakte bakar. */
export function scheduleInputFrom(konum: KonumLike, settings: AyarLike): ScheduleInput {
  return {
    latitude: konum.latitude,
    longitude: konum.longitude,
    timezone: konum.timezone,
    ...(konum.diyanetId ? { diyanetId: konum.diyanetId } : {}),
    options: {
      method: settings.method as MethodId,
      asrShadow: settings.asrShadow,
      adjustments: settings.adjustments as Partial<Record<PrayerKey, number>>,
      ...(konum.elevation === undefined ? {} : { elevation: konum.elevation }),
    },
  };
}

export function prayerWindow(input: ScheduleInput | null, now: Date = new Date()): PrayerWindow {
  if (!input) return { secondsToNextPrayer: null, secondsSincePrayer: null };
  const v = nowView(input, now);
  const girdi = v.current ? v.today.entries.find((e) => e.key === v.current)?.at ?? null : null;
  return {
    secondsToNextPrayer: v.next ? v.secondsToNext : null,
    secondsSincePrayer: girdi ? Math.max(0, Math.round((now.getTime() - girdi.getTime()) / 1000)) : null,
  };
}
