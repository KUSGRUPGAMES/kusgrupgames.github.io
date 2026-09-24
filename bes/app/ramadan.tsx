/** Ramazan modu — şartname §47. */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Banner, Divider, EmptyState, CountdownRing,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useDateFormat } from '@/lib/i18n';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { ramadanState, ramadanDays } from '@/features/ramadan/calc';
import { toHijri } from '@/features/hijri/calc';
import { daySchedule } from '@/features/prayer/schedule';
import { formatHM, formatCountdown } from '@/features/prayer/calc';
import { useLiveView } from '@/features/prayer/useSchedule';
import type { MethodId, PrayerKey } from '@/features/prayer/methods';

export default function RamadanScreen() {
  const t = useT();
  const theme = useTheme();
  const konum = useLocationStore((s) => s.active());
  const settings = useSettingsStore((s) => s.settings);

  const input = useMemo(() => {
    if (!konum) return null;
    return {
      latitude: konum.latitude,
      longitude: konum.longitude,
      timezone: konum.timezone,
      options: {
        method: settings.method as MethodId,
        asrShadow: settings.asrShadow,
        adjustments: settings.adjustments as Partial<Record<PrayerKey, number>>,
      },
    };
  }, [konum, settings]);

  const uzunTarih = useDateFormat({ dateStyle: 'long' });
  const gunAy = useDateFormat({ day: '2-digit', month: 'short' });

  const live = useLiveView(input);
  const durum = useMemo(() => ramadanState(new Date(), settings.hijriOffset), [settings.hijriOffset]);

  const takvim = useMemo(() => {
    if (!input) return [];
    const h = toHijri(new Date());
    const yil = durum.active ? h.year : (durum.startsOn ? toHijri(durum.startsOn).year : h.year);
    return ramadanDays(yil).map((g) => ({
      date: g,
      schedule: daySchedule(input, g.getFullYear(), g.getMonth(), g.getDate()),
    }));
  }, [input, durum]);

  if (!konum || !input) {
    return (
      <Screen topInset={false}>
        <Stack.Screen options={{ headerShown: true, title: t('ramadan.title') }} />
        <EmptyState icon="location" title={t('location.empty')} description={t('location.searchHint')} />
      </Screen>
    );
  }

  // İftar = akşam, imsak = fecir. Geri sayım canlı görünümden gelir.
  const iftar = live?.today.entries.find((e) => e.key === 'maghrib');
  const imsak = live?.tomorrow.entries.find((e) => e.key === 'fajr');
  const simdi = Date.now();
  const iftaraKalan = iftar?.at ? Math.max(0, Math.round((iftar.at.getTime() - simdi) / 1000)) : 0;
  const imsagaKalan = imsak?.at ? Math.max(0, Math.round((imsak.at.getTime() - simdi) / 1000)) : 0;
  const iftarGecti = iftaraKalan === 0;

  return (
    <Screen topInset={false} scroll motif="arch">
      <Stack.Screen options={{ headerShown: true, title: t('ramadan.title') }} />

      <Card accent>
        <Column gap="lg" align="center">
          <Text variant="callout" tone="onAccent">
            {durum.active
              ? t('ramadan.day', { day: durum.day })
              : t('ramadan.untilStart', { days: durum.daysUntil })}
          </Text>
          {/* İftar/imsak geri sayımı yalnız Ramazan'dayken anlamlıdır.
              Eskiden her zaman çiziliyordu ve "Ramazana 142 gün kaldı"
              yazısının altında "İftara kalan" sayıyordu — kimse oruçlu
              değilken iftar saymak yanlış. */}
          {durum.active && live ? (
            <CountdownRing
              progress={live.progress}
              size={190}
              // Marka kartının üstündeki halka logonun eşleşmesini taşır:
              // altın ilerleme, fildişi-saydam yatak (D18).
              color={theme.colors.onAccentHighlight}
              trackColor={theme.colors.onAccentTrack}
            >
              <Column align="center" gap="xxs">
                <Text variant="caption" tone="onAccent">
                  {iftarGecti ? t('ramadan.imsak') : t('ramadan.iftar')}
                </Text>
                <Text variant="title1" tone="onAccent">
                  {formatCountdown(iftarGecti ? imsagaKalan : iftaraKalan)}
                </Text>
              </Column>
            </CountdownRing>
          ) : durum.startsOn ? (
            <Column align="center" gap="xxs">
              <Text variant="caption" tone="onAccent">{t('ramadan.startsOn')}</Text>
              <Text variant="title1" tone="onAccent">
                {uzunTarih.format(durum.startsOn)}
              </Text>
            </Column>
          ) : null}
        </Column>
      </Card>

      <Banner tone="info" title={t('ramadan.title')} description={t('ramadan.approxNote')} />

      <SectionHeader title={t('ramadan.calendar')} subtitle={konum.label} />
      <Card padding="sm">
        <Row style={{ paddingVertical: theme.spacing.xs }}>
          {/* Sütun başlığı "Bugün" yazıyordu; sütun otuz günü listeliyor. */}
          <Text variant="micro" tone="subtle" style={{ width: 90 }}>{t('ramadan.dayColumn')}</Text>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="micro" tone="subtle">{t('prayer.fajr')}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="micro" tone="subtle">{t('prayer.maghrib')}</Text>
          </View>
        </Row>
        <Divider />
        {takvim.map((g, i) => (
          <Row key={i} align="center" style={{ paddingVertical: theme.spacing.xs }}>
            <Text variant="caption" tone="muted" style={{ width: 90 }}>
              {`${i + 1}. ${gunAy.format(g.date)}`}
            </Text>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="caption">{formatHM(g.schedule.times.fajr)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text variant="caption">{formatHM(g.schedule.times.maghrib)}</Text>
            </View>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
