/** İbadet istatistiği — şartname §42. */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, EmptyState, ProgressBar, Divider,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useWorshipStore } from '@/store/worship';
import { useLocationStore } from '@/store/locations';
import { dateKey } from '@/features/dhikr/stats';
import {
  summarizePrayers, currentPrayerStreak, dailyPrayerTotals, fastingCount, quranMinutesTotal,
  type PrayerPeriodStats,
} from '@/features/worship/stats';
import { zonedNow } from '@/lib/time/zone';

export default function WorshipStatsScreen() {
  const t = useT();
  const theme = useTheme();
  const days = useWorshipStore((s) => s.days);
  const fasts = useWorshipStore((s) => s.fasts);
  const konum = useLocationStore((s) => s.active());

  const bugun = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
  }, [konum]);

  const haftalik = useMemo(() => summarizePrayers(days, bugun, 7), [days, bugun]);
  const aylik = useMemo(() => summarizePrayers(days, bugun, 30), [days, bugun]);
  const seri = useMemo(() => currentPrayerStreak(days, bugun), [days, bugun]);
  const grafik = useMemo(() => dailyPrayerTotals(days, bugun, 14), [days, bugun]);
  const orucAylik = useMemo(() => fastingCount(fasts, bugun, 30), [fasts, bugun]);
  const kuranHaftalik = useMemo(() => quranMinutesTotal(days, bugun, 7), [days, bugun]);

  const kayitVar = Object.keys(days).length > 0;

  if (!kayitVar) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: t('log.stats') }} />
        <EmptyState icon="calendar" title={t('log.statsEmpty')} description={t('log.statsEmptyBody')} />
      </Screen>
    );
  }

  const ozetKart = (baslik: string, o: PrayerPeriodStats) => (
    <Card>
      <Column gap="sm">
        <Text variant="caption" tone="muted">{baslik}</Text>
        <Row justify="space-between">
          <Text tone="muted">{t('log.performed')}</Text>
          <Text variant="title3" tone="accent">{`${o.performed} / ${o.days * 5}`}</Text>
        </Row>
        <Row justify="space-between">
          <Text tone="muted">{t('log.jamaahCount')}</Text>
          <Text>{o.jamaah}</Text>
        </Row>
        <Row justify="space-between">
          <Text tone="muted">{t('log.qadaCount')}</Text>
          <Text>{o.qada}</Text>
        </Row>
        <ProgressBar
          value={o.rate}
          height={8}
          accessibilityLabel={`${t('log.rate')}: %${Math.round(o.rate * 100)}`}
        />
      </Column>
    </Card>
  );

  return (
    <Screen scroll motif="octagonGrid">
      <Stack.Screen options={{ headerShown: true, title: t('log.stats') }} />

      <Card accent>
        <Column gap="xs" align="center">
          <Text variant="callout" tone="onAccent">{t('dhikr.streak')}</Text>
          <Text variant="display" tone="onAccent">{t('dhikr.streakDays', { days: seri })}</Text>
        </Column>
      </Card>

      <SectionHeader title={t('dhikr.month')} />
      <Card>
        <Column gap="sm">
          {grafik.map((g) => (
            <View key={g.date}>
              <Row align="center" gap="sm">
                <Text variant="micro" tone="subtle" style={{ width: 44 }}>{g.date.slice(5)}</Text>
                <View style={{ flex: 1 }}>
                  <ProgressBar
                    value={g.completed / 5}
                    height={8}
                    accessibilityLabel={`${g.date}: ${g.completed}/5`}
                  />
                </View>
                <Text variant="micro" tone="muted" style={{ width: 30, textAlign: 'right' }}>
                  {`${g.completed}/5`}
                </Text>
              </Row>
            </View>
          ))}
        </Column>
      </Card>

      <Column gap="md" style={{ marginTop: theme.spacing.lg }}>
        {ozetKart(t('dhikr.week'), haftalik)}
        {ozetKart(t('dhikr.month'), aylik)}
      </Column>

      <SectionHeader title={t('log.fasting')} />
      <Card>
        <Row justify="space-between">
          <Text tone="muted">{t('log.fastingCount')}</Text>
          <Text variant="title3" tone="accent">{String(orucAylik)}</Text>
        </Row>
      </Card>

      <SectionHeader title={t('quran.title')} />
      <Card>
        <Row justify="space-between">
          <Text tone="muted">{t('log.quranMinutesTotal')}</Text>
          <Text variant="title3" tone="accent">{`${kuranHaftalik} ${t('notification.beforeUnit')}`}</Text>
        </Row>
      </Card>

      <Divider />
      <Text variant="micro" tone="subtle">{t('log.privateNote')}</Text>
    </Screen>
  );
}
