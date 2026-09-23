/**
 * Bildirim servisi — şartname §16, §65.
 * Planı (saf mantık) cihaza kurar. Plan üretimi `plan.ts` içindedir ve
 * sınanmıştır; burada yalnız platform çağrıları vardır.
 */
import * as Notifications from 'expo-notifications';
import { logger } from '@/lib/log';
import type { PlannedNotification } from './plan';
import { bizimMi, farkAl, type KurulacakBildirim, type KuruluKayit } from './coordinator';

const log = logger('bildirim');

export interface NotificationTexts {
  /** Vakit adına göre başlık üretir — metin çeviriden gelir. */
  title: (key: PlannedNotification['key']) => string;
  body: (n: PlannedNotification) => string;
}

/**
 * İzni **sormadan** okur.
 *
 * Açılışta yeniden planlama bunu kullanır: kullanıcı bir eylem yapmadan
 * sistem istemi açmak rahatsız edicidir ve onboarding'deki tercihle
 * çelişir. İzin yoksa sessizce hiçbir şey kurulmaz.
 */
export async function hasPermission(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch (e) {
    log.warn('bildirim izni okunamadı', { error: e });
    return false;
  }
}

/** Kullanıcı eylemiyle izin ister. Açılışta **çağrılmaz**. */
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
 * Cihazda kurulu olan **bizim** kayıtlarımızı okur.
 *
 * Zaman `content.data.at` alanından gelir; tetikleyici nesnesi platforma
 * göre farklı biçimde döndüğü için güvenilir karşılaştırma yapılamıyor.
 */
export async function installedRecords(): Promise<KuruluKayit[]> {
  try {
    const hepsi = await Notifications.getAllScheduledNotificationsAsync();
    return hepsi
      .filter((n) => bizimMi(n.identifier))
      .map((n) => {
        const ham = (n.content.data as { at?: unknown } | null | undefined)?.at;
        return { id: n.identifier, at: typeof ham === 'number' ? ham : null };
      });
  } catch (e) {
    log.warn('kurulu bildirimler okunamadı', { error: e });
    return [];
  }
}

export interface EsitlemeSonucu {
  izin: boolean;
  kurulan: number;
  iptalEdilen: number;
  dokunulmayan: number;
}

/**
 * İstenen planı cihazla eşitler: **fark alarak**.
 *
 * Eski `applyPlan` her çağrıda `cancelAllScheduledNotificationsAsync()`
 * çağırıyordu. Bu üç şeyi bozuyordu: başka akışın (özel hatırlatıcılar)
 * kurduğu bildirimleri siliyordu, değişmeyen kayıtları gereksiz yere yeniden
 * kuruyordu, ve iki yeniden planlama çakışırsa arada kuyruk boş kalıyordu.
 *
 * Koordinatörün sahiplenmediği kimliklere (`prayer-`/`reminder-` dışı)
 * **hiç dokunulmaz**.
 */
export async function syncNotifications(
  istenen: readonly KurulacakBildirim[],
  options: { sound: boolean } = { sound: true },
): Promise<EsitlemeSonucu> {
  if (!(await hasPermission())) {
    return { izin: false, kurulan: 0, iptalEdilen: 0, dokunulmayan: 0 };
  }
  try {
    const kurulu = await installedRecords();
    const { kurulacak, iptalEdilecek, dokunulmayan } = farkAl(istenen, kurulu);

    for (const id of iptalEdilecek) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    let kurulan = 0;
    for (const n of kurulacak) {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: {
          title: n.title,
          body: n.body,
          sound: options.sound,
          // Fark almak için gereken tek alan. Tetikleyici okunamadığı için
          // zaman damgası bilerek içeriğe yazılır.
          data: { at: n.at.getTime(), tur: n.tur },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at },
      });
      kurulan += 1;
    }
    return { izin: true, kurulan, iptalEdilen: iptalEdilecek.length, dokunulmayan };
  } catch (e) {
    log.error('bildirimler eşitlenemedi', { error: e });
    return { izin: true, kurulan: 0, iptalEdilen: 0, dokunulmayan: 0 };
  }
}

/**
 * Yalnız koordinatörün kayıtlarını siler.
 *
 * `cancelAll` toptan siliyor ve başka kaynağın bildirimini de götürüyordu.
 */
export async function cancelOwned(): Promise<number> {
  try {
    const kurulu = await installedRecords();
    for (const k of kurulu) await Notifications.cancelScheduledNotificationAsync(k.id);
    return kurulu.length;
  } catch (e) {
    log.warn('bildirimler silinemedi', { error: e });
    return 0;
  }
}

/** @deprecated `syncNotifications` kullan — bu toptan silip baştan kurar. */
export async function applyPlan(
  plan: readonly PlannedNotification[],
  texts: NotificationTexts,
  options: { sound: boolean } = { sound: true },
): Promise<number> {
  const sonuc = await syncNotifications(
    plan.map((n) => ({
      id: n.id,
      tur: 'prayer' as const,
      at: n.at,
      title: texts.title(n.key),
      body: texts.body(n),
    })),
    options,
  );
  return sonuc.kurulan + sonuc.dokunulmayan;
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
