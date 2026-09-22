/**
 * Geri sayım halkası — bir sonraki vakte kalan süreyi gösterir. Şartname §8, §12.
 * Halka, geçen vakit oranını çizer; ortadaki metin dışarıdan verilir.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export interface CountdownRingProps {
  /** Geçen oran 0..1. */
  progress: number;
  size?: number;
  thickness?: number;
  color?: string;
  /** Halkanın yatağı. Marka kartının üstünde `onAccentBorder` verilir. */
  trackColor?: string;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

export function CountdownRing({
  progress, size = 168, thickness = 10, color, trackColor, children, accessibilityLabel,
}: CountdownRingProps) {
  const theme = useTheme();
  const v = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View
      accessible
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor ?? theme.colors.border} strokeWidth={thickness} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? theme.colors.highlight}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
