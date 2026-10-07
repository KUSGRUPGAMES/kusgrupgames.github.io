/** Topluluk bilgilendirmeleri — yönetici panelinden yayınlanan yazılar (D31). */
import React from 'react';
import { Stack } from 'expo-router';
import { Screen, Card, Column, Text, EmptyState } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useRemoteOfType } from '@/features/content/pools';

export default function CommunityInfoScreen() {
  const t = useT();
  const theme = useTheme();
  // Panelden yönetilir, herkese gider (D36); topluluğa katılmak gerekmez.
  const yazilar = useRemoteOfType('info_article');


  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.infoArticles') }} />
      {yazilar.length === 0 ? (
        <EmptyState icon="info" title={t('community.infoEmptyTitle')} description={t('community.infoEmptyBody')} />
      ) : (
        <Column gap="md">
          {yazilar.map((y) => (
            <Card key={y.id} padding="md">
              <Column gap="xs">
                <Text variant="bodyStrong">{y.title}</Text>
                <Text tone="muted">{y.body}</Text>
              </Column>
            </Card>
          ))}
        </Column>
      )}
      <Column style={{ height: theme.spacing.xl }} />
    </Screen>
  );
}
