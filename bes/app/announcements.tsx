/** Duyurular — yönetici panelinden yayınlanır (D31). */
import React from 'react';
import { Stack } from 'expo-router';
import { Screen, Card, Column, Text, EmptyState } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useDateFormat } from '@/lib/i18n/dates';
import { useRemoteOfType } from '@/features/content/pools';

export default function AnnouncementsScreen() {
  const t = useT();
  const theme = useTheme();
  const zaman = useDateFormat({ dateStyle: 'medium' });
  // Panelden yönetilir, herkese gider (D36); topluluğa katılmak gerekmez.
  const duyurular = useRemoteOfType('announcement');


  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.announcements') }} />
      {duyurular.length === 0 ? (
        <EmptyState icon="bell" title={t('community.announcementsEmptyTitle')} description={t('community.announcementsEmptyBody')} />
      ) : (
        <Column gap="md">
          {duyurular.map((d) => (
            <Card key={d.id} padding="md">
              <Column gap="xs">
                <Text variant="bodyStrong">{d.title}</Text>
                <Text tone="muted">{d.body}</Text>
                <Text variant="micro" tone="subtle">{zaman.format(new Date(d.createdAt))}</Text>
              </Column>
            </Card>
          ))}
        </Column>
      )}
      <Column style={{ height: theme.spacing.xl }} />
    </Screen>
  );
}
