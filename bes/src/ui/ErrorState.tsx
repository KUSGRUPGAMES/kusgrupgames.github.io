/**
 * Hata durumu — şartname §92.
 * Kullanıcıya teknik yığın izi gösterilmez; ne olduğu ve ne yapabileceği yazılır.
 */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Bir şey ters gitti', description, retryLabel = 'Yeniden dene', onRetry }: ErrorStateProps) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${title}. ${description}`}
      accessibilityRole="alert"
      style={{ alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xxxl }}
    >
      <Icon name="alert" size={32} color={theme.colors.danger} />
      <Text variant="title3" align="center">{title}</Text>
      <Text variant="body" tone="muted" align="center">{description}</Text>
      {onRetry ? <Button label={retryLabel} icon="refresh" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}
