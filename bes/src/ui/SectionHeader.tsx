/** Bölüm başlığı — sağda isteğe bağlı eylem. Şartname §8. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Row, Column } from './Stack';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <Row align="center" gap="md" style={{ marginTop: theme.spacing.xxl, marginBottom: theme.spacing.md }}>
      <View style={{ width: 3, height: 24, borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.highlight }} />
      <Column flex={1} gap="xxs">
        <Text variant="title2" accessibilityRole="header">{title}</Text>
        {subtitle ? <Text variant="caption" tone="muted">{subtitle}</Text> : null}
      </Column>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction} hitSlop={10}>
          <Text variant="callout" tone="accent">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Row>
  );
}
