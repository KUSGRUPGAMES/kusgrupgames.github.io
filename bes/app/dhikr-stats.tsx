/**
 * Zikir istatistiği — şartname §38.
 *
 * Dönem seçilir (bugün, 7 gün, 30 gün, bu ay, tümü); o dönemde **hangi
 * zikirden ne kadar** çekildiği listelenir. Hazır zikirler hiç çekilmemiş
 * olsa da sıfırla görünür: kullanıcı eksiğini görüp planlayabilsin.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, EmptyState, ProgressBar, Divider, Segmented, Button,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useWorshipStore } from '@/store/worship';
import { useLocationStore } from '@/store/locations';
import {
  dateKey, summarize, currentStreak, dailyTotals, sessionsInPeriod, breakdown, type DhikrPeriod,
} from '@/features/dhikr/stats';
import { DHIKR_PRESETS } from '@/content/dhikr';
import { zonedNow } from '@/lib/time/zone';

const HAZIR = DHIKR_PRESETS.map((p) => p.title);

export default function DhikrStatsScreen() {
  const t = useT();
  const theme = useTheme();
  const sessions = useWorshipStore((s) => s.sessions);
  const konum = useLocationStore((s) => s.active());
  const [donem, setDonem] = useState<DhikrPeriod>('today');

  const bugun = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
  }, [konum]);

  const secili = useMemo(() => sessionsInPeriod(sessions, bugun, donem), [sessions, bugun, donem]);
  const ozet = useMemo(() => summarize(secili), [secili]);
  const dagilim = useMemo(() => breakdown(secili, HAZIR), [secili]);
  const seri = useMemo(() => currentStreak(sessions, bugun), [sessions, bugun]);
  const grafik = useMemo(() => dailyTotals(sessions, bugun, 14), [sessions, bugun]);
  const enYuksekGun = Math.max(1, ...grafik.map((g) => g.total));
  const enYuksekZikir = Math.max(1, ...dagilim.map((d) => d.total));

  if (sessions.length === 0) {
    return (
      <Screen topInset={false}>
        <Stack.Screen options={{ headerShown: true, title: t('dhikr.stats') }} />
        <EmptyState icon="beads" title={t('dhikr.noSessions')} description={t('dhikr.noSessionsBody')}
          actionLabel={t('dhikr.title')} onAction={() => router.dismissTo('/dhikr')} />
      </Screen>
    );
  }

  const sayi = (n: number) => n.toLocaleString('tr-TR');

  return (
    <Screen topInset={false} scroll motif="marka">
      <Stack.Screen options={{ headerShown: true, title: t('dhikr.stats') }} />

      <Segmented
        options={[
          { value: 'today', label: t('dhikr.today') },
          { value: 'week', label: t('dhikr.periodWeek') },
          { value: 'last30', label: t('dhikr.period30') },
          { value: 'thisMonth', label: t('dhikr.thisMonth') },
          { value: 'all', label: t('common.all') },
        ]}
        value={donem}
        onChange={setDonem}
        accessibilityLabel={t('dhikr.stats')}
      />

      <Card accent style={{ marginTop: theme.spacing.md }}>
        <Row justify="space-between" align="center">
          <Column gap="xxs">
            <Text variant="caption" tone="onAccent">{t('dhikr.total')}</Text>
            <Text variant="display" tone="onAccent">{sayi(ozet.total)}</Text>
          </Column>
          <Column gap="xs" align="flex-end">
            <Text variant="caption" tone="onAccent">
              {`${t('dhikr.average')}: ${sayi(ozet.average)}`}
            </Text>
            <Text variant="caption" tone="onAccent">
              {`${t('dhikr.streak')}: ${t('dhikr.streakDays', { days: seri })}`}
            </Text>
          </Column>
        </Row>
      </Card>

      <SectionHeader title={t('dhikr.byDhikr')} subtitle={t('dhikr.byDhikrHint')} />
      <Card>
        <Column gap="md">
          {dagilim.map((d) => (
            <Column key={d.title} gap="xxs">
              <Row justify="space-between" align="center" gap="sm">
                <Text variant="bodyStrong" tone={d.total > 0 ? 'default' : 'muted'} lines={1} style={{ flex: 1 }}>
                  {d.title}
                </Text>
                <Text variant="bodyStrong" tone={d.total > 0 ? 'accent' : 'subtle'}>
                  {d.total > 0 ? sayi(d.total) : t('dhikr.notYet')}
                </Text>
              </Row>
              <ProgressBar value={d.total / enYuksekZikir} height={6}
                accessibilityLabel={`${d.title}: ${d.total}`} />
              {d.total > 0 ? (
                <Text variant="micro" tone="subtle">
                  {t('dhikr.sessionsDays', { sessions: d.sessions, days: d.days })}
                </Text>
              ) : null}
            </Column>
          ))}
        </Column>
      </Card>

      <SectionHeader title={t('dhikr.last14')} />
      <Card>
        <Column gap="sm">
          {grafik.map((g) => (
            <Row key={g.date} align="center" gap="sm">
              <Text variant="micro" tone="subtle" style={{ width: 44 }}>{g.date.slice(5)}</Text>
              <View style={{ flex: 1 }}>
                <ProgressBar value={g.total / enYuksekGun} height={8} accessibilityLabel={`${g.date}: ${g.total}`} />
              </View>
              <Text variant="micro" tone="muted" style={{ width: 44, textAlign: 'right' }}>{String(g.total)}</Text>
            </Row>
          ))}
        </Column>
      </Card>

      <Button label={t('dhikr.title')} icon="beads" variant="secondary" block
        style={{ marginTop: theme.spacing.lg }} onPress={() => router.dismissTo('/dhikr')} />
      <Divider />
      <Text variant="micro" tone="subtle">{t('log.privateNote')}</Text>
    </Screen>
  );
}
