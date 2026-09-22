/** Bilgi/uyarı şeridi — izin uyarısı, çevrimdışı bildirimi. Şartname §8, §92. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { Row, Column } from './Stack';
import { Button } from './Button';

export type BannerTone = 'info' | 'warning' | 'danger' | 'success';

export interface BannerProps {
  tone?: BannerTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Banner({ tone = 'info', title, description, actionLabel, onAction }: BannerProps) {
  const theme = useTheme();
  const color = tone === 'warning' ? theme.colors.warning
    : tone === 'danger' ? theme.colors.danger
    : tone === 'success' ? theme.colors.success
    : theme.colors.accent;
  const icon: IconName = tone === 'success' ? 'check' : tone === 'info' ? 'info' : 'alert';
  return (
    <View
      accessible
      accessibilityRole={tone === 'danger' ? 'alert' : 'summary'}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={{
        flexDirection: 'row',
        gap: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.md,
        borderLeftWidth: 3,
        borderLeftColor: color,
        backgroundColor: theme.colors.surfaceRaised,
      }}
    >
      <Icon name={icon} size={20} color={color} />
      <Column flex={1} gap="xs">
        <Text variant="bodyStrong">{title}</Text>
        {description ? <Text variant="caption" tone="muted">{description}</Text> : null}
        {actionLabel && onAction ? (
          <Row>
            <Button label={actionLabel} onPress={onAction} variant="ghost" size="sm" />
          </Row>
        ) : null}
      </Column>
    </View>
  );
}
