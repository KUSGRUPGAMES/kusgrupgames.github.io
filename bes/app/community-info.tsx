/** Topluluk bilgilendirmeleri — yönetici panelinden yayınlanan yazılar (D31). */
import React from 'react';
import { Stack, router } from 'expo-router';
import { Screen, Card, Column, Text, EmptyState, Skeleton } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useI18n } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useContentItems } from '@/features/community/content';

export default function CommunityInfoScreen() {
  const t = useT();
  const theme = useTheme();
  const { language } = useI18n();
  const settings = useSettingsStore((s) => s.settings);
  const yazilar = useContentItems('info_article', language, settings.community.enabled);

  if (!settings.community.enabled) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: t('community.infoArticles') }} />
        <EmptyState icon="info" title={t('community.joinFirstTitle')} description={t('community.joinFirstBody')}
          actionLabel={t('community.title')} onAction={() => router.push('/community')} />
      </Screen>
    );
  }

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.infoArticles') }} />
      {yazilar.isLoading ? (
        <Column gap="sm"><Skeleton height={90} /><Skeleton height={90} /></Column>
      ) : (yazilar.data ?? []).length === 0 ? (
        <EmptyState icon="info" title={t('community.infoEmptyTitle')} description={t('community.infoEmptyBody')} />
      ) : (
        <Column gap="md">
          {(yazilar.data ?? []).map((y) => (
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
