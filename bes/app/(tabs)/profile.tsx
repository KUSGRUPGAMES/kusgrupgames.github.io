/**
 * Ayarlar — şartname §59, §60.
 *
 * Eskiden "Profil" adındaydı ve vakit ayarları üç ayrı sekmeye dağılmıştı.
 * Artık bütün ayarlar burada, konuya göre gruplu (DECISIONS D25).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, SectionHeader, Card, ListItem, Icon, PageHeader } from '@/ui';
import { useI18n, useT, LANGUAGES, LANGUAGE_NAMES } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { useLocationStore } from '@/store/locations';
import { Brand } from '@/config/brand';
import { openLegalPage } from '@/lib/legal';
import { showAdPrivacyOptions, useAdsStore } from '@/features/pro/adsRuntime';
import { RewardedAdFreeItem } from '@/features/pro/RewardedAdFreeItem';
import { TabTour, resetTour } from '@/features/tour/TabTour';
import { PRO_SALES_ENABLED } from '@/features/pro/useProAccess';

export default function SettingsScreen() {
  const [turSifirlandi, setTurSifirlandi] = useState(false);
  const reklamGizlilik = useAdsStore((s) => s.privacyOptions);
  const t = useT();
  const theme = useTheme();
  const { language, setLanguage } = useI18n();
  const konum = useLocationStore((s) => s.active());

  return (
    <Screen scroll>
      <TabTour tab="profile" />
      <PageHeader title={t('settings.title')} icon="settings" />

      <Card padding="sm">
        <ListItem title={t('pro.title')} subtitle={PRO_SALES_ENABLED ? t('pro.settingsHint') : t('pro.launchShort')} icon="crown" onPress={() => router.push('/pro')} />
        <RewardedAdFreeItem />
      </Card>

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
        <ListItem title={t('alarm.title')} subtitle={t('alarm.subtitle')} icon="bell" onPress={() => router.push('/alarms')} />
        <ListItem title={t('alarm.custom')} icon="plus" onPress={() => router.push('/reminders')} />
      </Card>

      <SectionHeader title={t('nav.quran')} />
      <Card padding="md">
        <ListItem title={t('audio.title')} icon="play" onPress={() => router.push('/recitation')} />
      </Card>

      <SectionHeader title={t('settings.appearance')} />
      <Card padding="md">
        <ListItem title={t('home.customize')} subtitle={t('home.customizeHint')} icon="settings"
          onPress={() => router.push('/home-layout')} />
        <ListItem title={t('tour.reset')} subtitle={turSifirlandi ? t('tour.resetDone') : undefined} icon="info"
          chevron={false} onPress={() => { void resetTour().then(() => setTurSifirlandi(true)); }} />
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
        {reklamGizlilik ? (
          <ListItem title={t('ads.privacyOptions')} icon="lock" onPress={() => { void showAdPrivacyOptions(); }} />
        ) : null}
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
