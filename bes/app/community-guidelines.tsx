/** Topluluk kuralları (D31) — App Store 1.2 gereği: kurallar, şikâyet ve engelleme herkese açıkça anlatılır. */
import React from 'react';
import { Stack } from 'expo-router';
import { Screen, Card, Column, Text, SectionHeader } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, type StringKey } from '@/lib/i18n';

const MADDELER = [
  'guideline1', 'guideline2', 'guideline3', 'guideline4', 'guideline5', 'guideline6',
] as const;

export default function CommunityGuidelinesScreen() {
  const t = useT();
  const theme = useTheme();
  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.guidelines') }} />
      <Text variant="callout" tone="muted">{t('community.guidelinesIntro')}</Text>

      <Card padding="md" style={{ marginTop: theme.spacing.md }}>
        <Column gap="md">
          {MADDELER.map((k, i) => (
            <Column key={k} gap="xxs">
              <Text variant="bodyStrong">{`${i + 1}. ${t(`community.${k}Title` as StringKey)}`}</Text>
              <Text tone="muted">{t(`community.${k}Body` as StringKey)}</Text>
            </Column>
          ))}
        </Column>
      </Card>

      <SectionHeader title={t('community.hadithTitle')} />
      <Card padding="md">
        <Column gap="xs">
          <Text style={{ fontStyle: 'italic' }}>{t('community.hadithText')}</Text>
          <Text variant="caption" tone="subtle">{t('community.hadithSource')}</Text>
        </Column>
      </Card>
    </Screen>
  );
}
