/** Yalnız ikonlu düğme — erişilebilirlik etiketi **zorunludur**. Şartname §8, §79. */
import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';

export interface IconButtonProps {
  name: IconName;
  /** Ekran okuyucunun söyleyeceği metin — boş bırakılamaz. */
  label: string;
  onPress: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  /** Yuvarlak dolgulu arka plan. */
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ name, label, onPress, size = 22, color, disabled = false, filled = false, style }: IconButtonProps) {
  const theme = useTheme();
  const box = Math.max(44, size + theme.spacing.xl);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: box, height: box, alignItems: 'center', justifyContent: 'center',
          borderRadius: theme.radius.pill,
          backgroundColor: filled ? theme.colors.surfaceRaised : 'transparent',
          opacity: disabled ? theme.opacity.disabled : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon name={name} size={size} color={color ?? theme.colors.text} />
    </Pressable>
  );
}
