/** İbadet — şartname §37–§49. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, SectionHeader, ListItem, Card, PageHeader, FeatureTile, Row } from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';

export default function WorshipScreen() {
  const t = useT();
  const theme = useTheme();
  return (
    <Screen scroll motif="octagonGrid">
      <PageHeader title={t('worship.title')} icon="mosque" />
      <Row gap="sm" wrap>
        <FeatureTile title={t('qibla.title')} icon="compass" featured onPress={() => router.push('/qibla')} />
        <FeatureTile title={t('worship.dhikr')} icon="beads" featured onPress={() => router.push('/dhikr')} />
        <FeatureTile title={t('worship.duas')} icon="heart" onPress={() => router.push('/duas')} />
        <FeatureTile title={t('worship.names')} icon="star" onPress={() => router.push('/names')} />
      </Row>

      <SectionHeader title={t('worship.log')} />
      <Card padding="md">
        <ListItem title={t('worship.qada')} icon="check" onPress={() => router.push('/qada')} />
        <ListItem title={t('log.title')} icon="calendar" onPress={() => router.push('/worship-log')} />
        <ListItem title={t('worship.guide')} icon="book" onPress={() => router.push('/prayer-guide')} />
      </Card>

      <SectionHeader title={t('prayer.settings')} />
      <Card padding="md">
        <ListItem title={t('prayer.settings')} icon="clock" onPress={() => router.push('/prayer-settings')} />
        <ListItem title={t('prayer.calendar')} icon="calendar" onPress={() => router.push('/prayer-calendar')} />
      </Card>
      <View style={{ height: theme.spacing.xxl }} />
    </Screen>
  );
}
