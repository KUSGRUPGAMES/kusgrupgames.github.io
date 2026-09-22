/**
 * Gradyan katmanı — şartname §8, DECISIONS D18.
 *
 * Logonun zemini düz bir yeşil değil: yukarıdan aşağı koyulaşan bir gradyan.
 * Uygulama tek düz renk kullandığı sürece logonun yanında yavan duruyordu.
 * Bu bileşen yüzeyin arkasına o inişi koyar.
 *
 * `pointerEvents="none"`: dokunmayı asla yakalamaz. `react-native-svg`
 * kullanılır — `expo-linear-gradient` yalnız bunun için eklenmeye değmez ve
 * Motif katmanı zaten aynı motoru çiziyor.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

let uid = 0;

export interface GradientProps {
  /** Üst ve alt durak. */
  colors: readonly [string, string];
  style?: StyleProp<ViewStyle>;
}

export function Gradient({ colors, style }: GradientProps) {
  const id = useMemo(() => `grad${(uid += 1)}`, []);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
