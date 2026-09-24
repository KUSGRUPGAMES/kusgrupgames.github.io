/** Zikir istatistiği — şartname §38. */
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
import { dateKey, withinDays, summarize, currentStreak, dailyTotals } from '@/features/dhikr/stats';
import { zonedNow } from '@/lib/time/zone';

export default function DhikrStatsScreen() {
  const t = useT();
  const theme = useTheme();
  const sessions = useWorshipStore((s) => s.sessions);
  const konum = useLocationStore((s) => s.active());

  const bugun = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
  }, [konum]);

  const gunluk = useMemo(() => summarize(withinDays(sessions, bugun, 1)), [sessions, bugun]);
  const haftalik = useMemo(() => summarize(withinDays(sessions, bugun, 7)), [sessions, bugun]);
  const aylik = useMemo(() => summarize(withinDays(sessions, bugun, 30)), [sessions, bugun]);
  const seri = useMemo(() => currentStreak(sessions, bugun), [sessions, bugun]);
  const grafik = useMemo(() => dailyTotals(sessions, bugun, 14), [sessions, bugun]);
  const enYuksek = Math.max(1, ...grafik.map((g) => g.total));

  if (sessions.length === 0) {
    return (
      <Screen topInset={false}>
        <Stack.Screen options={{ headerShown: true, title: t('dhikr.stats') }} />
        {/* Açıklama "Saymak için dokun" diyordu; bu ekranda dokunulacak sayaç
            yok, sayaç zikirmatik ekranında. */}
        <EmptyState icon="beads" title={t('dhikr.noSessions')} description={t('dhikr.noSessionsBody')} />
      </Screen>
    );
  }

  const ozetKart = (baslik: string, o: ReturnType<typeof summarize>) => (
    <Card>
      <Column gap="sm">
        <Text variant="caption" tone="muted">{baslik}</Text>
        <Row justify="space-between">
          <Text tone="muted">{t('dhikr.total')}</Text>
          <Text variant="title3" tone="accent">{o.total.toLocaleString('tr-TR')}</Text>
        </Row>
        <Row justify="space-between">
          <Text tone="muted">{t('dhikr.average')}</Text>
          <Text>{o.average.toLocaleString('tr-TR')}</Text>
        </Row>
        {o.topTitle ? (
          <Row justify="space-between">
            <Text tone="muted">{t('dhikr.top')}</Text>
            <Text>{o.topTitle}</Text>
          </Row>
        ) : null}
      </Column>
    </Card>
  );

  return (
    <Screen topInset={false} scroll motif="marka">
      <Stack.Screen options={{ headerShown: true, title: t('dhikr.stats') }} />

      <Card accent motif="starLattice">
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
                    value={g.total / enYuksek}
                    height={8}
                    accessibilityLabel={`${g.date}: ${g.total}`}
                  />
                </View>
                <Text variant="micro" tone="muted" style={{ width: 44, textAlign: 'right' }}>
                  {String(g.total)}
                </Text>
              </Row>
            </View>
          ))}
        </Column>
      </Card>

      <Column gap="md" style={{ marginTop: theme.spacing.lg }}>
        {ozetKart(t('dhikr.today'), gunluk)}
        {ozetKart(t('dhikr.week'), haftalik)}
        {ozetKart(t('dhikr.month'), aylik)}
      </Column>

      <Divider />
      <Text variant="micro" tone="subtle">{t('log.privateNote')}</Text>
    </Screen>
  );
}
