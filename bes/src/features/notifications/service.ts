/**
 * Bildirim servisi — şartname §16, §65.
 * Planı (saf mantık) cihaza kurar. Plan üretimi `plan.ts` içindedir ve
 * sınanmıştır; burada yalnız platform çağrıları vardır.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '@/lib/log';
import type { PlannedNotification } from './plan';
import { bizimMi, farkAl, bildirimImzasi, type KurulacakBildirim, type KuruluKayit } from './coordinator';
import { siraliKuyrukOlustur } from '@/lib/concurrency/serialize';

/**
 * Tüm kuyruk-değiştiren çağrılar (`syncNotifications`, `cancelOwned`)
 * **aynı** sıralı kuyruktan geçer. Ayrı kuyruklar olsaydı ikisi birbirine
 * göre yine yarışabilirdi; paylaşılan kuyruk, kök eşitleyici ile ayarlar/
 * merkez ekranlarının eşzamanlı çağrılarının birbirinin işini bozmamasını
 * garanti eder (bkz. `serialize.ts`).
 */
const kuyruk = siraliKuyrukOlustur();

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

/**
 * Bildirim izni verilmiş olsa bile iOS'ta **ses** ayrıca kapatılabilir
 * (Ayarlar → Bildirimler → BEŞ → Sesler). Böyle bir durumda `hasPermission`
 * yine `true` döner, bildirim görünür ama hiç ses çalmaz — kullanıcı bunu
 * "ezan okumuyor" diye yaşar, uygulamanın kendisi bunu bilemez. Android'de
 * bu ayrım yok (`ios` alanı gelmez); orada `null` dönüp banner gösterilmez.
 */
export async function soundAllowed(): Promise<boolean | null> {
  try {
    const durum = await Notifications.getPermissionsAsync();
    const ios = (durum as { ios?: { allowsSound?: boolean | null } }).ios;
    if (!ios || ios.allowsSound == null) return null;
    return ios.allowsSound;
  } catch (e) {
    log.warn('ses izni okunamadı', { error: e });
    return null;
  }
}

/**
 * Gerçek vakit bildirimiyle **birebir aynı yoldan** bir sınama bildirimi
 * kurar — "Ezanı dinle" düğmesi yalnız uygulama içi tam ezanı çalıyordu,
 * asıl özelliği (uygulama kapalıyken sistemin çaldığı 30 sn'lik bildirim
 * sesi) hiç sınamıyordu. Kullanıcı bunu kurup uygulamadan çıkarak ya da
 * kilitleyerek gerçek deneyimi duyabilir.
 */
export async function scheduleTestEzan(title: string, body: string, afterSeconds = 12, tur: 'short' | 'long' = 'long'): Promise<void> {
  await kanallariKur();
  await Notifications.scheduleNotificationAsync({
    identifier: 'test-ezan',
    content: {
      title, body, sound: IOS_EZAN[tur],
      // Odak/Rahatsız Etmeyin modunu kırar (yalnız iOS, bkz. gercekSyncNotifications).
      interruptionLevel: 'timeSensitive',
      data: { at: Date.now() + afterSeconds * 1000, tur: 'reminder', imza: 'test', ezan: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: afterSeconds,
      repeats: false,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_EZAN_KANAL[tur] } : {}),
    },
  });
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
        const veri = n.content.data as { at?: unknown; imza?: unknown } | null | undefined;
        return {
          id: n.identifier,
          at: typeof veri?.at === 'number' ? veri.at : null,
          imza: typeof veri?.imza === 'string' ? veri.imza : null,
        };
      });
  } catch (e) {
    log.warn('kurulu bildirimler okunamadı', { error: e });
    return [];
  }
}

const KANAL_EZAN = 'ezan';
/**
 * Ezan sesleri (5 Ekim). iOS bildirim sesine en çok 30 sn izin verir: "uzun"
 * 29,5 sn. Android kanalı dosyayı sonuna kadar çalar: "uzun" orada tam ezandır.
 * Android .caf çalamıyor (eski `ezan` kanalı bu yüzden varsayılan sesle
 * çalıyordu); Android'de wav/m4a kullanılır. Kanal sesi sonradan
 * değişmediği için her ses ayrı kanal.
 */
const IOS_EZAN = { short: 'ezankisa.caf', long: 'ezanuzun.caf' } as const;
const ANDROID_EZAN_KANAL = { short: 'ezan-kisa', long: 'ezan-tam' } as const;
const KANAL_VAKIT = 'vakit';

/**
 * Android bildirim kanalları. Kanalın sesi **kanal oluşturulurken** sabitlenir,
 * sonradan değiştirilemez; bu yüzden ezan ayrı bir kanaldır.
 */
