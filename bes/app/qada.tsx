/** Kaza namazı — şartname §41. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Button, Field, Banner,
  IconButton, ProgressBar, Divider, EmptyState,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useWorshipStore, QADA_SLOTS, type QadaSlot } from '@/store/worship';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';

export default function QadaScreen() {
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const qada = useWorshipStore((s) => s.qada);
  const history = useWorshipStore((s) => s.qadaHistory);
  const adjust = useWorshipStore((s) => s.adjustQada);
  const bulk = useWorshipStore((s) => s.bulkQada);
  const undo = useWorshipStore((s) => s.undoLastQada);

  const [gun, setGun] = useState('');

  const toplam = useMemo(() => QADA_SLOTS.reduce((t2, s) => t2 + qada[s], 0), [qada]);
  const kilinan = useMemo(
    () => history.filter((h) => h.delta < 0).reduce((t2, h) => t2 + Math.abs(h.delta), 0),
    [history],
  );

  const slotAdi = (slot: QadaSlot) => (slot === 'witr' ? t('qada.witr') : label(slot));

  return (
    <Screen scroll motif="octagonGrid">
      <Stack.Screen options={{ headerShown: true, title: t('qada.title') }} />
      <SectionHeader title={t('qada.subtitle')} />

      {/* Boş durum açıklaması, aşağıdaki "Toplu giriş" bölümünün alt
          başlığının birebir aynısıydı; kullanıcı aynı cümleyi iki kez
          okuyordu. */}
      {toplam === 0 ? (
        <EmptyState icon="check" title={t('qada.allDone')} description={t('qada.allDoneBody')} />
      ) : (
        <Card accent>
          <Column gap="sm" align="center">
            <Text variant="callout" tone="onAccent">{t('qada.remaining')}</Text>
            <Text variant="display" tone="onAccent">{toplam.toLocaleString('tr-TR')}</Text>
            {kilinan > 0 ? (
              <Text variant="caption" tone="onAccent">
                {t('qada.progress', { done: kilinan, total: kilinan + toplam })}
              </Text>
            ) : null}
          </Column>
        </Card>
      )}

      <Card padding="sm" style={{ marginTop: theme.spacing.lg }}>
        {QADA_SLOTS.map((slot, i) => (
          <View key={slot}>
            {i > 0 ? <Divider /> : null}
            <Row align="center" gap="md" style={{ paddingVertical: theme.spacing.sm }}>
              <Column flex={1} gap="xxs">
                <Text variant="bodyStrong">{slotAdi(slot)}</Text>
                <ProgressBar
                  value={kilinan + toplam > 0 ? 1 - qada[slot] / Math.max(1, qada[slot] + 1) : 0}
                  height={4}
                />
              </Column>
              <IconButton
                name="minus"
                label={`${slotAdi(slot)} ${t('qada.done')}`}
                size={18}
                filled
                disabled={qada[slot] === 0}
                onPress={() => adjust(slot, -1)}
              />
              <View style={{ minWidth: 56, alignItems: 'center' }}>
                <Text variant="title3" tone={qada[slot] > 0 ? 'highlight' : 'muted'}>
                  {String(qada[slot])}
                </Text>
              </View>
              <IconButton
                name="plus"
                label={`${slotAdi(slot)} +1`}
                size={18}
                filled
                onPress={() => adjust(slot, 1)}
              />
            </Row>
          </View>
        ))}
      </Card>

      <SectionHeader title={t('qada.bulk')} subtitle={t('qada.bulkHint')} />
      <Row gap="sm" align="center">
        <View style={{ flex: 1 }}>
          <Field
            label={t('qada.bulkDays')}
            value={gun}
            onChangeText={setGun}
            keyboardType="number-pad"
          />
        </View>
        <Button
          label={t('qada.bulkAdd')}
          onPress={() => {
            const n = Number(gun);
            if (Number.isFinite(n) && n > 0) { bulk(n); setGun(''); }
          }}
        />
      </Row>

      {history.length > 0 ? (
        <Row style={{ marginTop: theme.spacing.lg }}>
          <Button label={t('qada.undo')} icon="refresh" variant="secondary" size="sm" onPress={undo} />
        </Row>
      ) : null}

      <Banner tone="info" title={t('qada.title')} description={t('log.privateNote')} />
    </Screen>
  );
}
