/** Rozet — PRO işareti, sayaç, durum. Şartname §8. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export type BadgeTone = 'accent' | 'highlight' | 'neutral' | 'danger' | 'success';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const theme = useTheme();
  const bg: Record<BadgeTone, string> = {
    accent: theme.colors.accentSurface,
    highlight: theme.colors.highlight,
    neutral: theme.colors.surfaceRaised,
    danger: theme.colors.danger,
    success: theme.colors.success,
  };
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
        borderRadius: theme.radius.pill,
        backgroundColor: bg[tone],
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="micro" tone={tone === 'neutral' ? 'muted' : 'onAccent'}>{label}</Text>
    </View>
  );
}
