/** Düzen yardımcıları — şartname §8. Boşluk daima token'dan gelir. */
import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Spacing } from '@/theme/tokens';

export interface StackProps extends ViewProps {
  gap?: Spacing;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  flex?: number;
  padding?: Spacing;
}

function make(direction: 'row' | 'column') {
  return function Stack({ gap = 'none', align, justify, wrap, flex, padding, style, ...rest }: StackProps) {
    const theme = useTheme();
    const s: ViewStyle = { flexDirection: direction, gap: theme.spacing[gap] };
    if (align) s.alignItems = align;
    if (justify) s.justifyContent = justify;
    if (wrap) s.flexWrap = 'wrap';
    if (flex !== undefined) s.flex = flex;
    if (padding) s.padding = theme.spacing[padding];
    return <View {...rest} style={[s, style]} />;
  };
}

/** Yatay dizilim. RTL'de yön otomatik döner (React Native flex davranışı). */
export const Row = make('row');
/** Dikey dizilim. */
export const Column = make('column');

/** Esnek boşluk — iki ucu ayırır. */
export function Spacer({ size }: { size?: Spacing }) {
  const theme = useTheme();
  if (size) return <View style={{ width: theme.spacing[size], height: theme.spacing[size] }} />;
  return <View style={{ flex: 1 }} />;
}
