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
import { Icon, Text, type IconName } from '@/ui';
import { OfflineBanner } from '@/features/network/OfflineBanner';

export default function TabsLayout() {
  const theme = useTheme();
  const t = useT();
  const { onboardingDone } = useBoot();

  const ikon = (name: IconName) =>
    function TabIcon({ color, size }: { color: string; size: number }) {
      return <Icon name={name} color={color} size={size} />;
    };

  /**
   * Sekme adı da tasarım sisteminin `Text`i ile çizilir: react-navigation'ın
   * kendi etiketi ham bir `Text`tir, tipografi token'larını ve Dynamic Type
   * üst sınırını atlar.
   *
   * **Bu, T6'yı çözmez.** Arapça geçişinde sekme adlarındaki `ر` çizilmiyor
   * ("الرئيسية" → "ال ئسسة"); etiketi bu bileşene taşımak sonucu
   * değiştirmedi. Ayrıntı ve elenen olasılıklar `KNOWN_ISSUES.md` T6'da.
   */
  const etiket = (anahtar: Parameters<typeof t>[0]) =>
    function TabLabel({ color }: { color: string }) {
      return <Text variant="micro" lines={1} align="center" style={{ color }}>{t(anahtar)}</Text>;
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
          tabBarActiveTintColor: theme.colors.onAccentHighlight,
          tabBarInactiveTintColor: theme.name === 'dark' ? theme.colors.textMuted : theme.colors.onAccent,
          tabBarStyle: {
            backgroundColor: theme.colors.accentGradient[1],
            borderTopColor: theme.colors.bezemeSolgun,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: t('nav.home'), tabBarIcon: ikon('clock'), tabBarLabel: etiket('nav.home') }}
        />
        <Tabs.Screen
          name="quran"
          options={{ title: t('nav.quran'), tabBarIcon: ikon('book'), tabBarLabel: etiket('nav.quran') }}
        />
        <Tabs.Screen
          name="worship"
          options={{ title: t('nav.worship'), tabBarIcon: ikon('beads'), tabBarLabel: etiket('nav.worship') }}
        />
        <Tabs.Screen
          name="explore"
          options={{ title: t('nav.explore'), tabBarIcon: ikon('sparkle'), tabBarLabel: etiket('nav.explore') }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t('nav.profile'), tabBarIcon: ikon('user'), tabBarLabel: etiket('nav.profile') }}
        />
      </Tabs>
    </>
  );
}
