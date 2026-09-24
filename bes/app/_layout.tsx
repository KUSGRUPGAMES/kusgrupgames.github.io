/** Kök düzen — şartname §11. Tüm sağlayıcılar burada kurulur. */
import React from 'react';
import { I18nManager, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/boot/AppProviders';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { Icon } from '@/ui';

export default function RootLayout() {
  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}

function RootStack() {
  const theme = useTheme();
  const t = useT();
  // Buradan **asla** erken dönülmez. Kök düzen bir gezinme kabı çizmezse
  // yönlendirme asılacak bağlam bulamaz ve ekran bomboş kalır; ilk açılış
  // beyaz ekranla başlıyordu, sebebi buydu. Onboarding kapısı artık
  // `(tabs)/_layout.tsx` içinde — orası kök yığının bir ekranıdır (§12).
  return (
    <>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={({ navigation }) => ({
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          // Yirmi beş ekran kendi başlığını açıyor (`headerShown: true`).
          // Başlık çubuğu temalanmazsa React Navigation kendi varsayılanını
          // kullanıyor: koyu temada sayfanın üstünde **bembeyaz** bir şerit
          // kalıyordu. Renk gradyanın üst durağıdır, böylece başlıkla sayfa
          // arasında çizgi görünmez (D18).
          headerStyle: { backgroundColor: theme.colors.backgroundGradient[0] },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { color: theme.colors.text },
          headerShadowVisible: false,
          // Geri düğmesi varsayılan olarak bir önceki ekranın rota adını
          // metin olarak gösteriyor; kök yığındaki önceki ekran "(tabs)"
          // Stack.Screen'i olduğu ve hiç `title` almadığı için düğmede ham
          // rota adı "(tabs)" görünüyordu. Yalnız ok gösterilir.
          headerBackButtonDisplayMode: 'minimal',
          // Geri düğmesi **bizim**: react-native-screens 4.16'da iOS 26'da
          // yerleşik geri düğmesi, başlığı gizli bir ekrandan (burada
          // sekmeler) gelinen yığında birkaç gidiş-dönüşten sonra dokunmaya
          // yanıt vermez hâle geliyor; kaydırarak geri dönmek çalışmaya devam
          // ediyor (software-mansion/react-native-screens#3294, düzeltme
          // 4.18'de; Expo SDK 54 4.16'ya sabit). Kendi düğmemiz bu yoldan
          // geçmediği için her zaman çalışır.
          headerLeft: ({ canGoBack, tintColor }) => (canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('nav.back')}
              hitSlop={12}
              onPress={() => navigation.goBack()}
              style={{ paddingVertical: 6, paddingEnd: 8 }}
            >
              <Icon name={I18nManager.isRTL ? 'chevronRight' : 'chevronLeft'} size={26}
                color={tintColor ?? theme.colors.text} />
            </Pressable>
          ) : null),
        })}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="location" options={{ presentation: 'modal' }} />
        <Stack.Screen name="prayer-settings" />
        <Stack.Screen name="prayer-calendar" />
        <Stack.Screen name="home-layout" />
        <Stack.Screen name="names" />
        <Stack.Screen name="duas" />
        <Stack.Screen name="knowledge" />
        <Stack.Screen name="hijri" />
        <Stack.Screen name="reader" />
        <Stack.Screen name="lesson" />
        <Stack.Screen name="alphabet" />
        <Stack.Screen name="quran-search" />
        <Stack.Screen name="qibla" />
        <Stack.Screen name="dhikr" />
        <Stack.Screen name="dhikr-stats" />
        <Stack.Screen name="qada" />
        <Stack.Screen name="worship-log" />
        <Stack.Screen name="worship-stats" />
        <Stack.Screen name="prayer-guide" />
        <Stack.Screen name="zakat" />
        <Stack.Screen name="ramadan" />
        <Stack.Screen name="khatm" />
        <Stack.Screen name="hajj" />
        <Stack.Screen name="search" />
        <Stack.Screen name="reminders" />
        <Stack.Screen name="alarms" />
        <Stack.Screen name="recitation" />
        <Stack.Screen name="share-card" />
        <Stack.Screen name="notifications-center" />
        <Stack.Screen name="diagnostics" />
        <Stack.Screen name="account" />
      </Stack>
    </>
  );
}
