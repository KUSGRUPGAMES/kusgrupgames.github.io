/** Çevrimdışı şeridi — şartname §82. */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { Banner } from '@/ui/Banner';
import { useOnline } from './useOnline';

export function OfflineBanner() {
  const theme = useTheme();
  const t = useT();
  const { online, unknown } = useOnline();
  if (online || unknown) return null;
  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
      <Banner tone="warning" title={t('offline.title')} description={t('offline.body')} />
    </View>
  );
}
