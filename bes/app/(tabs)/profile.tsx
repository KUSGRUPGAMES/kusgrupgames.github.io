/**
 * Ayarlar — şartname §59, §60.
 *
 * Eskiden "Profil" adındaydı ve vakit ayarları üç ayrı sekmeye dağılmıştı.
 * Artık bütün ayarlar burada, konuya göre gruplu (DECISIONS D25).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, SectionHeader, Card, ListItem, Segmented, Icon, PageHeader } from '@/ui';
import { useI18n, useT, LANGUAGES, LANGUAGE_NAMES } from '@/lib/i18n';
import { useThemeContext, type ThemeMode } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocationStore } from '@/store/locations';
import { Brand } from '@/config/brand';
import { openLegalPage } from '@/lib/legal';

export default function SettingsScreen() {
  const t = useT();
  const theme = useTheme();
  const { language, setLanguage } = useI18n();
  const { mode, setMode } = useThemeContext();
  const konum = useLocationStore((s) => s.active());

  const temaSecenekleri: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <Screen scroll>
      <PageHeader title={t('settings.title')} icon="settings" />

      <SectionHeader title={t('settings.sectionPrayer')} />
      <Card padding="md">
        <ListItem
          title={t('location.title')}
          icon="location"
          {...(konum ? { value: konum.label } : {})}
          onPress={() => router.push('/location')}
        />
        <ListItem title={t('prayer.settings')} icon="clock" onPress={() => router.push('/prayer-settings')} />
        <ListItem title={t('prayer.calendar')} icon="calendar" onPress={() => router.push('/prayer-calendar')} />
        <ListItem title={t('reminder.title')} icon="bell" onPress={() => router.push('/reminders')} />
        <ListItem title={t('notification.center')} icon="bellOff" onPress={() => router.push('/notifications-center')} />
      </Card>

      <SectionHeader title={t('nav.quran')} />
      <Card padding="md">
        <ListItem title={t('audio.title')} icon="play" onPress={() => router.push('/recitation')} />
      </Card>

      <SectionHeader title={t('settings.appearance')} />
      <Segmented
        options={temaSecenekleri}
        value={mode}
        onChange={setMode}
        label={t('settings.theme')}
      />
      <Card padding="md" style={{ marginTop: theme.spacing.md }}>
        <ListItem title={t('home.customize')} subtitle={t('home.customizeHint')} icon="settings"
          onPress={() => router.push('/home-layout')} />
      </Card>

      <SectionHeader title={t('settings.language')} subtitle={t('settings.languageRestart')} />
      <Card padding="md">
        {LANGUAGES.map((l) => (
          <ListItem
            key={l}
            title={LANGUAGE_NAMES[l]}
            chevron={false}
            {...(l === language ? { right: <Icon name="check" size={18} /> } : {})}
            onPress={() => setLanguage(l)}
          />
        ))}
      </Card>

      <SectionHeader title={t('settings.sectionData')} />
      <Card padding="md">
        <ListItem title={t('account.title')} subtitle={t('profile.guest')} icon="user" onPress={() => router.push('/account')} />
      </Card>

      <SectionHeader title={t('settings.about')} />
      <Card padding="md">
        <ListItem title={t('settings.publisher')} value={Brand.publisher} chevron={false} />
        <ListItem title={t('settings.version')} value={Brand.version} chevron={false} />
        <ListItem title={t('settings.privacy')} icon="lock" onPress={() => openLegalPage('privacy')} />
        <ListItem title={t('settings.terms')} icon="book" onPress={() => openLegalPage('terms')} />
        <ListItem title={t('diagnostics.title')} icon="info" onPress={() => router.push('/diagnostics')} />
        {__DEV__ ? (
          <ListItem title={`${t('onboarding.welcomeTitle')} (BEdev)`} icon="star" onPress={() => router.push('/onboarding')} />
        ) : null}
      </Card>
      <View style={{ height: theme.spacing.xxl }} />
    </Screen>
  );
}
