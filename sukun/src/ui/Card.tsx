/** Kart yüzeyi — şartname §8. */
import React from 'react';
import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Motif } from './motif/Motif';
import type { MotifName } from './motif/patterns';
import type { Spacing, Radius } from '@/theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  padding?: Spacing;
  radius?: Radius;
  /** Vurgulu kart — marka renginde dolgu (bir sonraki vakit kartı gibi). */
  accent?: boolean;
  motif?: MotifName;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children, padding = 'lg', radius = 'lg', accent = false, motif, onPress, accessibilityLabel, style,
}: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: accent ? theme.colors.accentSurface : theme.colors.surface,
    borderRadius: theme.radius[radius],
    padding: theme.spacing[padding],
    borderWidth: accent ? 0 : 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  };
  const inner = (
    <>
      {motif ? <Motif name={motif} color={accent ? theme.colors.onAccent : undefined} /> : null}
      {children}
    </>
  );
  if (!onPress) return <View style={[base, style]}>{inner}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed ? { opacity: 0.85 } : null, style]}
    >
      {inner}
    </Pressable>
  );
}
