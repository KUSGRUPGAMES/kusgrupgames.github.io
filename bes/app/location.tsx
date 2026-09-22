/** Konum seçimi ve kayıtlı konumlar — şartname §13. */
import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, ListItem, Field, Button, EmptyState, Banner, Row, IconButton,
} from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { searchPlaces } from '@/features/location/search';
import { requestDeviceLocation } from '@/features/location/device';
import { useLocationStore } from '@/store/locations';

export default function LocationScreen() {
  const t = useT();
  const theme = useTheme();
  const [sorgu, setSorgu] = useState('');
  const [durum, setDurum] = useState<{ tone: 'info' | 'warning'; text: string } | null>(null);
  const [aliniyor, setAliniyor] = useState(false);

  const kayitli = useLocationStore((s) => s.locations);
  const aktifId = useLocationStore((s) => s.activeId);
  const ekle = useLocationStore((s) => s.add);
  const sil = useLocationStore((s) => s.remove);
  const aktifYap = useLocationStore((s) => s.setActive);
  const birincilYap = useLocationStore((s) => s.setPrimary);

  const sonuclar = useMemo(() => (sorgu.trim() ? searchPlaces(sorgu, { limit: 30 }) : []), [sorgu]);

  const gpsKullan = async () => {
    setAliniyor(true);
    setDurum(null);
    const sonuc = await requestDeviceLocation();
    setAliniyor(false);
    if (sonuc.kind === 'ok') {
      ekle(sonuc.place, { origin: 'gps' });
      setDurum({ tone: 'info', text: t('location.gpsMatched', { name: sonuc.place.name }) });
      return;
    }
    if (sonuc.kind === 'denied') setDurum({ tone: 'warning', text: t('location.permissionDenied') });
    else if (sonuc.kind === 'noMatch') setDurum({ tone: 'warning', text: t('location.gpsNoMatch') });
    else setDurum({ tone: 'warning', text: t('location.gpsUnavailable') });
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: t('location.title') }} />

      <Row gap="sm" align="center">
        <Button
          label={t('location.useGps')}
          icon="location"
          onPress={gpsKullan}
          loading={aliniyor}
          block
        />
      </Row>

      {durum ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Banner tone={durum.tone} title={durum.text} />
        </View>
      ) : null}

      <SectionHeader title={t('location.manual')} />
      <Field
        label={t('location.search')}
        hint={t('location.searchHint')}
        value={sorgu}
        onChangeText={setSorgu}
        autoCorrect={false}
      />

      {sorgu.trim() ? (
        sonuclar.length > 0 ? (
          <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
            <FlatList
              data={sonuclar}
              scrollEnabled={false}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <ListItem
                  title={item.name}
                  subtitle={item.country}
                  onPress={() => { ekle(item, { origin: 'manual' }); setSorgu(''); }}
                />
              )}
            />
          </Card>
        ) : (
          <View style={{ marginTop: theme.spacing.md }}>
            <Banner tone="info" title={t('location.noResult')} />
          </View>
        )
      ) : null}

      <SectionHeader title={t('location.saved')} />
      {kayitli.length === 0 ? (
        <EmptyState icon="location" title={t('location.empty')} description={t('location.searchHint')} />
      ) : (
        <Card padding="sm">
          {kayitli.map((l) => (
            <ListItem
              key={l.id}
              title={l.label}
              subtitle={l.isPrimary ? `${l.country} · ${t('location.primary')}` : l.country}
              onPress={() => { aktifYap(l.id); router.back(); }}
              chevron={false}
              right={
                <Row gap="xs" align="center">
                  {l.isPrimary ? null : (
                    <IconButton
                      name="star"
                      label={t('location.setPrimary')}
                      size={18}
                      onPress={() => birincilYap(l.id)}
                    />
                  )}
                  <IconButton
                    name="close"
                    label={t('common.delete')}
                    size={18}
                    onPress={() => sil(l.id)}
                  />
                </Row>
              }
              style={l.id === aktifId ? { opacity: 1 } : undefined}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
