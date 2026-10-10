/**
 * Widget ve Dinamik Ada eşitleyicisi — D30.
 *
 * - Konum, ayar, dil ya da gün değişince vakitleri (bugün + 3 gün) ve günlük
 *   içeriği iOS'ta App Group'a, Android'de kalıcı depoya yazar, widget'ları
 *   yeniden yükletir.
 * - Uygulama arka plana geçerken (ve açıkken vakit değişince) Dinamik
 *   Ada'daki geri sayımı sıradaki vakte kurar; ayar kapalıysa kaldırır
 *   (yalnız iOS — Android'in Live Activity karşılığı yok).
 *
 * iOS/Android dışında ya da yerel modül yoksa (Expo Go, web, test) sessiz.
 */
import { useEffect, useMemo, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { rangeSchedule } from '@/features/prayer/schedule';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { zonedNow } from '@/lib/time/zone';
import { dateKey } from '@/features/dhikr/stats';
import { pickDaily } from '@/features/daily/pick';
import { allDuas } from '@/features/duas/pool';
import { currentVersePool } from '@/features/content/pools';
import { pickDailyVerse } from '@/features/daily/verse';
import { logger } from '@/lib/log';
import { liveActivity } from '../../../modules/bes-live-activity';
import { buildWidgetPayload, nextTwo, WIDGET_KEY, type WidgetDaily } from './payload';
import { saveAndroidWidgetPayload } from './android/store';
import { VakitWidget, GununWidget } from './android/render';
import { scheduleInputFrom } from '@/features/prayer/window';
import { useOfficialVersion } from '@/features/prayer/officialRuntime';

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

  const resmiSurum = useOfficialVersion();
  const veri = useMemo(() => {
    if (!konum) return null;
    void resmiSurum;
    const z = zonedNow(konum.timezone);
    const days = rangeSchedule(scheduleInputFrom(konum, settings), { year: z.year, month: z.month, day: z.day }, 4);

    // Günlük içerik: ana sayfadaki "Günün âyeti/duası" ile aynı seçim.
    const havuz = currentVersePool();
    const daily: WidgetDaily[] = days.map((g) => {
      const ayet = pickDailyVerse(g, havuz);
      const dua = pickDaily(allDuas(), { year: g.year, month: g.month, day: g.day });
      return {
        d: dateKey(g.year, g.month, g.day),
        ar: ayet?.text ?? '',
        tr: ayet?.meal ?? '',
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
  }, [konum, settings, t, label, bugun, resmiSurum]);

  // Widget verisi (iOS — App Group üzerinden).
  useEffect(() => {
    if (!depo || !grup || !veri) return;
    try {
      depo.setString(WIDGET_KEY, JSON.stringify(veri), grup);
      depo.reloadWidget();
    } catch (e) {
      log.warn('widget verisi yazılamadı', { error: e });
    }
  }, [veri, grup]);

  // Widget verisi (Android — ana ekran widget'ları). `veri` değişince hem
  // kalıcı depoya yazılır (OS'un kendi tetiklediği periyodik yenileme
  // buradan okur, uygulama kapalıyken de), hem açık uygulamadaki widget'lar
  // anında güncellenir.
  useEffect(() => {
    if (Platform.OS !== 'android' || !veri) return;
    void saveAndroidWidgetPayload(veri).then(() => {
      void requestWidgetUpdate({
        widgetName: 'VakitWidget',
        renderWidget: () => <VakitWidget payload={veri} nowSec={Date.now() / 1000} />,
      }).catch((e: unknown) => log.warn('vakit widget güncellenemedi', { error: e }));
      void requestWidgetUpdate({
        widgetName: 'GununWidget',
        renderWidget: () => <GununWidget payload={veri} />,
      }).catch((e: unknown) => log.warn('günün widget güncellenemedi', { error: e }));
    });
  }, [veri]);

  // Dinamik Ada (iOS) / kalıcı bildirim (Android): açıkken vakit değişince
  // ve arka plana geçerken güncellenir. Android'de asıl ilerleme native
  // tarafta (AlarmManager + BesVakitReceiver) olur, bu çağrı yalnız veri
  // tazeler ve alarmı yeniden kurar — zararsız, idempotent.
  const acik = settings.notifications.liveActivity;
  const veriRef = useRef(veri);
  veriRef.current = veri;
  const sonHedef = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return undefined;
    const kur = () => {
      const v = veriRef.current;
      if (!acik || !v) {
        if (sonHedef.current !== 'kapali') { sonHedef.current = 'kapali'; void liveActivity.end(); }
        return;
      }
      const iki = nextTwo(v.times, Date.now() / 1000);
      if (!iki) { void liveActivity.end(); return; }
      const [s, sonra] = iki;
      // Önümüzdeki vakitler (en çok 10 — yaklaşık iki gün): etkinlik uygulama
      // uyurken sıradakine bunlardan geçer.
      const simdi = Date.now() / 1000;
      const upcoming = v.times.filter((x) => x.t > simdi).slice(0, 10).map((x) => ({ n: x.n, t: x.t, hm: x.hm }));
      // Aynı vakit için tekrar tekrar güncelleme yok; yalnız değişince.
      const imza = `${v.city}|${s.t}|${s.n}`;
      if (sonHedef.current === imza) return;
      sonHedef.current = imza;
      void liveActivity.startOrUpdate({
        city: v.city, title: t('prayer.next'), name: s.n, target: s.t, hm: s.hm,
        following: sonra ? `${sonra.n} ${sonra.hm}` : '',
        upcoming,
      });
    };
    // Vakit girdiği saniyede sıradakine geç (60 sn'lik yoklama, kilit ekranını
    // bir dakikaya kadar "0:00"da bırakıyordu).
    let tam: ReturnType<typeof setTimeout> | null = null;
    const planla = () => {
      if (tam) clearTimeout(tam);
      const v = veriRef.current;
      const simdi = Date.now() / 1000;
      const sonraki = v?.times.find((x) => x.t > simdi);
      if (sonraki) tam = setTimeout(() => { kur(); planla(); }, Math.min((sonraki.t - simdi) * 1000 + 1500, 2 ** 31 - 1));
    };
    kur(); planla();
    // Öne gelişte de hemen güncelle: önceden yalnız arka plana geçerken
    // güncelleniyordu; uygulama açılınca kilit ekranı bir dakika eski kalıyordu.
    const sub = AppState.addEventListener('change', () => { kur(); planla(); });
    const zamanlayici = setInterval(kur, 60_000);
    return () => { sub.remove(); clearInterval(zamanlayici); if (tam) clearTimeout(tam); };
  }, [acik, veri, t]);
}
