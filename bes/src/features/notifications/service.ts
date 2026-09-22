/**
 * Bildirim servisi — şartname §16, §65.
 * Planı (saf mantık) cihaza kurar. Plan üretimi `plan.ts` içindedir ve
 * sınanmıştır; burada yalnız platform çağrıları vardır.
 */
import * as Notifications from 'expo-notifications';
import { logger } from '@/lib/log';
import type { PlannedNotification } from './plan';

const log = logger('bildirim');

export interface NotificationTexts {
  /** Vakit adına göre başlık üretir — metin çeviriden gelir. */
  title: (key: PlannedNotification['key']) => string;
  body: (n: PlannedNotification) => string;
}

export async function requestPermission(): Promise<boolean> {
  try {
    const mevcut = await Notifications.getPermissionsAsync();
    if (mevcut.granted) return true;
    const istek = await Notifications.requestPermissionsAsync();
    return istek.granted;
  } catch (e) {
    log.warn('bildirim izni alınamadı', { error: e });
    return false;
  }
}

/**
 * Planı uygular: önce **tüm** bekleyenleri siler, sonra yenilerini kurar.
 * Ayrı ayrı güncellemek yerine hepsini yeniden kurmak bilinçli: vakitler
 * konuma, yönteme ve düzeltmeye bağlı; kısmi güncelleme eski bildirimleri
 * geride bırakıp yanlış anda ezan okutur.
 */
export async function applyPlan(
  plan: readonly PlannedNotification[],
  texts: NotificationTexts,
  options: { sound: boolean } = { sound: true },
): Promise<number> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    let kurulan = 0;
    for (const n of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: {
          title: texts.title(n.key),
          body: texts.body(n),
          sound: options.sound,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at },
      });
      kurulan++;
    }
    return kurulan;
  } catch (e) {
    log.error('bildirimler kurulamadı', { error: e });
    return 0;
  }
}

export async function cancelAll(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    log.warn('bildirimler silinemedi', { error: e });
  }
}

/** Kurulu bekleyen bildirim sayısı — bildirim merkezinde gösterilir (§65). */
export async function pendingCount(): Promise<number> {
  try {
    return (await Notifications.getAllScheduledNotificationsAsync()).length;
  } catch {
    return 0;
  }
}
