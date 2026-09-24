/** Özel hatırlatıcılar — şartname §64. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Field, Button, Chip,
  Segmented, Stepper, Toggle, EmptyState, IconButton, Banner, Divider,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, type StringKey } from '@/lib/i18n';
import { useWorshipStore } from '@/store/worship';
import { usePrayerLabel } from '@/features/prayer/components/PrayerList';
import { describeTrigger, type ReminderTrigger } from '@/features/notifications/reminders';
import { PRAYER_KEYS, type PrayerKey } from '@/features/prayer/methods';

/** Dizin = JavaScript `getDay()` (0 = Pazar). Kayıtta bu sayı durur. */
const GUN_ANAHTARI: StringKey[] = [
  'weekday.0', 'weekday.1', 'weekday.2', 'weekday.3', 'weekday.4', 'weekday.5', 'weekday.6',
];

/**
 * Ekranda gösterim sırası: **Pazartesi'den** başlar.
 *
 * Çipler `getDay()` sırasıyla diziliyordu, yani hafta Pazar'la başlıyordu —
 * Türkiye'de takvim Pazartesi'yle başlar ve kısaltmalarda "Paz"ı ilk sırada
 * görmek Pazartesi sanılıyor. Saklanan değer değişmiyor, yalnız sıra.
 */
const GUN_SIRASI = [1, 2, 3, 4, 5, 6, 0] as const;

/**
 * Tek dokunuşla doldurulan hazır hatırlatıcılar. Kullanıcı ad, saat ve
 * vakti sonradan değiştirebilir; şablon yalnız formu doldurur.
 */
const SABLONLAR: { ad: StringKey; tetik: ReminderTrigger; gunler?: number[] }[] = [
  { ad: 'reminder.tplQuran', tetik: { kind: 'time', hour: 21, minute: 0 } },
  { ad: 'reminder.tplMorning', tetik: { kind: 'prayer', slot: 'fajr', offsetMinutes: 30 } },
  { ad: 'reminder.tplEvening', tetik: { kind: 'prayer', slot: 'maghrib', offsetMinutes: 15 } },
  { ad: 'reminder.tplDuha', tetik: { kind: 'prayer', slot: 'sunrise', offsetMinutes: 45 } },
  { ad: 'reminder.tplTahajjud', tetik: { kind: 'prayer', slot: 'fajr', offsetMinutes: -60 } },
  { ad: 'reminder.tplKahf', tetik: { kind: 'time', hour: 10, minute: 0 }, gunler: [5] },
];

