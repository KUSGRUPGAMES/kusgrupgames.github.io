/**
 * Widget ve Dinamik Ada eşitleyicisi — D30.
 *
 * - Konum, ayar, dil ya da gün değişince vakitleri (bugün + 3 gün) ve günlük
 *   içeriği App Group'a yazar, widget'ları yeniden yükletir.
 * - Uygulama arka plana geçerken (ve açıkken vakit değişince) Dinamik
 *   Ada'daki geri sayımı sıradaki vakte kurar; ayar kapalıysa kaldırır.
 *
 * Yalnız iOS'ta iş yapar; yerel modül yoksa (Expo Go, web, test) sessiz.
 */
import { useEffect, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { rangeSchedule } from '@/features/prayer/schedule';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import type { MethodId, PrayerKey } from '@/features/prayer/methods';
import { zonedNow } from '@/lib/time/zone';
import { dateKey } from '@/features/dhikr/stats';
import { dailyIndex, pickDaily } from '@/features/daily/pick';
import { getAyahByIndex, getQuranIndexSize, getTranslationByIndex } from '@/features/quran/data';
import { DUAS } from '@/content/duas';
import { logger } from '@/lib/log';
import { liveActivity } from '../../../modules/bes-live-activity';
import { buildWidgetPayload, nextTwo, WIDGET_KEY, type WidgetDaily } from './payload';

const log = logger('widget');

interface Depo {
  setString(key: string, value: string, group?: string): void;
  reloadWidget(kind?: string): void;
}
const depo = Platform.OS === 'ios' ? requireOptionalNativeModule<Depo>('ExtensionStorage') : null;

export function useWidgetSync(): void {
  const t = useT();
  const label = usePrayerLabel();
  const settings = useSettingsStore((s) => s.settings);
  const konum = useLocationStore((s) => s.active());
  const grup = (Constants.expoConfig?.extra as { appGroup?: string } | undefined)?.appGroup;

  const bugun = konum ? (() => { const z = zonedNow(konum.timezone); return dateKey(z.year, z.month, z.day); })() : '';

  const veri = useMemo(() => {
    if (!konum) return null;
    const z = zonedNow(konum.timezone);
    const days = rangeSchedule({
      latitude: konum.latitude, longitude: konum.longitude, timezone: konum.timezone,
      options: {
        method: settings.method as MethodId,
        asrShadow: settings.asrShadow,
        adjustments: settings.adjustments as Partial<Record<PrayerKey, number>>,
        ...(konum.elevation === undefined ? {} : { elevation: konum.elevation }),
      },
    }, { year: z.year, month: z.month, day: z.day }, 4);

    // Günlük içerik: ana sayfadaki "Günün âyeti/duası" ile aynı seçim.
    const toplam = getQuranIndexSize();
    const daily: WidgetDaily[] = days.map((g) => {
      const i = dailyIndex({ year: g.year, month: g.month, day: g.day, length: toplam, salt: 313 });
      const ayet = i < 0 ? null : getAyahByIndex(i);
      const dua = pickDaily(DUAS, { year: g.year, month: g.month, day: g.day });
      return {
        d: dateKey(g.year, g.month, g.day),
        ar: ayet?.text ?? '',
        tr: i < 0 ? '' : (getTranslationByIndex(i) ?? ''),
        ref: ayet ? `${ayet.surahName} ${ayet.ayah}` : '',
        duaTitle: dua?.title ?? '',
        dua: dua?.body ?? '',
      };
    });

    return buildWidgetPayload({
      city: konum.label, days, label, daily,
      labels: {
        next: t('prayer.next'), openApp: t('widget.openApp'),
        verseOfDay: t('explore.dailyAyah'), duaOfDay: t('dua.ofDay'), times: t('prayer.todayTimes'),
      },
    });
    // `bugun` yalnız gün değişince yeniden hesaplatmak için bağımlılıkta.
  }, [konum, settings.method, settings.asrShadow, settings.adjustments, t, label, bugun]);

  // Widget verisi.
  useEffect(() => {
    if (!depo || !grup || !veri) return;
    try {
      depo.setString(WIDGET_KEY, JSON.stringify(veri), grup);
      depo.reloadWidget();
    } catch (e) {
      log.warn('widget verisi yazılamadı', { error: e });
    }
  }, [veri, grup]);

  // Dinamik Ada: açıkken vakit değişince ve arka plana geçerken güncellenir.
  const acik = settings.notifications.liveActivity;
  const veriRef = useRef(veri);
  veriRef.current = veri;
  const sonHedef = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    const kur = () => {
      const v = veriRef.current;
      if (!acik || !v) {
        if (sonHedef.current !== 'kapali') { sonHedef.current = 'kapali'; void liveActivity.end(); }
        return;
      }
      const iki = nextTwo(v.times, Date.now() / 1000);
      if (!iki) { void liveActivity.end(); return; }
      const [s, sonra] = iki;
      // Aynı vakit için tekrar tekrar güncelleme yok; yalnız değişince.
      const imza = `${v.city}|${s.t}|${s.n}`;
      if (sonHedef.current === imza) return;
      sonHedef.current = imza;
      void liveActivity.startOrUpdate({
        city: v.city, title: t('prayer.next'), name: s.n, target: s.t, hm: s.hm,
        following: sonra ? `${sonra.n} ${sonra.hm}` : '',
      });
    };
    kur();
    const sub = AppState.addEventListener('change', (durum) => { if (durum !== 'active') kur(); });
    // Açıkken vakit girdiğinde sıradakine geç.
    const zamanlayici = setInterval(kur, 60_000);
    return () => { sub.remove(); clearInterval(zamanlayici); };
  }, [acik, veri, t]);
}
