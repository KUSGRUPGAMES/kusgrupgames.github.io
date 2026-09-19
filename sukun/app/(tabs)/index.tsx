/**
 * Ana Sayfa — şartname §14, §20, §21.
 * Kart düzeni kullanıcı tarafından değiştirilebilir; sıradaki vakit kartı
 * sabittir (kapatılamaz), çünkü uygulamanın çekirdeği odur.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Screen, SectionHeader, Card, Text, Column, CountdownRing, Button, EmptyState, Banner, Row,
} from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { useHomeLayoutStore, type HomeCardId } from '@/store/homeLayout';
import { useLiveView } from '@/features/prayer/useSchedule';
import { PrayerList, usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { formatCountdown } from '@/features/prayer/calc';
import type { ScheduleInput } from '@/features/prayer/schedule';
import type { MethodId, PrayerKey } from '@/features/prayer/methods';
import { zonedNow } from '@/lib/time/zone';
import {
  DailyAyahCard, DailyDuaCard, DailyKnowledgeCard, DailyNameCard, HijriDateCard,
  ReligiousDayCard, MoonCard, FridayCard, RamadanCard, type DailyContext,
} from '@/features/daily/components/DailyCards';

export default function HomeScreen() {
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const konum = useLocationStore((s) => s.active());
  const settings = useSettingsStore((s) => s.settings);
  const kartlar = useHomeLayoutStore((s) => s.cards);

  const input = useMemo<ScheduleInput | null>(() => {
    if (!konum) return null;
    return {
      latitude: konum.latitude,
      longitude: konum.longitude,
      timezone: konum.timezone,
      options: {
        method: settings.method as MethodId,
        asrShadow: settings.asrShadow,
        adjustments: settings.adjustments as Partial<Record<PrayerKey, number>>,
        ...(konum.elevation === undefined ? {} : { elevation: konum.elevation }),
      },
    };
  }, [konum, settings]);

  const live = useLiveView(input);

  const ctx = useMemo<DailyContext | null>(() => {
    if (!konum) return null;
    const now = new Date();
    const z = zonedNow(konum.timezone, now);
    return { year: z.year, month: z.month, day: z.day, hijriOffset: settings.hijriOffset, now };
    // Gün içinde saatlik değişimi önemsiz; kartlar gün bazında sabit kalır.
  }, [konum, settings.hijriOffset, live?.today.day]);

  if (!konum || !ctx) {
    return (
      <Screen motif="rubElHizb">
        <EmptyState
          icon="location"
          title={t('location.empty')}
          description={t('location.permissionBody')}
          actionLabel={t('location.add')}
          onAction={() => router.push('/location')}
        />
      </Screen>
    );
  }

  const kart = (id: HomeCardId) => {
    switch (id) {
      case 'nextPrayer':
        return (
          <Card accent motif="starLattice" key={id}>
            <Column gap="lg" align="center">
              <Text variant="callout" tone="onAccent">{t('prayer.next')}</Text>
              {live?.next ? (
                <CountdownRing
                  progress={live.progress}
                  // 40 puntoluk geri sayım varsayılan 168'lik halkaya
                  // sığmıyor, rakamlar çemberin dışına taşıyordu.
                  size={208}
                  accessibilityLabel={t('prayer.remainingTo', {
                    name: label(live.next.key),
                    time: formatCountdown(live.secondsToNext),
                  })}
                >
                  <Column align="center" gap="xxs">
                    <Text variant="title2" tone="onAccent">{label(live.next.key)}</Text>
                    <Text variant="display" tone="onAccent">{formatCountdown(live.secondsToNext)}</Text>
                  </Column>
                </CountdownRing>
              ) : (
                <Text variant="body" tone="onAccent" align="center">{t('prayer.polarNote')}</Text>
              )}
            </Column>
          </Card>
        );
      case 'todayTimes':
        return live ? (
          <Card key={id}>
            <Column gap="sm">
              <Text variant="caption" tone="muted">{t('prayer.todayTimes')}</Text>
              <PrayerList day={live.today} highlight={live.current} />
            </Column>
          </Card>
        ) : <Banner key={id} tone="info" title={t('common.loading')} />;
      case 'friday': return <FridayCard key={id} ctx={ctx} />;
      case 'ramadan': return <RamadanCard key={id} ctx={ctx} />;
      case 'hijriDate': return <HijriDateCard key={id} ctx={ctx} />;
      case 'dailyAyah': return <DailyAyahCard key={id} ctx={ctx} />;
      case 'dailyDua': return <DailyDuaCard key={id} ctx={ctx} />;
      case 'dailyKnowledge': return <DailyKnowledgeCard key={id} ctx={ctx} />;
      case 'dailyName': return <DailyNameCard key={id} ctx={ctx} />;
      case 'religiousDay': return <ReligiousDayCard key={id} ctx={ctx} />;
      case 'moon': return <MoonCard key={id} ctx={ctx} />;
    }
  };

  return (
    <Screen scroll motif="rubElHizb">
      <SectionHeader
        title={konum.label}
        subtitle={konum.country}
        actionLabel={t('common.edit')}
        onAction={() => router.push('/location')}
      />

      <Column gap="md">
        {kartlar.filter((c) => c.visible).map((c) => kart(c.id))}
      </Column>

      <Row gap="sm" style={{ marginTop: theme.spacing.xl }}>
        <Button
          label={t('prayer.calendar')}
          icon="calendar"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/prayer-calendar')}
        />
        <View style={{ flex: 1 }} />
        <Button
          label={t('home.customize')}
          icon="settings"
          variant="ghost"
          size="sm"
          onPress={() => router.push('/home-layout')}
        />
      </Row>
    </Screen>
  );
}
