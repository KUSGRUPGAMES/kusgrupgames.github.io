/**
 * Onboarding — şartname §12. Beş aşama:
 * hoş geldin → konum → hesaplama yöntemi → bildirimler → hazır.
 *
 * Kural: hiçbir aşama kullanıcıyı kilitlemez; konum dışında hepsi atlanabilir
 * ve sonradan ayarlardan değiştirilebilir.
 */
import React, { useMemo, useState } from 'react';
import { Image, View } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Screen, Card, Column, Row, Text, Button, ListItem, ProgressBar, Banner, Field, EmptyState,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { Brand } from '@/config/brand';
import { searchPlaces } from '@/features/location/search';
import { requestDeviceLocation } from '@/features/location/device';
import { requestPermission } from '@/features/notifications/service';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { useMethodName } from '@/features/hijri/labels';
import { METHODS } from '@/features/prayer/methods';
import { useBoot } from '@/boot/AppProviders';
// Logo dosya olarak gelir, kodla çizilmez (D17).
import logoSembol from '../assets/splash-icon.png';

const TOPLAM = 5;

export default function OnboardingScreen() {
  const t = useT();
  const yontemAdi = useMethodName();
  const theme = useTheme();
  const [adim, setAdim] = useState(1);
  const [sorgu, setSorgu] = useState('');
  const [uyari, setUyari] = useState<string | null>(null);
  const [aliniyor, setAliniyor] = useState(false);
  const [bitiriliyor, setBitiriliyor] = useState(false);
  const { completeOnboarding } = useBoot();

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
    if (bitiriliyor) return;
    setBitiriliyor(true);
    void completeOnboarding()
      .then(() => router.replace('/'))
      .catch(() => { setUyari(t('error.crashBody')); setBitiriliyor(false); });
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: false }} />

      <Column gap="sm" style={{ marginBottom: theme.spacing.xl }}>
        <Text variant="micro" tone="subtle">
          {t('onboarding.step', { current: adim, total: TOPLAM })}
        </Text>
        <ProgressBar value={adim / TOPLAM} accessibilityLabel={t('onboarding.step', { current: adim, total: TOPLAM })} />
      </Column>

      {/* Hoş geldin kartı dikeyde ortalanır: üstte ve altta eşit esnek boşluk. */}
      {adim === 1 ? <View style={{ flex: 1 }} /> : null}

      {adim === 1 ? (
        <Card accent motif="marka" padding="xxl">
          <Column gap="md" align="center">
            {/* Altın sembol zümrüt kartın üstünde durduğu için saydam varyant. */}
            <Image
              source={logoSembol}
              style={{ width: 96, height: 96 }}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text variant="display" tone="onAccent">{Brand.appName}</Text>
            <Text variant="body" tone="onAccent" align="center">{t('onboarding.welcomeBody')}</Text>
          </Column>
        </Card>
      ) : null}

      {adim === 2 ? (
        <Card motif="marka" padding="xl">
          <Column gap="md">
          <Text variant="title2">{t('onboarding.locationTitle')}</Text>
          <Text variant="body" tone="muted">{t('location.permissionBody')}</Text>
          <Button label={t('location.useGps')} icon="location" onPress={gpsKullan} loading={aliniyor} block />
          <Field
            label={t('location.search')}
            hint={t('location.searchHint')}
            value={sorgu}
            onChangeText={setSorgu}
            autoCorrect={false}
          />
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
        </Card>
      ) : null}

      {adim === 3 ? (
        <Column gap="md">
          <Text variant="title2">{t('onboarding.methodTitle')}</Text>
          <Text variant="body" tone="muted">{t('onboarding.methodBody')}</Text>
          <Card padding="sm">
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
        <Card motif="marka" padding="xl">
          <Column gap="md">
          <Text variant="title2">{t('onboarding.notificationTitle')}</Text>
          <Text variant="body" tone="muted">{t('onboarding.notificationBody')}</Text>
          <Button
            label={t('onboarding.notificationAllow')}
            icon="bell"
            onPress={() => { void requestPermission(); }}
            block
          />
          <Text variant="caption" tone="subtle">{t('notification.coverageNote')}</Text>
          </Column>
        </Card>
      ) : null}

      {adim === 5 ? (
        <Card motif="marka" padding="xxl">
          <EmptyState
            icon="check"
            title={t('onboarding.readyTitle')}
            description={t('onboarding.readyBody')}
          />
        </Card>
      ) : null}

      {uyari ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Banner tone="warning" title={uyari} />
        </View>
      ) : null}

      {/* Hoş geldin adımı ekranın üçte birini kullanıp altını boş bırakıyordu;
          esnek boşluk gezinme satırını alta indirir. */}
      <View style={{ flex: 1, minHeight: theme.spacing.xxl }} />

      <Row gap="md" align="center">
        {adim > 1 ? (
          <Button label={t('nav.back')} variant="ghost" onPress={() => { setUyari(null); setAdim(adim - 1); }} />
        ) : null}
        <View style={{ flex: 1 }} />
        {/* Konum adımı (2) atlanamaz: "Geç" doğrudan `setAdim` çağırdığı için
            `ilerle()` içindeki konum kontrolünü deliyordu ve kullanıcı
            konumsuz ana sayfaya düşüyordu. */}
        {adim > 2 && adim < TOPLAM ? (
          <Button label={t('common.skip')} variant="ghost" onPress={() => setAdim(adim + 1)} />
        ) : null}
        <Button
          label={adim === 1 ? t('onboarding.start') : adim === TOPLAM ? t('onboarding.finish') : t('common.next')}
          onPress={ilerle}
          loading={bitiriliyor}
        />
      </Row>
    </Screen>
  );
}
