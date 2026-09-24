/** İbadet defteri ve oruç takibi — şartname §42, §49. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Segmented, Stepper,
  Field, Banner, IconButton, Divider, Chip,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useDateFormat } from '@/lib/i18n';
import { useWorshipStore, type QadaSlot, type FastKind } from '@/store/worship';
import { useLocationStore } from '@/store/locations';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { dateKey } from '@/features/dhikr/stats';
import { zonedNow } from '@/lib/time/zone';

type NamazSlot = Exclude<QadaSlot, 'witr'>;
const NAMAZLAR: NamazSlot[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function WorshipLogScreen() {
  const tamTarih = useDateFormat({ dateStyle: 'full', timeZone: 'UTC' });
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const konum = useLocationStore((s) => s.active());

  const bugunKey = useMemo(() => {
    const z = zonedNow(konum?.timezone ?? null);
    return dateKey(z.year, z.month, z.day);
  }, [konum]);

  const [offset, setOffset] = useState(0);
  const tarih = useMemo(() => {
    const [y, m, d] = bugunKey.split('-').map(Number) as [number, number, number];
    const dt = new Date(Date.UTC(y, m - 1, d + offset));
    return dateKey(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
  }, [bugunKey, offset]);

  const gun = useWorshipStore((s) => s.days[tarih]);
  const oruc = useWorshipStore((s) => s.fasts[tarih]);
  const setPrayer = useWorshipStore((s) => s.setPrayer);
  const setQuranMinutes = useWorshipStore((s) => s.setQuranMinutes);
  const setDayNote = useWorshipStore((s) => s.setDayNote);
  const setFast = useWorshipStore((s) => s.setFast);
  const clearFast = useWorshipStore((s) => s.clearFast);

  const gosterim = tamTarih.format(new Date(`${tarih}T12:00:00Z`));

  const orucSecenekleri: { id: FastKind | 'none'; label: string }[] = [
    { id: 'none', label: t('log.fastNone') },
    { id: 'ramadan', label: t('log.fastRamadan') },
    { id: 'qada', label: t('log.fastQada') },
    { id: 'nafile', label: t('log.fastNafile') },
  ];

  return (
    <Screen topInset={false} scroll motif="girih">
      <Stack.Screen options={{ headerShown: true, title: t('log.title') }} />

      <Row align="center" justify="space-between">
        <IconButton name="chevronLeft" label={t('nav.back')} onPress={() => setOffset(offset - 1)} />
        <Column align="center" gap="xxs">
          <Text variant="bodyStrong">{gosterim}</Text>
          {offset === 0 ? <Text variant="micro" tone="accent">{t('common.today')}</Text> : null}
        </Column>
        <IconButton
          name="chevronRight"
          label={t('common.next')}
          disabled={offset >= 0}
          onPress={() => setOffset(Math.min(0, offset + 1))}
        />
      </Row>

      <SectionHeader title={t('log.subtitle')} />
      <Card padding="sm">
        {NAMAZLAR.map((slot, i) => {
          const deger = gun?.prayers[slot] ?? null;
          return (
            <View key={slot}>
              {i > 0 ? <Divider /> : null}
              <Column gap="sm" style={{ paddingVertical: theme.spacing.sm }}>
                <Text variant="bodyStrong">{label(slot)}</Text>
                <Segmented
                  // Dört uzun etiket 320 piksellik ekranda sığmıyor; kısa
                  // karşılıklar gösterilir, ekran okuyucu uzununu okur.
                  options={[
                    { value: 'none', label: t('log.notPrayed'), short: t('log.notPrayedShort') },
                    { value: 'alone', label: t('log.prayerAlone'), short: t('log.prayerAloneShort') },
                    { value: 'jamaah', label: t('log.prayerJamaah'), short: t('log.prayerJamaahShort') },
                    { value: 'qada', label: t('log.prayerQada'), short: t('log.prayerQadaShort') },
                  ]}
                  value={deger ?? 'none'}
                  onChange={(v) => setPrayer(tarih, slot, v === 'none' ? null : (v as 'alone' | 'jamaah' | 'qada'))}
                  accessibilityLabel={label(slot)}
                />
              </Column>
            </View>
          );
        })}
      </Card>

      <SectionHeader title={t('quran.title')} />
      <Card padding="sm">
        <Stepper
          title={t('log.quranMinutes')}
          value={gun?.quranMinutes ?? 0}
          min={0}
          max={600}
          step={5}
          unit={t('notification.beforeUnit')}
          onChange={(v) => setQuranMinutes(tarih, v)}
        />
      </Card>

      <SectionHeader title={t('log.fasting')} />
      <Row gap="sm" wrap>
        {orucSecenekleri.map((o) => (
          <Chip
            key={o.id}
            label={o.label}
            selected={(oruc?.kind ?? 'none') === o.id}
            onPress={() => (o.id === 'none' ? clearFast(tarih) : setFast(tarih, o.id, true))}
          />
        ))}
      </Row>

      <SectionHeader title={t('log.note')} />
      <Field
        label={t('log.note')}
        hint={t('log.noteHint')}
        value={gun?.note ?? ''}
        onChangeText={(v) => setDayNote(tarih, v)}
        multiline
      />

      <Banner tone="info" title={t('settings.privacy')} description={t('log.privateNote')} />
    </Screen>
  );
}
