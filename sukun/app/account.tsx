/**
 * Hesap ve veri — şartname §57, §59, §69.
 *
 * Bu ekran bir "giriş yap" ekranı değildir çünkü hesap **yoktur**. Kullanıcının
 * bilmek istediği asıl soruyu yanıtlar: verilerim nerede, ne oluyor, nasıl
 * silinir (DECISIONS D12).
 */
import React from 'react';
import { router, Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Banner, ListItem, Divider,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useLocationStore } from '@/store/locations';
import { useWorshipStore } from '@/store/worship';
import { useReadingStore } from '@/store/reading';
import { useFavoriteStore } from '@/store/favorites';
import { Brand } from '@/config/brand';

export default function AccountScreen() {
  const t = useT();
  const theme = useTheme();
  const konumlar = useLocationStore((s) => s.locations);
  const oturumlar = useWorshipStore((s) => s.sessions);
  const gunler = useWorshipStore((s) => s.days);
  const yerImleri = useReadingStore((s) => s.bookmarks);
  const favoriler = useFavoriteStore((s) => s.items);

  const satir = (baslik: string, adet: number) => (
    <Row justify="space-between" style={{ paddingVertical: theme.spacing.xs }}>
      <Text tone="muted">{baslik}</Text>
      <Text variant="bodyStrong">{String(adet)}</Text>
    </Row>
  );

  return (
    <Screen scroll motif="rubElHizb">
      <Stack.Screen options={{ headerShown: true, title: t('account.title') }} />

      <Card accent motif="starLattice">
        <Column gap="sm">
          <Text variant="title3" tone="onAccent">{t('account.guestOnly')}</Text>
          <Text variant="body" tone="onAccent">{t('account.guestBody')}</Text>
        </Column>
      </Card>

      <SectionHeader title={t('account.dataLocation')} />
      <Card>
        <Column gap="xxs">
          {satir(t('location.saved'), konumlar.length)}
          <Divider />
          {satir(t('quran.bookmarks'), yerImleri.length)}
          <Divider />
          {satir(t('quran.favorites'), favoriler.length)}
          <Divider />
          {satir(t('dhikr.stats'), oturumlar.length)}
          <Divider />
          {satir(t('log.title'), Object.keys(gunler).length)}
        </Column>
      </Card>

      <Banner tone="info" title={t('settings.privacy')} description={t('account.exportHint')} />
      <Banner tone="warning" title={t('sync.title')} description={t('account.noSync')} />

      <SectionHeader title={t('settings.about')} />
      <Card padding="sm">
        <ListItem title={t('settings.version')} value={Brand.version} chevron={false} />
        <ListItem title={t('diagnostics.title')} icon="info" onPress={() => router.push('/diagnostics')} />
        <ListItem title={t('settings.privacy')} icon="lock" chevron />
      </Card>
    </Screen>
  );
}
