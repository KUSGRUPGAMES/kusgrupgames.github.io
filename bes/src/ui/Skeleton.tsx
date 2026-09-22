/**
 * Yükleniyor iskeleti — şartname §92: yükleme durumunda boş ekran gösterilmez.
 * Reduced-motion açıkken parıltı animasyonu durur (§79).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useTheme, useThemeContext } from '@/theme/ThemeProvider';
import type { Radius } from '@/theme/tokens';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: Radius;
}

export function Skeleton({ width = '100%', height = 16, radius = 'sm' }: SkeletonProps) {
  const theme = useTheme();
  const { reduceMotion } = useThemeContext();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduceMotion) { pulse.setValue(0.6); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <Animated.View
      accessibilityRole="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: theme.radius[radius], backgroundColor: theme.colors.border, opacity: pulse }}
    >
      <View />
    </Animated.View>
  );
}
