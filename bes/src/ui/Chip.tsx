/** Seçilebilir etiket — filtre, tema seçimi. Şartname §8. */
import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected = false, onPress, disabled = false }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: selected ? theme.colors.accentSurface : theme.colors.controlBorder,
        backgroundColor: selected ? theme.colors.accentSurface : 'transparent',
        opacity: disabled ? theme.opacity.disabled : pressed ? 0.75 : 1,
      })}
    >
      <Text variant="callout" tone={selected ? 'onAccent' : 'muted'}>{label}</Text>
    </Pressable>
  );
}
