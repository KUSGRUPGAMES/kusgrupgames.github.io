/** Kök düzen — şartname §11. Tüm sağlayıcılar burada kurulur. */
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/boot/AppProviders';
import { useTheme } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}

function RootStack() {
  const theme = useTheme();
  // Buradan **asla** erken dönülmez. Kök düzen bir gezinme kabı çizmezse
  // yönlendirme asılacak bağlam bulamaz ve ekran bomboş kalır; ilk açılış
  // beyaz ekranla başlıyordu, sebebi buydu. Onboarding kapısı artık
  // `(tabs)/_layout.tsx` içinde — orası kök yığının bir ekranıdır (§12).
  return (
    <>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
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
        <Stack.Screen name="quran-search" />
        <Stack.Screen name="qibla" />
        <Stack.Screen name="dhikr" />
        <Stack.Screen name="dhikr-stats" />
        <Stack.Screen name="qada" />
        <Stack.Screen name="worship-log" />
        <Stack.Screen name="prayer-guide" />
        <Stack.Screen name="zakat" />
        <Stack.Screen name="ramadan" />
        <Stack.Screen name="khatm" />
        <Stack.Screen name="hajj" />
        <Stack.Screen name="search" />
        <Stack.Screen name="reminders" />
        <Stack.Screen name="recitation" />
        <Stack.Screen name="share-card" />
        <Stack.Screen name="notifications-center" />
        <Stack.Screen name="diagnostics" />
        <Stack.Screen name="account" />
      </Stack>
    </>
  );
}
