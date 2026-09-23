/**
 * Bildirim eşitlemesinin **tek giriş noktası**.
 *
 * Her ekran kendi planını kurmaz. Bu kanca girdileri bir yerde toplar,
 * koordinatörden birleşik planı alır ve cihazla eşitler.
 *
 * ## Ne zaman çalışır
 *
 * Girdilerden biri değiştiğinde. Girdiler vakitleri ya da metni değiştiren
 * her şeydir:
 *
 * - konum (enlem, boylam, saat dilimi)
 * - hesaplama yöntemi, ikindi ölçüsü, dakika düzeltmeleri
 * - bildirim ayarları (açık/kapalı, vakit bazlı, erken uyarı, ses)
 * - özel hatırlatıcılar
 * - arayüz dili (bildirim metni ondan geliyor)
 *
 * Bunların hiçbiri eskiden yeniden planlama tetiklemiyordu; plan yalnız
 * ayarlar ekranından ve elle "yeniden kur" düğmesinden kuruluyordu. Ayarlara
 * hiç girmeyen kullanıcının planı ~10-12 günde tükeniyor, bildirimler
 * sessizce duruyordu.
 *
 * ## İzin
 *
 * Kendiliğinden **izin istemez**; yalnız izin zaten verilmişse kurar. Açılışta
 * sistem istemi açmak rahatsız edicidir ve onboarding'deki tercihle çelişir.
 * İzin istemek kullanıcı eylemine bağlıdır (ayarlar ekranındaki düğme).
 *
 * ## Sonsuz döngü
 *
 * Etki, **girdilerin kendisine** değil onlardan türetilen kararlı bir imzaya
 * bağlıdır. Doğrudan nesnelere bağlanınca her render yeni kimlik üretiyor ve
 * eşitleme kendini tetikleyip duruyordu.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useT } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { useWorshipStore } from '@/store/worship';
import { rangeSchedule } from '@/features/prayer/schedule';
import { zonedNow } from '@/lib/time/zone';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { coverageDays, type NotificationSettings } from './plan';
import { reminderCoverageDays } from './reminders';
import { birlesikPlan, type KurulacakBildirim } from './coordinator';
import { syncNotifications, type EsitlemeSonucu } from './service';
import type { MethodId, PrayerKey } from '@/features/prayer/methods';

/**
 * Gün değişimi ve arka plandan dönüş algılayıcı.
 *
 * `gunler` (ve dolayısıyla plan) eskiden yalnız konum/ayar/hatırlatıcı
 * değiştiğinde yeniden hesaplanıyordu — **zaman ilerledikçe değil**.
 * Uygulama günlerce arka planda kaldığında gün aralığı bayatlıyor, üretilen
 * planın tamamı geçmişte kalıp bildirimler sessizce kesiliyordu.
 *
 * İki tetikleyici: (1) uygulama arka plandan öne gelince — anında yakalanır;
 * (2) uygulama açık kalırken gün değişirse (gece yarısını geçen bir oturum)
 * — düşük sıklıklı bir denetimle yakalanır. `useTicker`deki
 * (`prayer/useSchedule.ts`) `AppState` kalıbıyla aynı üsluptadır.
 */
function useGunYenileyici(timezone: string | null): number {
  const [tetik, setTetik] = useState(0);
  const sonGun = useRef<string | null>(null);

  const gunAnahtari = useCallback((): string | null => {
    if (!timezone) return null;
    const z = zonedNow(timezone);
    return `${z.year}-${z.month}-${z.day}`;
  }, [timezone]);

  const kontrolEt = useCallback(() => {
    const simdi = gunAnahtari();
    if (simdi !== null && simdi !== sonGun.current) {
      sonGun.current = simdi;
      setTetik((n) => n + 1);
    }
  }, [gunAnahtari]);

  useEffect(() => {
    sonGun.current = gunAnahtari();
  }, [gunAnahtari]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') kontrolEt(); });
    // Ön planda açık kalırken gün değişimini de yakalamak için düşük
    // sıklıklı bir denetim — pil dostu, 30 dakikada bir.
    const zamanlayici = setInterval(kontrolEt, 30 * 60 * 1000);
    return () => { sub.remove(); clearInterval(zamanlayici); };
  }, [kontrolEt]);

  return tetik;
}

