/** Keşfet — şartname §22–§26, §45, §53. */
import React from 'react';
import { router } from 'expo-router';
import { Screen, SectionHeader, Card, ListItem, PageHeader, FeatureTile, Row } from '@/ui';
import { useT } from '@/lib/i18n';

export default function ExploreScreen() {
  const t = useT();
  return (
    <Screen scroll motif="arch">
      <PageHeader title={t('explore.title')} icon="sparkle" />
      <FeatureTile title={t('search.title')} icon="search" featured onPress={() => router.push('/search')} />

      <SectionHeader title={t('common.today')} />
      <Row gap="sm" wrap>
        <FeatureTile title={t('explore.dailyDua')} icon="heart" onPress={() => router.push('/duas')} />
        <FeatureTile title={t('explore.dailyInfo')} icon="info" onPress={() => router.push('/knowledge')} />
        <FeatureTile title={t('worship.names')} icon="star" onPress={() => router.push('/names')} />
        <FeatureTile title={t('explore.hijri')} icon="calendar" onPress={() => router.push('/hijri')} />
      </Row>

      <SectionHeader title={t('common.more')} />
      <Card padding="md">
        <ListItem title={t('explore.religiousDays')} icon="moon" onPress={() => router.push('/hijri')} />
        <ListItem title={t('ramadan.title')} icon="crescentStar" onPress={() => router.push('/ramadan')} />
        <ListItem title={t('khatm.title')} icon="book" onPress={() => router.push('/khatm')} />
        <ListItem title={t('worship.zakat')} icon="coins" onPress={() => router.push('/zakat')} />
        <ListItem title={t('hajj.title')} icon="kaaba" onPress={() => router.push('/hajj')} />
      </Card>

      {/* "Günün Hadisi" bölümü, kaynak lisansı (KNOWN_ISSUES B3) çözülene
          kadar hiç çizilmez. Kullanıcıya boş bir bölüm ve özür metni
          göstermek yerine bölüm yok sayılır. */}
    </Screen>
  );
}