async function kanallariKur(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // Eski kanal (yanlış biçimli ses) kaldırılır; kullanıcı ayarlarda iki ezan kanalı görür.
    await Notifications.deleteNotificationChannelAsync(KANAL_EZAN).catch(() => undefined);
    await Notifications.setNotificationChannelAsync(ANDROID_EZAN_KANAL.short, {
      name: 'Ezan (kısa)', importance: Notifications.AndroidImportance.HIGH, sound: 'ezan_kisa.m4a',
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync(ANDROID_EZAN_KANAL.long, {
      name: 'Ezan (tam)', importance: Notifications.AndroidImportance.HIGH, sound: 'ezan_tam.m4a',
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync(KANAL_VAKIT, {
      name: 'Vakit ve hatırlatıcılar', importance: Notifications.AndroidImportance.HIGH,
    });
  } catch (e) {
    log.warn('bildirim kanalları kurulamadı', { error: e });
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
async function gercekSyncNotifications(
  istenen: readonly KurulacakBildirim[],
  options: { sound: boolean } = { sound: true },
): Promise<EsitlemeSonucu> {
  if (!(await hasPermission())) {
    return { izin: false, kurulan: 0, iptalEdilen: 0, dokunulmayan: 0 };
  }
  try {
    const kurulu = await installedRecords();
    const { kurulacak, iptalEdilecek, dokunulmayan } = farkAl(istenen, kurulu, options.sound);

    for (const id of iptalEdilecek) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    await kanallariKur();
    let kurulan = 0;
    for (const n of kurulacak) {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: {
          title: n.title,
          body: n.body,
          // Ezan: pakete gömülü ses (app.config → expo-notifications
          // `sounds`). iOS bildirim sesine en çok 30 sn izin verir; dosya
          // ~16,1 sn'dir. CAF biçiminde: cihazda konsol kaydı WAV için
          // "Failed to find sound" hatası veriyordu (expo/expo#40954'te
          // bilinen bir UNNotificationSound(named:) sorunu); CAF, Apple'ın
          // yerel/beklenen biçimi. Android'de ses kanaldan gelir (`kanallariKur`).
          sound: options.sound ? (n.ezan && n.ezanSes ? IOS_EZAN[n.ezanSes] : true) : false,
          // Yalnız iOS: odak/Rahatsız Etmeyin modunda bildirim geliyor ama
          // sesi kesiliyordu (kullanıcı bunu "ezan okumuyor" diye yaşadı).
          // Ezan sesi taşıyan bildirim `timeSensitive` işaretlenince odak
          // modunu kırar; app.config'teki entitlement bunu gerektiriyor.
          ...(n.ezan && n.ezanSes && options.sound ? { interruptionLevel: 'timeSensitive' as const } : {}),
          // Fark almak için gereken alanlar. Tetikleyici okunamadığı için
          // zaman damgası ve içerik imzası bilerek içeriğe yazılır — imza
          // başlık/gövde/ses değişimini yakalar, yalnız zaman kıyaslamak
          // dil değişikliğini ya da ses ayarını kaçırıyordu.
          data: { at: n.at.getTime(), tur: n.tur, imza: bildirimImzasi(n, options.sound), ezan: n.ezan === true },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: n.at,
          ...(Platform.OS === 'android' ? { channelId: n.ezan && n.ezanSes && options.sound ? ANDROID_EZAN_KANAL[n.ezanSes] : KANAL_VAKIT } : {}),
        },
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
 * İstenen planı cihazla eşitler: **fark alarak**, ve **sıraya girerek**.
 *
 * Eski `applyPlan` her çağrıda `cancelAllScheduledNotificationsAsync()`
 * çağırıyordu. Bu üç şeyi bozuyordu: başka akışın (özel hatırlatıcılar)
 * kurduğu bildirimleri siliyordu, değişmeyen kayıtları gereksiz yere yeniden
 * kuruyordu, ve iki yeniden planlama çakışırsa arada kuyruk boş kalıyordu.
 *
 * Koordinatörün sahiplenmediği kimliklere (`prayer-`/`reminder-` dışı)
 * **hiç dokunulmaz**. Eşzamanlı çağrılar `kuyruk` üzerinden sıralanır —
 * ayrıntı `serialize.ts`'te.
 */
export function syncNotifications(
  istenen: readonly KurulacakBildirim[],
  options: { sound: boolean } = { sound: true },
): Promise<EsitlemeSonucu> {
  return kuyruk.ekle(() => gercekSyncNotifications(istenen, options));
}

async function gercekCancelOwned(): Promise<number> {
  try {
    const kurulu = await installedRecords();
    for (const k of kurulu) await Notifications.cancelScheduledNotificationAsync(k.id);
    return kurulu.length;
  } catch (e) {
    log.warn('bildirimler silinemedi', { error: e });
    return 0;
  }
}

/** Yalnız koordinatörün kayıtlarını siler. Aynı paylaşılan kuyruktan geçer. */
export function cancelOwned(): Promise<number> {
  return kuyruk.ekle(() => gercekCancelOwned());
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

/** İzin penceresi yeniden açılabilir mi (iOS'ta bir kez reddedilince hayır; Ayarlar'dan verilir). */
export async function notificationCanAskAgain(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).canAskAgain;
  } catch {
    return false;
  }
}