export interface NotificationSyncDurumu {
  /** Cihazla eşitlenmiş istenen plan — bildirim merkezi bunu gösterir. */
  plan: KurulacakBildirim[];
  sonSonuc: EsitlemeSonucu | null;
  /** Kullanıcı eylemiyle elle eşitleme (ayarlar ekranındaki düğme). */
  esitle: () => Promise<EsitlemeSonucu>;
}

export function useNotificationSync(): NotificationSyncDurumu {
  const t = useT();
  const { language } = useI18n();
  const label = usePrayerLabel();
  const settings = useSettingsStore((s) => s.settings);
  const konum = useLocationStore((s) => s.active());
  const reminders = useWorshipStore((s) => s.reminders);
  const [sonSonuc, setSonSonuc] = useState<EsitlemeSonucu | null>(null);

  const bildirimAyari: NotificationSettings = useMemo(() => ({
    enabled: settings.notifications.enabled,
    perPrayer: settings.notifications.perPrayer as Partial<Record<PrayerKey, boolean>>,
    beforeMinutes: settings.notifications.beforeMinutes,
    includeSunrise: false,
  }), [settings.notifications]);

  const gunTetik = useGunYenileyici(konum?.timezone ?? null);

  const gunler = useMemo(() => {
    if (!konum) return [];
    const z = zonedNow(konum.timezone);
    // **İki gün sayısının büyüğü** alınır. `coverageDays` yalnız vakit
    // bildirimi ayarlarına bakar; genel anahtar açık ama tüm vakit
    // bildirimleri kapalıyken 0 döner. O durumda gün aralığı yalnız ona
    // dayansaydı (+1 ile tek gün) özel hatırlatıcılara neredeyse hiç
    // gelecek gün bırakmıyordu — bkz. `reminderCoverageDays`.
    const gunSayisi = Math.max(coverageDays(bildirimAyari), reminderCoverageDays(reminders)) + 1;
    return rangeSchedule(
      {
        latitude: konum.latitude,
        longitude: konum.longitude,
        timezone: konum.timezone,
        options: {
          method: settings.method as MethodId,
          asrShadow: settings.asrShadow,
          adjustments: settings.adjustments as Partial<Record<PrayerKey, number>>,
        },
      },
      { year: z.year, month: z.month, day: z.day },
      gunSayisi,
    );
    // `gunTetik` yalnız zamanın ilerlediğini fark etmek için bağımlılıkta:
    // kendi değeri gövdede kullanılmaz, yalnız değişimi `zonedNow()`u tazeler.
  }, [konum, settings, bildirimAyari, reminders, gunTetik]);

  const plan = useMemo(() => birlesikPlan({
    gunler,
    bildirimAyari,
    hatirlaticilar: reminders,
    metin: {
      vakitBaslik: () => t('notification.enteredTitle'),
      // Erken uyarı kuruluysa metin "girdi" değil "kaldı" demeli. Bu mantık
      // eskiden yalnız ayarlar ekranında vardı; merkez aynı bildirimi başka
      // metinle kuruyordu ve hangisinin geçerli olduğu çağrı sırasına
      // bağlıydı.
      vakitGovde: (key, oncesi) => (oncesi > 0
        ? t('prayer.remainingTo', {
          name: label(key),
          time: `${oncesi} ${t('notification.beforeUnit')}`,
        })
        : t('notification.enteredBody', { name: label(key) })),
    },
  }), [gunler, bildirimAyari, reminders, t, label]);

  const ses = settings.notifications.sound;

  /**
   * Planın kararlı imzası. Nesne kimliği her render değişiyor; eşitlemeyi ona
   * bağlamak sonsuz döngü üretiyordu.
   */
  const imza = useMemo(
    () => `${ses ? 1 : 0}|${language}|${plan.map((n) => `${n.id}@${n.at.getTime()}`).join(',')}`,
    [plan, ses, language],
  );

  const esitle = useCallback(async () => {
    const sonuc = await syncNotifications(plan, { sound: ses });
    setSonSonuc(sonuc);
    return sonuc;
  }, [plan, ses]);

  const sonImza = useRef<string | null>(null);
  useEffect(() => {
    if (sonImza.current === imza) return;
    sonImza.current = imza;
    void esitle();
    // Bağımlılık bilerek yalnız `imza`: `esitle` plana bağlı olduğu için
    // onu da eklemek her render'da etkiyi tetikler. `imza` planın kararlı
    // özetidir; `sonImza` koruması zaten yinelemeyi engelliyor.
  }, [imza, esitle]);

  return { plan, sonSonuc, esitle };
}
