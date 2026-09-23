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
import { useT } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { useWorshipStore } from '@/store/worship';
import { rangeSchedule } from '@/features/prayer/schedule';
import { zonedNow } from '@/lib/time/zone';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { coverageDays, type NotificationSettings } from './plan';
import { birlesikPlan, type KurulacakBildirim } from './coordinator';
import { syncNotifications, type EsitlemeSonucu } from './service';
import type { MethodId, PrayerKey } from '@/features/prayer/methods';

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

  const gunler = useMemo(() => {
    if (!konum) return [];
    const z = zonedNow(konum.timezone);
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
      coverageDays(bildirimAyari) + 1,
    );
  }, [konum, settings, bildirimAyari]);

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
