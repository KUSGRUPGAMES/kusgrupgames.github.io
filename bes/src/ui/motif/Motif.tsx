/**
 * Motif katmanı — şartname §9.
 * Bir yüzeyin arkasına döşenen düşük opaklıklı geometrik desen.
 * `pointerEvents="none"`: dokunmayı asla yakalamaz.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { motifTile, type MotifName } from './patterns';

let uid = 0;

export interface MotifProps {
  name?: MotifName;
  /** Karo kenarı — küçük değer sık desen. */
  tile?: number;
  /** Varsayılan `theme.opacity.motif` (0.06). */
  opacity?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Motif({ name = 'rubElHizb', tile = 48, opacity, color, style }: MotifProps) {
  const theme = useTheme();
  const id = useMemo(() => `motif${(uid += 1)}`, []);
  const t = useMemo(() => motifTile(name, tile), [name, tile]);
  if (t.paths.length === 0) return null;
  const stroke = color ?? theme.colors.motif;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: opacity ?? theme.opacity.motif }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={t.size} height={t.size}>
            {t.paths.map((d, i) => (
              <Path
                key={i}
                d={d}
                fill={t.fill ? stroke : 'none'}
                stroke={stroke}
                strokeWidth={t.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
