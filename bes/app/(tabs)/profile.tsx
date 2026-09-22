/** Profil ve ayarlar — şartname §59, §60. */
import React from 'react';
import { router } from 'expo-router';
import { Screen, SectionHeader, Card, ListItem, Segmented, Icon } from '@/ui';
import { useI18n, useT, LANGUAGES, LANGUAGE_NAMES } from '@/lib/i18n';
import { useThemeContext, type ThemeMode } from '@/theme/ThemeProvider';
import { Brand } from '@/config/brand';
import { openLegalPage } from '@/lib/legal';

export default function ProfileScreen() {
  const t = useT();
  const { language, setLanguage } = useI18n();
  const { mode, setMode } = useThemeContext();

  const temaSecenekleri: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <Screen scroll>
      <SectionHeader title={t('profile.title')} subtitle={t('profile.guest')} />
      <Card padding="sm">
        <ListItem title={t('account.title')} icon="user" onPress={() => router.push('/account')} />
        <ListItem title={t('notification.center')} icon="bell" onPress={() => router.push('/notifications-center')} />
        <ListItem title={t('diagnostics.title')} icon="info" onPress={() => router.push('/diagnostics')} />
      </Card>

      <SectionHeader title={t('settings.appearance')} />
      <Segmented
        options={temaSecenekleri}
        value={mode}
        onChange={setMode}
        label={t('settings.theme')}
      />

      <SectionHeader title={t('settings.language')} subtitle={t('settings.languageRestart')} />
      <Card padding="sm">
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

      <SectionHeader title={t('settings.notifications')} />
      <Card padding="sm">
        <ListItem title={t('reminder.title')} icon="bell" onPress={() => router.push('/reminders')} />
        <ListItem title={t('prayer.settings')} icon="clock" onPress={() => router.push('/prayer-settings')} />
        <ListItem title={t('audio.title')} icon="play" onPress={() => router.push('/recitation')} />
      </Card>

      <SectionHeader title={t('settings.about')} />
      <Card padding="sm">
        <ListItem title={t('settings.publisher')} value={Brand.publisher} chevron={false} />
        <ListItem title={t('settings.version')} value={Brand.version} chevron={false} />
        <ListItem title={t('settings.privacy')} icon="lock" onPress={() => openLegalPage('privacy')} />
        <ListItem title={t('settings.terms')} icon="book" onPress={() => openLegalPage('terms')} />
      </Card>
    </Screen>
  );
}
