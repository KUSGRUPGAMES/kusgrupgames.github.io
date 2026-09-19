/** Aylık vakit takvimi — şartname §14. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, Card, Row, Column, Text, IconButton, Divider, EmptyState, SectionHeader,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useDateFormat } from '@/lib/i18n';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { monthSchedule } from '@/features/prayer/schedule';
import { formatHM } from '@/features/prayer/calc';
import { PRAYER_KEYS, type MethodId, type PrayerKey } from '@/features/prayer/methods';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { zonedNow } from '@/lib/time/zone';

export default function PrayerCalendarScreen() {
  const ayBicimi = useDateFormat({ month: 'long', year: 'numeric', timeZone: 'UTC' });
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const konum = useLocationStore((s) => s.active());
  const settings = useSettingsStore((s) => s.settings);
  const bugun = useMemo(() => zonedNow(konum?.timezone ?? null), [konum]);
  const [ay, setAy] = useState({ year: bugun.year, month: bugun.month });

  const gunler = useMemo(() => {
    if (!konum) return [];
    return monthSchedule(
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
      ay.year,
      ay.month,
    );
  }, [konum, settings, ay]);

  if (!konum) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: t('prayer.calendar') }} />
        <EmptyState icon="location" title={t('location.empty')} description={t('location.searchHint')} />
      </Screen>
    );
  }

  const ayAdi = ayBicimi.format(new Date(Date.UTC(ay.year, ay.month, 1)));

  const kaydir = (delta: number) => {
    const d = new Date(Date.UTC(ay.year, ay.month + delta, 1));
    setAy({ year: d.getUTCFullYear(), month: d.getUTCMonth() });
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: t('prayer.calendar') }} />

      <Row align="center" justify="space-between">
        <IconButton name="chevronLeft" label={t('nav.back')} onPress={() => kaydir(-1)} />
        <Text variant="title3">{ayAdi}</Text>
        <IconButton name="chevronRight" label={t('common.next')} onPress={() => kaydir(1)} />
      </Row>

      <SectionHeader title={konum.label} subtitle={konum.country} />

      <Card padding="sm">
        <Row style={{ paddingVertical: theme.spacing.xs }}>
          <View style={{ width: 34 }} />
          {PRAYER_KEYS.map((k) => (
            <View key={k} style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="micro" tone="subtle">{label(k).slice(0, 3)}</Text>
            </View>
          ))}
        </Row>
        <Divider />
        {gunler.map((g) => {
          const buGun = g.year === bugun.year && g.month === bugun.month && g.day === bugun.day;
          return (
            <Row
              key={g.day}
              align="center"
              style={{
                paddingVertical: theme.spacing.sm,
                backgroundColor: buGun ? theme.colors.surfaceRaised : 'transparent',
                borderRadius: theme.radius.sm,
              }}
            >
              <Column style={{ width: 34 }}>
                <Text variant="caption" tone={buGun ? 'accent' : 'muted'}>{g.day}</Text>
              </Column>
              {PRAYER_KEYS.map((k) => (
                <View key={k} style={{ flex: 1, alignItems: 'center' }}>
                  <Text variant="micro" tone={buGun ? 'accent' : 'default'}>
                    {formatHM(g.times[k])}
                  </Text>
                </View>
              ))}
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}
