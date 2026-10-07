/**
 * İbadet istatistiği — şartname §42.
 *
 * Dönem seçilir (son 7 gün, bu ay, ilk kayıttan beri) ve şu sorular
 * cevaplanır: kaç vakit kılındı, kaç vakit eksik, hangi vakit en çok
 * kaçıyor; kaç oruç tutuldu, oruç borcu ne kadar; kaza namazı borcu ne.
 *
 * Eksik yalnız **kaydı olan günlerden** sayılır: deftere hiç girilmemiş gün
 * "kılınmadı" sayılmaz, ayrıca "kayıt girilmedi" diye söylenir.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, EmptyState, ProgressBar, Divider, Segmented, Banner,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useWorshipStore, QADA_SLOTS } from '@/store/worship';
import { useLocationStore } from '@/store/locations';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { dateKey } from '@/features/dhikr/stats';
import {
  currentPrayerStreak, dailyPrayerTotals, periodDayKeys, prayerReport, fastReport, fastDebt,
  quranMinutesIn, type WorshipPeriod,
} from '@/features/worship/stats';
import { zonedNow } from '@/lib/time/zone';

const FARZ = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export default function WorshipStatsScreen() {
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const days = useWorshipStore((s) => s.days);
  const fasts = useWorshipStore((s) => s.fasts);
  const qada = useWorshipStore((s) => s.qada);
  const konum = useLocationStore((s) => s.active());
  const [donem, setDonem] = useState<WorshipPeriod>('week');

  const bugun = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
  }, [konum]);

  const gunler = useMemo(
    () => periodDayKeys(bugun, donem, [...Object.keys(days), ...Object.keys(fasts)]),
    [bugun, donem, days, fasts],
  );
  const namaz = useMemo(() => prayerReport(days, gunler), [days, gunler]);
  const oruc = useMemo(() => fastReport(fasts, gunler), [fasts, gunler]);
  const orucBorcu = useMemo(() => fastDebt(fasts), [fasts]);
  const kuran = useMemo(() => quranMinutesIn(days, gunler), [days, gunler]);
  const seri = useMemo(() => currentPrayerStreak(days, bugun), [days, bugun]);
  const grafik = useMemo(() => dailyPrayerTotals(days, bugun, 14), [days, bugun]);
  const kazaToplam = QADA_SLOTS.reduce((top, s) => top + (qada[s] ?? 0), 0);

  if (Object.keys(days).length === 0 && Object.keys(fasts).length === 0) {
    return (
      <Screen topInset={false}>
        <Stack.Screen options={{ headerShown: true, title: t('log.stats') }} />
        <EmptyState icon="calendar" title={t('log.statsEmpty')} description={t('log.statsEmptyBody')}
          actionLabel={t('log.title')} onAction={() => router.dismissTo('/worship-log')} />
      </Screen>
    );
  }

  const satir = (baslik: string, deger: string, vurgu = false) => (
    <Row justify="space-between" align="center">
      <Text tone="muted" style={{ flex: 1 }}>{baslik}</Text>
      <Text variant={vurgu ? 'title3' : 'bodyStrong'} tone={vurgu ? 'accent' : 'default'}>{deger}</Text>
    </Row>
  );
  const kayitsiz = namaz.days - namaz.recordedDays;

  return (
    <Screen topInset={false} scroll motif="octagonGrid">
      <Stack.Screen options={{ headerShown: true, title: t('log.stats') }} />

      <Segmented
        options={[
          { value: 'week', label: t('log.periodWeek') },
          { value: 'month', label: t('log.periodMonth') },
          { value: 'all', label: t('common.all') },
        ]}
        value={donem}
        onChange={setDonem}
        accessibilityLabel={t('log.stats')}
      />

      <SectionHeader title={t('log.prayers')}
        subtitle={t('log.recordedDays', { recorded: namaz.recordedDays, days: namaz.days })} />
      <Card accent>
        <Row justify="space-between" align="flex-end">
          <Column gap="xxs">
            <Text variant="caption" tone="onAccent">{t('log.performed')}</Text>
            <Text variant="display" tone="onAccent">{String(namaz.performed)}</Text>
          </Column>
          <Column gap="xxs" align="flex-end">
            <Text variant="caption" tone="onAccent">{t('log.missed')}</Text>
            <Text variant="title1" tone="onAccent" style={{ color: theme.colors.onAccentHighlight }}>
              {String(namaz.missed)}
            </Text>
          </Column>
        </Row>
        <View style={{ marginTop: theme.spacing.md }}>
          <ProgressBar value={namaz.rate} height={8} color={theme.colors.onAccentHighlight}
            track={theme.colors.onAccentBorder}
            accessibilityLabel={`${t('log.rate')}: %${Math.round(namaz.rate * 100)}`} />
        </View>
        <Text variant="caption" tone="onAccent" style={{ marginTop: theme.spacing.xs }}>
          {`${t('log.rate')}: %${Math.round(namaz.rate * 100)} · ${t('log.jamaahCount')}: ${namaz.jamaah} · ${t('log.qadaCount')}: ${namaz.qadaMarked}`}
        </Text>
      </Card>
      {kayitsiz > 0 ? (
        <Text variant="caption" tone="muted" style={{ marginTop: theme.spacing.sm }}>
          {t('log.unrecordedNote', { n: kayitsiz })}
        </Text>
      ) : null}

      <SectionHeader title={t('log.perPrayer')} />
      <Card>
        <Column gap="md">
          {FARZ.map((s) => {
            const r = namaz.perSlot[s];
            const toplam = r.performed + r.qada + r.missed;
            return (
              <Column key={s} gap="xxs">
                <Row justify="space-between">
                  <Text variant="bodyStrong">{label(s)}</Text>
                  <Text variant="caption" tone={r.missed > 0 ? 'danger' : 'muted'}>
                    {t('log.slotLine', { performed: r.performed, qada: r.qada, missed: r.missed })}
                  </Text>
                </Row>
                <ProgressBar value={toplam > 0 ? r.performed / toplam : 0} height={6}
                  accessibilityLabel={`${label(s)}: ${r.performed}/${toplam}`} />
              </Column>
            );
          })}
        </Column>
      </Card>

      <Banner
        tone={kazaToplam > 0 ? 'warning' : 'info'}
        title={`${t('log.qadaDebt')}: ${kazaToplam}`}
        description={t('log.qadaDebtBody', { n: kazaToplam })}
        actionLabel={t('log.openQada')}
        onAction={() => router.push('/qada')}
        style={{ marginTop: theme.spacing.md }}
      />

      <SectionHeader title={t('log.fasting')} />
      <Card>
        <Column gap="sm">
          {satir(t('log.ramadanKept'), String(oruc.ramadanKept))}
          {satir(t('log.ramadanMissed'), String(oruc.ramadanMissed))}
          {satir(t('log.qadaFastKept'), String(oruc.qadaKept))}
          {satir(t('log.nafileKept'), String(oruc.nafile))}
          <Divider />
          {satir(t('log.fastDebt'), String(orucBorcu), true)}
        </Column>
      </Card>

      <SectionHeader title={t('quran.title')} />
      <Card>
        {satir(t('log.quranMinutesTotal'), `${kuran} ${t('notification.beforeUnit')}`, true)}
      </Card>

      <SectionHeader title={t('dhikr.last14')} subtitle={`${t('log.streak')}: ${t('dhikr.streakDays', { days: seri })}`} />
      <Card>
        <Column gap="sm">
          {grafik.map((g) => (
            <Row key={g.date} align="center" gap="sm">
              <Text variant="micro" tone="subtle" style={{ width: 44 }}>{g.date.slice(5)}</Text>
              <View style={{ flex: 1 }}>
                <ProgressBar value={g.completed / 5} height={8} accessibilityLabel={`${g.date}: ${g.completed}/5`} />
              </View>
              <Text variant="micro" tone="muted" style={{ width: 30, textAlign: 'right' }}>{`${g.completed}/5`}</Text>
            </Row>
          ))}
        </Column>
      </Card>

      <Divider />
      <Text variant="micro" tone="subtle">{t('log.privateNote')}</Text>
    </Screen>
  );
}
