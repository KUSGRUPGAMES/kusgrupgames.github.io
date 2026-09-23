/**
 * Onboarding — şartname §12. Beş aşama:
 * hoş geldin → konum → hesaplama yöntemi → bildirimler → hazır.
 *
 * Kural: hiçbir aşama kullanıcıyı kilitlemez; konum dışında hepsi atlanabilir
 * ve sonradan ayarlardan değiştirilebilir.
 */
import React, { useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Screen, Card, Column, Row, Text, Button, ListItem, ProgressBar, Banner, Field, Icon,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';
import { BrandPattern } from '@/ui/BrandPattern';
import { useT } from '@/lib/i18n';
import { Brand } from '@/config/brand';
import { searchPlaces } from '@/features/location/search';
import { requestDeviceLocation } from '@/features/location/device';
import { requestPermission } from '@/features/notifications/service';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { useMethodName } from '@/features/hijri/labels';
import { METHODS } from '@/features/prayer/methods';
import { markOnboardingDone } from '@/boot/persistence';
import { useBoot } from '@/boot/AppProviders';
// Logo dosya olarak gelir, kodla çizilmez (D17).
import logoSembol from '../assets/splash-icon.png';

const TOPLAM = 5;

export default function OnboardingScreen() {
  const t = useT();
  const yontemAdi = useMethodName();
  const theme = useTheme();
  const eylemStili = { backgroundColor: palette.emerald500, borderWidth: 1, borderColor: theme.colors.bezemeSolgun };
  const { completeOnboarding } = useBoot();
  const [adim, setAdim] = useState(1);
  const [sorgu, setSorgu] = useState('');
  const [uyari, setUyari] = useState<string | null>(null);
  const [aliniyor, setAliniyor] = useState(false);

  const konumlar = useLocationStore((s) => s.locations);
  const ekle = useLocationStore((s) => s.add);
  const aktif = useLocationStore((s) => s.active());
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

  const sonuclar = useMemo(() => (sorgu.trim() ? searchPlaces(sorgu, { limit: 12 }) : []), [sorgu]);

  const gpsKullan = async () => {
    setAliniyor(true);
    setUyari(null);
    const sonuc = await requestDeviceLocation();
    setAliniyor(false);
    if (sonuc.kind === 'ok') { ekle(sonuc.place, { origin: 'gps' }); return; }
    setUyari(sonuc.kind === 'denied' ? t('location.permissionDenied') : t('location.gpsUnavailable'));
  };

  const ilerle = () => {
    if (adim === 2 && konumlar.length === 0) { setUyari(t('onboarding.locationNeeded')); return; }
    setUyari(null);
    if (adim < TOPLAM) { setAdim(adim + 1); return; }
    void markOnboardingDone().then(() => {
      // Sıra önemli: kapı (`(tabs)/_layout.tsx`) `completeOnboarding()`
      // sonrası güncellenen context değerine bakıyor. Önce çağrılmazsa
      // yönlendirme, hâlâ `false` gören kapıya çarpıp onboarding'e geri döner.
      completeOnboarding();
      router.replace('/');
    });
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: false }} />
      <Card
        accent
        padding="xxl"
        style={{
          flexGrow: 1,
          minHeight: 560,
          borderWidth: 1,
          borderColor: theme.colors.bezemeSolgun,
        }}
      >
        <BrandPattern opacity={theme.opacity.motifEkran} />
        <Column gap="sm" style={{ marginBottom: theme.spacing.xl }}>
          <Text variant="micro" tone="onAccent">
            {t('onboarding.step', { current: adim, total: TOPLAM })}
          </Text>
          <ProgressBar value={adim / TOPLAM} accessibilityLabel={t('onboarding.step', { current: adim, total: TOPLAM })} />
        </Column>

        {adim === 1 ? (
          <View style={{ flexGrow: 1, justifyContent: 'center', minHeight: 352, paddingVertical: theme.spacing.xxl }}>
            <Column gap="lg" align="center">
              <Image
                source={logoSembol}
                style={{ width: 136, height: 136 }}
                resizeMode="contain"
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <Text variant="display" tone="onAccent" align="center">{Brand.appName}</Text>
              <Row gap="md" align="center" style={{ marginVertical: theme.spacing.xs }}>
                <View style={{ width: 40, height: 1, backgroundColor: theme.colors.bezemeSolgun }} />
                <View style={{ width: 8, height: 8, transform: [{ rotate: '45deg' }], backgroundColor: theme.colors.onAccentHighlight }} />
                <View style={{ width: 40, height: 1, backgroundColor: theme.colors.bezemeSolgun }} />
              </Row>
              <Text variant="body" tone="onAccent" align="center">{t('onboarding.welcomeBody')}</Text>
            </Column>
          </View>
        ) : null}

        {adim === 2 ? (
          <Column gap="md">
            <Text variant="title2" tone="onAccent">{t('onboarding.locationTitle')}</Text>
            <Text variant="body" tone="onAccent">{t('location.permissionBody')}</Text>
            <Button label={t('location.useGps')} icon="location" onPress={gpsKullan} loading={aliniyor} block
              style={eylemStili} />
            <Card padding="sm" style={{ backgroundColor: theme.colors.kat3, borderColor: theme.colors.onAccentBorder }}>
              <Field
                label={t('location.search')}
                hint={t('location.searchHint')}
                value={sorgu}
                onChangeText={setSorgu}
                autoCorrect={false}
                inputStyle={{ backgroundColor: theme.colors.kat2 }}
              />
            </Card>
            {sorgu.trim() && sonuclar.length === 0 ? <Banner tone="info" title={t('location.noResult')} /> : null}
            {sonuclar.length > 0 ? (
              <Card padding="sm">
                {sonuclar.map((p) => (
                  <ListItem
                    key={p.id}
                    title={p.name}
                    subtitle={p.country}
                    onPress={() => { ekle(p, { origin: 'manual' }); setSorgu(''); }}
                  />
                ))}
              </Card>
            ) : null}
            {aktif ? (
              <Banner tone="success" title={aktif.label} description={`${aktif.country} · ${aktif.timezone}`} />
            ) : null}
          </Column>
        ) : null}

        {adim === 3 ? (
          <Column gap="md">
            <Text variant="title2" tone="onAccent">{t('onboarding.methodTitle')}</Text>
            <Text variant="body" tone="onAccent">{t('onboarding.methodBody')}</Text>
            <Card padding="sm" style={{ backgroundColor: theme.colors.kat3, borderColor: theme.colors.onAccentBorder }}>
              {Object.values(METHODS).map((m) => (
                <ListItem
                  key={m.id}
                  title={yontemAdi(m.id)}
                  chevron={false}
                  // Seçili satır bir noktayla işaretleniyordu: küçük, soluk ve
                  // ekran okuyucuya hiçbir şey söylemiyordu. Onay imi hem
                  // görülüyor hem `accessibilityState` ile duyuruluyor.
                  selected={settings.method === m.id}
                  onPress={() => update({ method: m.id })}
                />
              ))}
            </Card>
          </Column>
        ) : null}

        {adim === 4 ? (
          <Column gap="md">
            <Text variant="title2" tone="onAccent">{t('onboarding.notificationTitle')}</Text>
            <Text variant="body" tone="onAccent">{t('onboarding.notificationBody')}</Text>
            <Button
              label={t('onboarding.notificationAllow')}
              icon="bell"
              onPress={() => { void requestPermission(); }}
              block
              style={eylemStili}
            />
            <Text variant="caption" tone="onAccent">{t('notification.coverageNote')}</Text>
          </Column>
        ) : null}

        {adim === 5 ? (
          <View style={{ flexGrow: 1, justifyContent: 'center', minHeight: 352 }}>
            <Column gap="lg" align="center">
              <Icon name="check" size={48} color={theme.colors.onAccentHighlight} />
              <Text variant="title2" tone="onAccent" align="center">{t('onboarding.readyTitle')}</Text>
              <Text variant="body" tone="onAccent" align="center">{t('onboarding.readyBody')}</Text>
            </Column>
          </View>
        ) : null}

        {uyari ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <Banner tone="warning" title={uyari} />
          </View>
        ) : null}

        {adim > 1 && adim < TOPLAM ? <View style={{ flexGrow: 1, minHeight: theme.spacing.xxl }} /> : null}

        {adim === 1 ? (
          <Button label={t('onboarding.start')} size="lg" block onPress={ilerle}
            style={eylemStili} />
        ) : (
          <Row gap="md" align="center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('nav.back')}
              onPress={() => { setUyari(null); setAdim(adim - 1); }}
              style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: theme.spacing.xs }}
            >
              <Text variant="bodyStrong" tone="onAccent">{t('nav.back')}</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            {/* Konum adımı (2) atlanamaz: "Geç" konum kontrolünü delmemeli. */}
            {adim > 2 && adim < TOPLAM ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.skip')}
                onPress={() => setAdim(adim + 1)}
                style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: theme.spacing.xs }}
              >
                <Text variant="bodyStrong" tone="onAccent">{t('common.skip')}</Text>
              </Pressable>
            ) : null}
            <Button
              label={adim === TOPLAM ? t('onboarding.finish') : t('common.next')}
              onPress={ilerle}
              style={eylemStili}
            />
          </Row>
        )}
      </Card>
    </Screen>
  );
}
