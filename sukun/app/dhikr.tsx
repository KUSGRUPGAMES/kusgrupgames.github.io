/** Zikirmatik — şartname §37, §38, §79, §81. */
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Chip, Button, Field,
  CountdownRing, Toggle, Banner, IconButton,
} from '@/ui';
import { useTheme, useThemeContext } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { DHIKR_PRESETS, DHIKR_TARGETS } from '@/content/dhikr';
import { useWorshipStore } from '@/store/worship';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { dateKey } from '@/features/dhikr/stats';
import { zonedNow } from '@/lib/time/zone';

export default function DhikrScreen() {
  const t = useT();
  const theme = useTheme();
  const { reduceMotion } = useThemeContext();
  const konum = useLocationStore((s) => s.active());
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const addSession = useWorshipStore((s) => s.addSession);

  const [baslik, setBaslik] = useState(DHIKR_PRESETS[0]!.title);
  const [ozelBaslik, setOzelBaslik] = useState('');
  const [hedef, setHedef] = useState(DHIKR_PRESETS[0]!.target);
  const [sayac, setSayac] = useState(0);
  const [kaydedildi, setKaydedildi] = useState(false);

  // Gün sınırı konumun takvimine göre çizilir (§38).
  const bugun = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
  }, [konum]);

  const tamamlandi = sayac >= hedef;

  const say = () => {
    const yeni = sayac + 1;
    setSayac(yeni);
    setKaydedildi(false);
    if (settings.notifications.vibration && !reduceMotion) {
      // Hedefe varınca farklı bir geri bildirim: kullanıcı bakmadan anlar.
      void (yeni >= hedef
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    }
  };

  const kaydet = () => {
    if (sayac === 0) return;
    addSession({ title: ozelBaslik.trim() || baslik, count: sayac, target: hedef, onDate: bugun });
    setSayac(0);
    setKaydedildi(true);
  };

  return (
    <Screen scroll motif="starLattice">
      <Stack.Screen options={{ headerShown: true, title: t('dhikr.title') }} />

      <Card accent motif="rubElHizb" padding="xxl">
        <Column gap="lg" align="center">
          <Text variant="callout" tone="onAccent">{ozelBaslik.trim() || baslik}</Text>
          <Pressable
            onPress={say}
            accessibilityRole="button"
            accessibilityLabel={t('dhikr.tapToCount')}
            accessibilityValue={{ min: 0, max: hedef, now: sayac }}
          >
            <CountdownRing
              progress={hedef > 0 ? sayac / hedef : 0}
              size={200}
              // Yatak `border` iken açık temada fildişi bir çember çiziyordu ve
              // ilerleme de fildişi olduğu için sayaç hiç ilerlemiyor gibi
              // duruyordu. Artık logonun altını + saydam yatak (D18).
              color={theme.colors.onAccentHighlight}
              trackColor={theme.colors.onAccentBorder}
            >
              <Column align="center" gap="xxs">
                <Text variant="display" tone="onAccent">{String(sayac)}</Text>
                <Text variant="caption" tone="onAccent">{`/ ${hedef}`}</Text>
              </Column>
            </CountdownRing>
          </Pressable>
          <Text variant="caption" tone="onAccent">
            {tamamlandi ? t('dhikr.completed') : t('dhikr.tapToCount')}
          </Text>
        </Column>
      </Card>

      <Row gap="sm" style={{ marginTop: theme.spacing.lg }}>
        <Button label={t('dhikr.save')} icon="check" onPress={kaydet} disabled={sayac === 0} />
        <Button label={t('dhikr.reset')} icon="refresh" variant="ghost" onPress={() => setSayac(0)} />
        <View style={{ flex: 1 }} />
        <IconButton name="star" label={t('dhikr.stats')} onPress={() => router.push('/dhikr-stats')} />
      </Row>

      {kaydedildi ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Banner tone="success" title={t('dhikr.sessionSaved')} />
        </View>
      ) : null}

      <SectionHeader title={t('dhikr.pick')} />
      <Row gap="sm" wrap>
        {DHIKR_PRESETS.map((p) => (
          <Chip
            key={p.id}
            label={p.title}
            selected={!ozelBaslik.trim() && baslik === p.title}
            onPress={() => { setBaslik(p.title); setHedef(p.target); setOzelBaslik(''); setSayac(0); }}
          />
        ))}
      </Row>

      <SectionHeader title={t('dhikr.target')} />
      <Row gap="sm" wrap>
        {DHIKR_TARGETS.map((n) => (
          <Chip key={n} label={String(n)} selected={hedef === n} onPress={() => setHedef(n)} />
        ))}
      </Row>

      <SectionHeader title={t('dhikr.custom')} subtitle={t('dhikr.customHint')} />
      <Field label={t('dhikr.custom')} value={ozelBaslik} onChangeText={setOzelBaslik} />

      <Card padding="sm" style={{ marginTop: theme.spacing.lg }}>
        <Toggle
          title={t('dhikr.haptic')}
          value={settings.notifications.vibration}
          onChange={(v) => update({ notifications: { ...settings.notifications, vibration: v } })}
          icon="bell"
        />
      </Card>
    </Screen>
  );
}
