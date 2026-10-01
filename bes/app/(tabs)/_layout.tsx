/**
 * Sekme düzeni — şartname §11.
 * Beş sekme: Vakitler · Kur'an · İbadet · Topluluk · Ayarlar (D25, 1 Ekim
 * revizyonu: Öğren Kur'an sekmesinin içine taşındı, Topluluk sekme oldu).
 * Sekme adları çeviriden gelir; ikonlar kendi SVG setimizden.
 */
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeProvider';
import { useBoot } from '@/boot/AppProviders';
import { useT } from '@/lib/i18n';
import { Icon, Text, type IconName } from '@/ui';
import { OfflineBanner } from '@/features/network/OfflineBanner';
import { AdBanner } from '@/features/pro/AdBanner';
import type { AdSurface } from '@/features/pro/ads';

/** Sekme → reklam yüzeyi (ads.ts kuralları yüzeye göre). */
const YUZEY: Record<string, AdSurface> = {
  index: 'home', quran: 'quranList', worship: 'explore', community: 'explore', profile: 'profile',
};

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
      // `lines` verilmez: tek satır sınırı metin kutusunu kırpıyor ve
      // "Öğren"in noktalarıyla "Ayarlar"ın y kuyruğu kesiliyordu. Etiketler
      // zaten tek kelime.
      return <Text variant="micro" align="center" style={{ color }}>{t(anahtar)}</Text>;
    };

  // İlk açılışta onboarding'e yönlendirilir; sonraki açılışlarda görünmez (§12).
  // Bu kapı kökte değil burada durur: bu düzen kök yığının bir ekranıdır,
  // dolayısıyla `Redirect` çalışacağı gezinme bağlamını bulur.
  if (!onboardingDone) return <Redirect href="/onboarding" />;

  return (
    <>
      <OfflineBanner />
      <Tabs
        // Şerit reklam sekme çubuğunun hemen üstünde, sabit (1 Ekim kararı).
        tabBar={(props) => (
          <>
            <AdBanner surface={YUZEY[props.state.routes[props.state.index]?.name ?? ''] ?? 'home'} sabit />
            <BottomTabBar {...props} />
          </>
        )}
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
          name="community"
          options={{ title: t('nav.community'), tabBarIcon: ikon('users'), tabBarLabel: etiket('nav.community') }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t('nav.profile'), tabBarIcon: ikon('settings'), tabBarLabel: etiket('nav.profile') }}
        />
      </Tabs>
    </>
  );
}
