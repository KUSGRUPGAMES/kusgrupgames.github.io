/** İbadet defteri ve oruç takibi — şartname §42, §49. */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Segmented, Stepper,
  Field, Banner, IconButton, Button, Divider, Chip,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useDateFormat } from '@/lib/i18n';
import { useWorshipStore, type QadaSlot, type FastKind, type WorshipDay, type FastDay } from '@/store/worship';
import { useLocationStore } from '@/store/locations';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { dateKey } from '@/features/dhikr/stats';
import { zonedNow } from '@/lib/time/zone';

type NamazSlot = Exclude<QadaSlot, 'witr'>;
const NAMAZLAR: NamazSlot[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Ekrandaki her değişiklik doğrudan depoya yazılıyordu: sayfalar arası
 * gezinirken yanlışlıkla dokunulan bir alan hemen kaydediliyordu, "Kaydet"
 * demeden önceki kaydı bozabiliyordu. Artık değişiklikler yalnız bu yerel
 * taslakta tutulur; "Kaydet"e basılmadan depoya yazılmaz, tarihten
 * uzaklaşınca da sessizce bırakılır — önceki kayıt her durumda korunur.
 */
interface Taslak {
  prayers: Partial<Record<NamazSlot, 'alone' | 'jamaah' | 'qada'>>;
  quranMinutes: number;
  note: string;
  fastKind: FastKind | 'none';
}

function taslakOlustur(gun: WorshipDay | undefined, oruc: FastDay | undefined): Taslak {
  return {
    prayers: { ...(gun?.prayers ?? {}) },
    quranMinutes: gun?.quranMinutes ?? 0,
    note: gun?.note ?? '',
    fastKind: oruc?.kind ?? 'none',
  };
}

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

  const [taslak, setTaslak] = useState<Taslak>(() => taslakOlustur(gun, oruc));
  const [kaydedildi, setKaydedildi] = useState(false);

  // Tarih değişince taslak o günün kayıtlı hâline sıfırlanır — önceki
  // tarihte kaydedilmemiş bir değişiklik varsa sessizce bırakılır, depoya
  // hiç yazılmadığı için zaten bir kaydı bozmuyordu.
  useEffect(() => {
    setTaslak(taslakOlustur(gun, oruc));
    setKaydedildi(false);
  }, [tarih]);

  const setTaslakPrayer = (slot: NamazSlot, value: 'alone' | 'jamaah' | 'qada' | null) => {
    setTaslak((onceki) => {
      const prayers = { ...onceki.prayers };
      if (value === null) delete prayers[slot];
      else prayers[slot] = value;
      return { ...onceki, prayers };
    });
    setKaydedildi(false);
  };

  const kaydet = () => {
    for (const slot of NAMAZLAR) setPrayer(tarih, slot, taslak.prayers[slot] ?? null);
    setQuranMinutes(tarih, taslak.quranMinutes);
    setDayNote(tarih, taslak.note);
    if (taslak.fastKind === 'none') clearFast(tarih);
    else setFast(tarih, taslak.fastKind, true);
    setKaydedildi(true);
  };

  const gosterim = tamTarih.format(new Date(`${tarih}T12:00:00Z`));

  const orucSecenekleri: { id: FastKind | 'none'; label: string }[] = [
    { id: 'none', label: t('log.fastNone') },
    { id: 'ramadan', label: t('log.fastRamadan') },
    { id: 'qada', label: t('log.fastQada') },
    { id: 'nafile', label: t('log.fastNafile') },
  ];

  return (
    <Screen scroll motif="girih">
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
          const deger = taslak.prayers[slot] ?? null;
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
                  onChange={(v) => setTaslakPrayer(slot, v === 'none' ? null : (v as 'alone' | 'jamaah' | 'qada'))}
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
          value={taslak.quranMinutes}
          min={0}
          max={600}
          step={5}
          unit={t('notification.beforeUnit')}
          onChange={(v) => { setTaslak((onceki) => ({ ...onceki, quranMinutes: v })); setKaydedildi(false); }}
        />
      </Card>

      <SectionHeader title={t('log.fasting')} />
      <Row gap="sm" wrap>
        {orucSecenekleri.map((o) => (
          <Chip
            key={o.id}
            label={o.label}
            selected={taslak.fastKind === o.id}
            onPress={() => { setTaslak((onceki) => ({ ...onceki, fastKind: o.id })); setKaydedildi(false); }}
          />
        ))}
      </Row>

      <SectionHeader title={t('log.note')} />
      <Field
        label={t('log.note')}
        hint={t('log.noteHint')}
        value={taslak.note}
        onChangeText={(v) => { setTaslak((onceki) => ({ ...onceki, note: v })); setKaydedildi(false); }}
        multiline
      />

      <Row style={{ marginTop: theme.spacing.lg }}>
        <Button label={t('log.save')} icon="check" onPress={kaydet} />
      </Row>
      {kaydedildi ? <Banner tone="success" title={t('log.saved')} /> : null}

      <Banner tone="info" title={t('settings.privacy')} description={t('log.privateNote')} />
    </Screen>
  );
}
