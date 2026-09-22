/** İbadet — şartname §37–§49. */
import React from 'react';
import { router } from 'expo-router';
import { Screen, SectionHeader, ListItem, Card } from '@/ui';
import { useT } from '@/lib/i18n';

export default function WorshipScreen() {
  const t = useT();
  return (
    <Screen scroll motif="octagonGrid">
      <SectionHeader title={t('worship.title')} />
      <Card padding="sm">
        <ListItem title={t('qibla.title')} icon="compass" onPress={() => router.push('/qibla')} />
        <ListItem title={t('worship.dhikr')} icon="beads" onPress={() => router.push('/dhikr')} />
        <ListItem title={t('worship.duas')} icon="heart" onPress={() => router.push('/duas')} />
        <ListItem title={t('worship.names')} icon="star" onPress={() => router.push('/names')} />
      </Card>

      <SectionHeader title={t('worship.log')} />
      <Card padding="sm">
        <ListItem title={t('worship.qada')} icon="check" onPress={() => router.push('/qada')} />
        <ListItem title={t('log.title')} icon="calendar" onPress={() => router.push('/worship-log')} />
        <ListItem title={t('worship.guide')} icon="book" onPress={() => router.push('/prayer-guide')} />
      </Card>

      <SectionHeader title={t('prayer.settings')} />
      <Card padding="sm">
        <ListItem title={t('prayer.settings')} icon="clock" onPress={() => router.push('/prayer-settings')} />
        <ListItem title={t('prayer.calendar')} icon="calendar" onPress={() => router.push('/prayer-calendar')} />
      </Card>
    </Screen>
  );
}
