/** Hicrî takvim, çevirici, dinî günler ve ay durumu — şartname §44, §45, §46. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Stepper, Segmented, Field, Banner, Badge, Divider,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, useDateFormat } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { toHijri, fromHijri, upcomingReligiousDays } from '@/features/hijri/calc';
import { useHijriMonthName, useReligiousDayName } from '@/features/hijri/labels';
import { moonState } from '@/features/moon/phase';

type Yon = 'toHijri' | 'toGregorian';

export default function HijriScreen() {
  const t = useT();
  const ayAdi = useHijriMonthName();
  const gunAdi = useReligiousDayName();
  const theme = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [yon, setYon] = useState<Yon>('toHijri');
  const [girdi, setGirdi] = useState('');

  const uzunTarih = useDateFormat({ dateStyle: 'long' });
  const ortaTarih = useDateFormat({ dateStyle: 'medium' });

  const simdi = useMemo(() => new Date(), []);
  const bugunHicri = toHijri(new Date(simdi.getTime() + settings.hijriOffset * 86400000));
  const gunler = useMemo(() => upcomingReligiousDays(simdi), [simdi]);
  const ay = moonState(simdi);

  /** "12.03.2026" veya "12 3 1447" gibi girdiyi üç sayıya ayırır. */
  const sayilar = girdi.split(/[^0-9]+/).filter(Boolean).map(Number);
  const cevrilen = useMemo(() => {
    if (sayilar.length < 3) return null;
    const [a, b, c] = sayilar as [number, number, number];
    if (yon === 'toGregorian') {
      const d = fromHijri(c, b, a);
      return d ? uzunTarih.format(d) : null;
    }
    const d = new Date(c, b - 1, a);
    if (Number.isNaN(d.getTime())) return null;
    const h = toHijri(d);
    return `${h.day} ${ayAdi(h.month)} ${h.year}`;
  }, [girdi, yon]);

  return (
    <Screen scroll motif="girih">
      <Stack.Screen options={{ headerShown: true, title: t('hijri.title') }} />

      <Card accent motif="starLattice">
        <Column gap="xs" align="center">
          <Text variant="callout" tone="onAccent">{t('hijri.today')}</Text>
          <Text variant="title1" tone="onAccent">
            {`${bugunHicri.day} ${ayAdi(bugunHicri.month)} ${bugunHicri.year}`}
          </Text>
        </Column>
      </Card>

      <Banner tone="info" title={t('hijri.title')} description={t('hijri.approxNote')} />

      <SectionHeader title={t('hijri.offset')} subtitle={t('hijri.offsetHint')} />
      <Card padding="sm">
        <Stepper
          title={t('hijri.offset')}
          value={settings.hijriOffset}
          min={-2}
          signed
          max={2}
          unit={t('moon.ageUnit')}
          onChange={(v) => update({ hijriOffset: v })}
        />
      </Card>

      <SectionHeader title={t('hijri.converter')} />
      <Column gap="md">
        <Segmented
          options={[
            { value: 'toHijri', label: t('hijri.toHijri') },
            { value: 'toGregorian', label: t('hijri.toGregorian') },
          ]}
          value={yon}
          onChange={(v) => setYon(v as Yon)}
          accessibilityLabel={t('hijri.converter')}
        />
        {/* Alan etiketi bölüm başlığının aynısıydı ("Tarih çevirici") ve
            hangi tarihin, hangi sırayla beklendiğini söylemiyordu. */}
        <Field
          label={yon === 'toHijri' ? t('hijri.inputGregorian') : t('hijri.inputHijri')}
          hint={t('hijri.inputHint')}
          value={girdi}
          onChangeText={setGirdi}
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
        />
        {cevrilen ? <Card><Text variant="title3">{cevrilen}</Text></Card> : null}
      </Column>

      <SectionHeader title={t('religiousDay.upcoming')} />
      <Card padding="sm">
        {gunler.map((g, i) => (
          <View key={g.id}>
            {i > 0 ? <Divider /> : null}
            <Row align="center" justify="space-between" style={{ paddingVertical: theme.spacing.sm }}>
              <Column flex={1} gap="xxs">
                <Text variant="bodyStrong">{gunAdi(g.id)}</Text>
                <Text variant="caption" tone="muted">
                  {uzunTarih.format(g.date)}
                </Text>
              </Column>
              <Badge
                tone={g.daysAway === 0 ? 'accent' : 'neutral'}
                label={
                  g.daysAway === 0 ? t('religiousDay.today')
                    : g.daysAway === 1 ? t('religiousDay.tomorrow')
                      : t('religiousDay.inDays', { days: g.daysAway })
                }
              />
            </Row>
          </View>
        ))}
      </Card>

      <SectionHeader title={t('moon.title')} />
      <Card>
        <Column gap="sm">
          <Row justify="space-between">
            <Text tone="muted">{t('moon.illumination')}</Text>
            <Text tone="highlight">{`%${Math.round(ay.illumination * 100)}`}</Text>
          </Row>
          <Row justify="space-between">
            <Text tone="muted">{t('moon.age')}</Text>
            <Text>{`${ay.ageDays.toFixed(1)} ${t('moon.ageUnit')}`}</Text>
          </Row>
          <Row justify="space-between">
            <Text tone="muted">{t('moon.nextNew')}</Text>
            <Text>{ortaTarih.format(ay.nextNewMoon)}</Text>
          </Row>
          <Row justify="space-between">
            <Text tone="muted">{t('moon.nextFull')}</Text>
            <Text>{ortaTarih.format(ay.nextFullMoon)}</Text>
          </Row>
          <Text variant="micro" tone="subtle">{t('moon.approxNote')}</Text>
        </Column>
      </Card>
    </Screen>
  );
}
