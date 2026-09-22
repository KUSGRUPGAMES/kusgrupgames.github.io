/** Boş durum — şartname §8, §92: hiçbir ekran boş bırakılmaz. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'sparkle', title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.huge }}>
      <Icon name={icon} size={36} color={theme.colors.textSubtle} />
      <Text variant="title3" align="center">{title}</Text>
      <Text variant="body" tone="muted" align="center">{description}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
    </View>
  );
}
