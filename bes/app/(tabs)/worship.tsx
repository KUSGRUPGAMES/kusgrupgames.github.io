/**
 * İbadet — şartname §37–§49.
 *
 * Eski Keşfet sekmesindeki araçlar buraya taşındı (DECISIONS D25). Üç bölüm,
 * her araç tek dokunuşla: günlük kullanılanlar, takip, hesap ve rehberler.
 */
import React from 'react';
import { View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Screen, SectionHeader, PageHeader, FeatureTile, Row, type IconName } from '@/ui';
import { useT, type StringKey } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';

type Oge = { href: Href; icon: IconName; label: StringKey };

const GUNLUK: Oge[] = [
  { href: '/dhikr', icon: 'beads', label: 'worship.dhikr' },
  { href: '/qibla', icon: 'compass', label: 'qibla.title' },
  { href: '/duas', icon: 'heart', label: 'worship.duas' },
  { href: '/names', icon: 'star', label: 'worship.names' },
  { href: '/share-card', icon: 'share', label: 'share.templates' },
];
const TAKIP: Oge[] = [
  { href: '/worship-log', icon: 'calendar', label: 'log.title' },
  { href: '/worship-stats', icon: 'chart', label: 'log.stats' },
  { href: '/qada', icon: 'check', label: 'worship.qada' },
  { href: '/khatm', icon: 'book', label: 'worship.khatm' },
];
const REHBER: Oge[] = [
  { href: '/zakat', icon: 'coins', label: 'worship.zakat' },
  { href: '/ramadan', icon: 'crescentStar', label: 'ramadan.title' },
  { href: '/hajj', icon: 'kaaba', label: 'hajj.title' },
  { href: '/hijri', icon: 'moon', label: 'explore.hijri' },
  { href: '/prayer-guide', icon: 'mosque', label: 'worship.guide' },
  { href: '/knowledge', icon: 'info', label: 'explore.articles' },
];

export default function WorshipScreen() {
  const t = useT();
  const theme = useTheme();
  const izgara = (liste: Oge[], vurgulu = false) => (
    <Row gap="sm" wrap>
      {liste.map((o, i) => (
        <FeatureTile
          key={o.label}
          title={t(o.label)}
          icon={o.icon}
          featured={vurgulu && i < 2}
          onPress={() => router.push(o.href)}
        />
      ))}
    </Row>
  );
  return (
    <Screen scroll motif="octagonGrid">
      <PageHeader title={t('worship.title')} icon="mosque" />
      <SectionHeader title={t('worship.sectionDaily')} />
      {izgara(GUNLUK, true)}
      <SectionHeader title={t('worship.sectionTrack')} />
      {izgara(TAKIP)}
      <SectionHeader title={t('worship.sectionGuides')} />
      {izgara(REHBER)}
      <View style={{ height: theme.spacing.xxl }} />
    </Screen>
  );
}
