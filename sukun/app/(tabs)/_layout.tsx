/**
 * Sekme düzeni — şartname §11.
 * Beş sekme: Ana Sayfa · Kuran · İbadet · Keşfet · Profil.
 * Sekme adları çeviriden gelir; ikonlar kendi SVG setimizden.
 */
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useBoot } from '@/boot/AppProviders';
import { useT } from '@/lib/i18n';
import { Icon, type IconName } from '@/ui';
import { OfflineBanner } from '@/features/network/OfflineBanner';

export default function TabsLayout() {
  const theme = useTheme();
  const t = useT();
  const { onboardingDone } = useBoot();

  const ikon = (name: IconName) =>
    function TabIcon({ color, size }: { color: string; size: number }) {
      return <Icon name={name} color={color} size={size} />;
    };

  // İlk açılışta onboarding'e yönlendirilir; sonraki açılışlarda görünmez (§12).
  // Bu kapı kökte değil burada durur: bu düzen kök yığının bir ekranıdır,
  // dolayısıyla `Redirect` çalışacağı gezinme bağlamını bulur.
  if (!onboardingDone) return <Redirect href="/onboarding" />;

  return (
    <>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textSubtle,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
          tabBarLabelStyle: { fontSize: theme.typography.micro.size },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('nav.home'), tabBarIcon: ikon('clock') }} />
        <Tabs.Screen name="quran" options={{ title: t('nav.quran'), tabBarIcon: ikon('book') }} />
        <Tabs.Screen name="worship" options={{ title: t('nav.worship'), tabBarIcon: ikon('beads') }} />
        <Tabs.Screen name="explore" options={{ title: t('nav.explore'), tabBarIcon: ikon('sparkle') }} />
        <Tabs.Screen name="profile" options={{ title: t('nav.profile'), tabBarIcon: ikon('user') }} />
      </Tabs>
    </>
  );
}
