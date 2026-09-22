/**
 * Pro kilidi — şartname §8, §44.
 * Kilitli içeriğin ne olduğu **görünür kalır**, ama açılmaz. Kilit hiçbir
 * zaman kandırıcı değildir: fiyat ve dönem, satın alma sayfasında yazılıdır.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';
import { Row } from './Stack';

export interface ProLockProps {
  /** Kilitli mi — false ise çocuk bileşen olduğu gibi gösterilir. */
  locked: boolean;
  children: React.ReactNode;
  onPress: () => void;
  label?: string;
}

export function ProLock({ locked, children, onPress, label = 'Pro ile açılır' }: ProLockProps) {
  const theme = useTheme();
  if (!locked) return <>{children}</>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: false }}
      onPress={onPress}
      style={{ position: 'relative', borderRadius: theme.radius.lg, overflow: 'hidden' }}
    >
      <View pointerEvents="none" style={{ opacity: 0.35 }}>{children}</View>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Row
          gap="xs"
          align="center"
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.highlight,
          }}
        >
          <Icon name="lock" size={16} color={theme.colors.onAccent} />
          <Text variant="micro" tone="onAccent">{label}</Text>
        </Row>
      </View>
    </Pressable>
  );
}
