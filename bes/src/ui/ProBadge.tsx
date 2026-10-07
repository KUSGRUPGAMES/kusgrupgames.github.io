/**
 * PRO rozeti — Pro özelliklerinin yanında durur (1 Ekim kararı).
 *
 * Lansman döneminde Pro özellikleri herkese ücretsizken de gösterilir:
 * kullanıcı hangi bölümün Pro olacağını önceden görür. Kilit değildir;
 * kilit gerekiyorsa `ProLock` kullanılır.
 */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';
import { Icon } from './Icon';

export function ProBadge({ label = 'PRO' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={label}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
        paddingHorizontal: 7, paddingVertical: 2, borderRadius: theme.radius.pill,
        borderWidth: 1, borderColor: theme.colors.highlight, backgroundColor: theme.colors.accentSurface,
      }}
    >
      <Icon name="crown" size={11} color={theme.colors.highlight} />
      <Text variant="micro" style={{ color: theme.colors.highlight, fontWeight: '700', letterSpacing: 0.6 }}>{label}</Text>
    </View>
  );
}