export default function RemindersScreen() {
  const t = useT();
  const theme = useTheme();
  const label = usePrayerLabel();
  const reminders = useWorshipStore((s) => s.reminders);
  const add = useWorshipStore((s) => s.addReminder);
  const update = useWorshipStore((s) => s.updateReminder);
  const remove = useWorshipStore((s) => s.removeReminder);

  const [ad, setAd] = useState('');
  const [tur, setTur] = useState<'time' | 'prayer'>('time');
  const [saat, setSaat] = useState(21);
  const [dakika, setDakika] = useState(0);
  const [slot, setSlot] = useState<PrayerKey>('maghrib');
  const [offset, setOffset] = useState(-30);
  const [gunler, setGunler] = useState<number[]>([]);
  const [eklendi, setEklendi] = useState(false);

  const sablonUygula = (s: (typeof SABLONLAR)[number]) => {
    setAd(t(s.ad));
    setTur(s.tetik.kind);
    if (s.tetik.kind === 'time') { setSaat(s.tetik.hour); setDakika(s.tetik.minute); }
    else { setSlot(s.tetik.slot); setOffset(s.tetik.offsetMinutes); }
    setGunler(s.gunler ?? []);
    setEklendi(false);
  };

  const tetik: ReminderTrigger = useMemo(
    () => (tur === 'time'
      ? { kind: 'time', hour: saat, minute: dakika }
      : { kind: 'prayer', slot, offsetMinutes: offset }),
    [tur, saat, dakika, slot, offset],
  );

  const anlat = (r: { trigger: ReminderTrigger }) =>
    r.trigger.kind === 'time'
      ? describeTrigger(r.trigger)
      : `${label(r.trigger.slot)} ${r.trigger.offsetMinutes > 0 ? '+' : ''}${r.trigger.offsetMinutes}`;

  return (
    <Screen topInset={false} scroll motif="octagonGrid">
      <Stack.Screen options={{ headerShown: true, title: t('reminder.title') }} />


      {reminders.length === 0 ? (
        <EmptyState icon="bell" title={t('reminder.none')} description={t('reminder.emptyBody')} />
      ) : (
        <Card padding="sm">
          {reminders.map((r, i) => (
            <View key={r.id}>
              {i > 0 ? <Divider /> : null}
              <Row align="center" gap="md" style={{ paddingVertical: theme.spacing.sm }}>
                <Column flex={1} gap="xxs">
                  <Text variant="bodyStrong">{r.title}</Text>
                  <Text variant="caption" tone="muted">
                    {`${anlat(r)} · ${r.weekdays.length === 0 ? t('reminder.everyDay') : GUN_SIRASI.filter((d) => r.weekdays.includes(d)).map((d) => t(GUN_ANAHTARI[d]!)).join(' ')}`}
                  </Text>
                </Column>
                <Toggle
                  title={r.title}
                  value={r.enabled}
                  onChange={(v) => update(r.id, { enabled: v })}
                />
                <IconButton name="close" label={t('common.delete')} size={18} onPress={() => remove(r.id)} />
              </Row>
            </View>
          ))}
        </Card>
      )}

      <SectionHeader title={t('reminder.add')} subtitle={t('reminder.templatesHint')} />
      <Row gap="sm" wrap style={{ marginBottom: theme.spacing.md }}>
        {SABLONLAR.map((s) => (
          <Chip key={s.ad} label={t(s.ad)} selected={ad === t(s.ad)} onPress={() => sablonUygula(s)} />
        ))}
      </Row>
      <Column gap="md">
        <Field label={t('reminder.name')} value={ad} onChangeText={setAd} />

        <Segmented
          options={[
            { value: 'time', label: t('reminder.kindTime') },
            { value: 'prayer', label: t('reminder.kindPrayer') },
          ]}
          value={tur}
          onChange={(v) => setTur(v as 'time' | 'prayer')}
          label={t('reminder.kind')}
        />

        {tur === 'time' ? (
          <Card padding="sm">
            <Stepper title={t('reminder.hour')} value={saat} min={0} max={23} onChange={setSaat} />
            <Stepper title={t('reminder.minute')} value={dakika} min={0} max={55} step={5} onChange={setDakika} />
          </Card>
        ) : (
          <Column gap="md">
            <Row gap="sm" wrap>
              {PRAYER_KEYS.map((k) => (
                <Chip key={k} label={label(k)} selected={slot === k} onPress={() => setSlot(k)} />
              ))}
            </Row>
            <Card padding="sm">
              <Stepper
                title={t('reminder.offset')}
                subtitle={t('reminder.offsetHint')}
                value={offset}
                min={-120}
                signed
                max={120}
                step={5}
                unit={t('notification.beforeUnit')}
                onChange={setOffset}
              />
            </Card>
          </Column>
        )}

        <Text variant="caption" tone="muted">{t('reminder.weekdays')}</Text>
        <Row gap="sm" wrap>
          <Chip
            label={t('reminder.everyDay')}
            selected={gunler.length === 0}
            onPress={() => setGunler([])}
          />
          {GUN_SIRASI.map((gun) => (
            <Chip
              key={gun}
              label={t(GUN_ANAHTARI[gun]!)}
              selected={gunler.includes(gun)}
              onPress={() => setGunler(
                gunler.includes(gun) ? gunler.filter((g) => g !== gun) : [...gunler, gun].sort(),
              )}
            />
          ))}
        </Row>

        <Row>
          <Button
            label={t('reminder.add')}
            icon="plus"
            disabled={ad.trim().length === 0}
            onPress={() => {
              add({ title: ad.trim(), trigger: tetik, weekdays: gunler, enabled: true });
              setAd('');
              setGunler([]);
              setEklendi(true);
            }}
          />
        </Row>
        {eklendi ? <Banner tone="success" title={t('reminder.added')} /> : null}
      </Column>

      <Banner tone="info" title={t('notification.title')} description={t('notification.coverageNote')} />
    </Screen>
  );
}
