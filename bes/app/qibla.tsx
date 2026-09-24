/** Kıble ekranı — şartname §36, §79, §81. */
import React, { useEffect, useMemo, useRef } from 'react';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen, Card, Column, Row, Text, Banner, EmptyState, SectionHeader,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useLocationStore } from '@/store/locations';
import { useThemeContext } from '@/theme/ThemeProvider';
import { qiblaBearing, distanceToKaaba, headingDelta, isAligned } from '@/features/qibla/calc';
import { useCompass } from '@/features/qibla/useCompass';
import { QiblaDial } from '@/features/qibla/QiblaDial';

export default function QiblaScreen() {
  const t = useT();
  const theme = useTheme();
  const { reduceMotion } = useThemeContext();
  const konum = useLocationStore((s) => s.active());
  // Pusula yalnız bu ekran varken açılır (§81).
  const compass = useCompass(konum !== null);
  const oncekiHizali = useRef(false);

  const kible = useMemo(
    () => (konum ? qiblaBearing(konum.latitude, konum.longitude) : 0),
    [konum],
  );
  const mesafe = useMemo(
    () => (konum ? distanceToKaaba(konum.latitude, konum.longitude) : 0),
    [konum],
  );

  const hizali = compass.heading !== null && isAligned(kible, compass.heading);

  // Hizalanma anında bir kez titreşim (§36). Sürekli titretmez.
  useEffect(() => {
    if (hizali && !oncekiHizali.current && !reduceMotion) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    oncekiHizali.current = hizali;
  }, [hizali, reduceMotion]);

  if (!konum) {
    return (
      <Screen topInset={false}>
        <Stack.Screen options={{ headerShown: true, title: t('qibla.title') }} />
        <EmptyState
          icon="compass"
          title={t('qibla.needLocation')}
          description={t('location.permissionBody')}
          actionLabel={t('location.add')}
          onAction={() => router.push('/location')}
        />
      </Screen>
    );
  }

  const fark = compass.heading === null ? 0 : headingDelta(kible, compass.heading);
  const dogrulukMetni = compass.accuracy === 'high' ? t('qibla.accuracyHigh')
    : compass.accuracy === 'medium' ? t('qibla.accuracyMedium')
      : t('qibla.accuracyLow');

  return (
    <Screen topInset={false} scroll motif="octagonGrid">
      <Stack.Screen options={{ headerShown: true, title: t('qibla.title') }} />

      <SectionHeader title={konum.label} subtitle={konum.country} />

      <Card padding="xxl">
        <Column gap="lg" align="center">
          <QiblaDial
            qibla={kible}
            heading={compass.heading}
            aligned={hizali}
            labels={{
              n: t('qibla.north'), e: t('qibla.east'),
              s: t('qibla.south'), w: t('qibla.west'),
            }}
          />

          <Text
            variant="title2"
            tone={hizali ? 'success' : 'default'}
            accessibilityLiveRegion="polite"
          >
            {hizali
              ? t('qibla.aligned')
              : compass.heading === null
                // Pusula yoksa başlık alttaki "Kıble yönü" etiketini
                // tekrarlıyordu; kullanıcıya hiçbir şey söylemiyordu.
                ? t('qibla.noHeading')
                : fark > 0 ? t('qibla.turnRight') : t('qibla.turnLeft')}
          </Text>

          <Row gap="xxl">
            <Column align="center" gap="xxs">
              <Text variant="caption" tone="muted">{t('qibla.bearing')}</Text>
              <Text variant="title3" tone="highlight">
                {t('qibla.degrees', { deg: Math.round(kible) })}
              </Text>
            </Column>
            <Column align="center" gap="xxs">
              <Text variant="caption" tone="muted">{t('qibla.distance')}</Text>
              <Text variant="title3">
                {t('qibla.distanceKm', { km: Math.round(mesafe).toLocaleString('tr-TR') })}
              </Text>
            </Column>
          </Row>
        </Column>
      </Card>

      <Column gap="md" style={{ marginTop: theme.spacing.lg }}>
        {!compass.available ? (
          <Banner tone="warning" title={t('qibla.title')} description={t('qibla.noCompass')} />
        ) : null}
        {compass.interference ? (
          <Banner tone="warning" title={t('qibla.accuracyLow')} description={t('qibla.interference')} />
        ) : null}
        {compass.available && compass.accuracy !== 'high' ? (
          <Banner tone="info" title={dogrulukMetni} description={t('qibla.calibrate')} />
        ) : null}
        <Text variant="micro" tone="subtle">{t('qibla.batteryNote')}</Text>
      </Column>
    </Screen>
  );
}
