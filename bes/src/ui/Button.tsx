/**
 * Düğme — şartname §8, §79.
 * Dokunma alanı en az 44×44 pt; erişilebilirlik rolü ve durumu her zaman verilir.
 */
import React from 'react';
import { Pressable, ActivityIndicator, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { Row } from './Stack';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Satırın tamamını kaplasın. */
  block?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label, onPress, variant = 'primary', size = 'md', icon,
  disabled = false, loading = false, block = false, accessibilityHint, style,
}: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const padX = size === 'sm' ? theme.spacing.md : theme.spacing.xl;

  const fills: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: theme.colors.accentSurface, borderWidth: 1,
      borderColor: theme.colors.onAccentTrack },
    secondary: { backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.controlBorder },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: theme.colors.danger },
  };
  const tone = variant === 'primary' || variant === 'danger' ? 'onAccent'
    : variant === 'ghost' ? 'accent' : 'default';
  const fg = variant === 'primary' || variant === 'danger' ? theme.colors.onAccent
    : variant === 'ghost' ? theme.colors.accent : theme.colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      hitSlop={height < 44 ? 6 : 0}
      style={({ pressed }) => [
        {
          minHeight: height,
          paddingHorizontal: padX,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: inactive ? theme.opacity.disabled : pressed ? 0.85 : 1,
        },
        fills[variant],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Row gap="sm" align="center">
          {icon ? <Icon name={icon} size={size === 'sm' ? 18 : 20} color={fg} /> : null}
          <Text variant={size === 'sm' ? 'callout' : 'bodyStrong'} tone={tone}>{label}</Text>
        </Row>
      )}
    </Pressable>
  );
}
