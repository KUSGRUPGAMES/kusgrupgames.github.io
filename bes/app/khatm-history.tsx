/** Kayıtlarım — tamamladığım cüzler ve bitmiş hatim grupları (D31). */
import React from 'react';
import { Stack, router } from 'expo-router';
import { Screen, Card, ListItem, Badge, Text, EmptyState, Skeleton } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useDateFormat } from '@/lib/i18n/dates';
import { useSettingsStore } from '@/store/settings';
import { useCommunitySession } from '@/features/community/session';
import { useMyKhatmHistory } from '@/features/community/khatmCircles';

export default function KhatmHistoryScreen() {
  const t = useT();
  const theme = useTheme();
  const zaman = useDateFormat({ dateStyle: 'medium' });
  const settings = useSettingsStore((s) => s.settings);
  const { userId } = useCommunitySession();
  const gecmis = useMyKhatmHistory(userId);

  if (!settings.community.enabled || !userId) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: t('community.myRecords') }} />
        <EmptyState icon="users" title={t('community.joinFirstTitle')} description={t('community.joinFirstBody')}
          actionLabel={t('community.title')} onAction={() => router.push('/community')} />
      </Screen>
    );
  }

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.myRecords') }} />
      <Text variant="callout" tone="muted">{t('community.myRecordsIntro', { n: gecmis.data?.length ?? 0 })}</Text>

      {gecmis.isLoading ? (
        <Card padding="sm" style={{ marginTop: theme.spacing.md }}><Skeleton height={56} /></Card>
      ) : (gecmis.data ?? []).length === 0 ? (
        <EmptyState icon="book" title={t('community.historyEmptyTitle')} description={t('community.historyEmptyBody')} />
      ) : (
        <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
          {(gecmis.data ?? []).map((h, i) => (
            <ListItem
              key={`${h.circleTitle}-${h.juzNo}-${i}`}
              title={t('quran.juzNo', { n: h.juzNo })}
              subtitle={`${h.circleTitle} · ${zaman.format(new Date(h.completedAt))}`}
              icon="check"
              chevron={false}
              right={h.circleCompletedAt ? <Badge label={t('community.circleCompleted')} tone="success" /> : undefined}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
