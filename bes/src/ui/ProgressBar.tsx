/** İlerleme çubuğu — vakit ilerlemesi, ders ilerlemesi. Şartname §8. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export interface ProgressBarProps {
  /** 0..1 arası. Sınırların dışındaki değerler kırpılır. */
  value: number;
  height?: number;
  color?: string;
  accessibilityLabel?: string;
}

export function ProgressBar({ value, height = 6, color, accessibilityLabel }: ProgressBarProps) {
  const theme = useTheme();
  const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{ height, borderRadius: theme.radius.pill, backgroundColor: theme.colors.border, overflow: 'hidden' }}
    >
      <View style={{ width: `${v * 100}%`, height: '100%', backgroundColor: color ?? theme.colors.accent }} />
    </View>
  );
}
