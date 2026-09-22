/** Ayırıcı çizgi — şartname §8. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Spacing } from '@/theme/tokens';

export function Divider({ inset = 'none', vertical = false }: { inset?: Spacing; vertical?: boolean }) {
  const theme = useTheme();
  const px = theme.spacing[inset];
  return (
    <View
      accessibilityRole="none"
      style={
        vertical
          ? { width: 1, alignSelf: 'stretch', marginVertical: px, backgroundColor: theme.colors.border }
          : { height: 1, marginHorizontal: px, backgroundColor: theme.colors.border }
      }
    />
  );
}
