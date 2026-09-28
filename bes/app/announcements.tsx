/** Duyurular — yönetici panelinden yayınlanır (D31). */
import React from 'react';
import { Stack, router } from 'expo-router';
import { Screen, Card, Column, Text, EmptyState, Skeleton } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useI18n } from '@/lib/i18n';
import { useDateFormat } from '@/lib/i18n/dates';
import { useSettingsStore } from '@/store/settings';
import { useContentItems } from '@/features/community/content';

export default function AnnouncementsScreen() {
  const t = useT();
  const theme = useTheme();
  const { language } = useI18n();
  const zaman = useDateFormat({ dateStyle: 'medium' });
  const settings = useSettingsStore((s) => s.settings);
  const duyurular = useContentItems('announcement', language, settings.community.enabled);

  if (!settings.community.enabled) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: t('community.announcements') }} />
        <EmptyState icon="bell" title={t('community.joinFirstTitle')} description={t('community.joinFirstBody')}
          actionLabel={t('community.title')} onAction={() => router.push('/community')} />
      </Screen>
    );
  }

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.announcements') }} />
      {duyurular.isLoading ? (
        <Column gap="sm"><Skeleton height={90} /><Skeleton height={90} /></Column>
      ) : (duyurular.data ?? []).length === 0 ? (
        <EmptyState icon="bell" title={t('community.announcementsEmptyTitle')} description={t('community.announcementsEmptyBody')} />
      ) : (
        <Column gap="md">
          {(duyurular.data ?? []).map((d) => (
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
