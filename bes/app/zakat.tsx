/** Zekât hesaplama — şartname §43. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, Field, Segmented, Banner, Divider,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import {
  calculateZakat, fitrahTotal, emptyZakatInput,
  ZAKAT_METHOD_NOTE, type NisabBasis, type ZakatInput,
} from '@/features/zakat/calc';

type SayiAlan = keyof ZakatInput;

export default function ZakatScreen() {
  const t = useT();
  const theme = useTheme();
  const [alanlar, setAlanlar] = useState<Record<string, string>>({});
  const [basis, setBasis] = useState<NisabBasis>('gold');
  const [altinFiyat, setAltinFiyat] = useState('');
  const [gumusFiyat, setGumusFiyat] = useState('');
  const [fitreKisi, setFitreKisi] = useState('');
  const [fitreTutar, setFitreTutar] = useState('');

  const sayi = (v: string | undefined) => {
    const n = Number((v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const girdi: ZakatInput = useMemo(() => ({
    ...emptyZakatInput,
    cash: sayi(alanlar.cash),
    foreignCurrency: sayi(alanlar.foreignCurrency),
    goldGrams: sayi(alanlar.goldGrams),
    silverGrams: sayi(alanlar.silverGrams),
    investments: sayi(alanlar.investments),
    tradeGoods: sayi(alanlar.tradeGoods),
    receivables: sayi(alanlar.receivables),
    debts: sayi(alanlar.debts),
    essentialNeeds: sayi(alanlar.essentialNeeds),
  }), [alanlar]);

  const sonuc = useMemo(
    () => calculateZakat(girdi, { goldPerGram: sayi(altinFiyat), silverPerGram: sayi(gumusFiyat) }, basis),
    [girdi, altinFiyat, gumusFiyat, basis],
  );

  const para = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

  const alan = (key: SayiAlan, etiket: string) => (
    <Field
      key={key}
      label={etiket}
      value={alanlar[key] ?? ''}
      onChangeText={(v) => setAlanlar({ ...alanlar, [key]: v })}
      keyboardType="decimal-pad"
    />
  );

  return (
    <Screen scroll motif="octagonGrid">
      <Stack.Screen options={{ headerShown: true, title: t('zakat.title') }} />

      <SectionHeader title={t('zakat.prices')} subtitle={t('zakat.priceHint')} />
      <Column gap="md">
        <Field label={t('zakat.goldPrice')} value={altinFiyat} onChangeText={setAltinFiyat} keyboardType="decimal-pad" />
        <Field label={t('zakat.silverPrice')} value={gumusFiyat} onChangeText={setGumusFiyat} keyboardType="decimal-pad" />
        <Segmented
          options={[
            { value: 'gold', label: t('zakat.basisGold') },
            { value: 'silver', label: t('zakat.basisSilver') },
          ]}
          value={basis}
          onChange={(v) => setBasis(v as NisabBasis)}
          label={t('zakat.basis')}
        />
      </Column>

      <SectionHeader title={t('zakat.assets')} />
      <Column gap="md">
        {alan('cash', t('zakat.cash'))}
        {alan('foreignCurrency', t('zakat.foreign'))}
        {alan('goldGrams', t('zakat.gold'))}
        {alan('silverGrams', t('zakat.silver'))}
        {alan('investments', t('zakat.investments'))}
        {alan('tradeGoods', t('zakat.tradeGoods'))}
        {alan('receivables', t('zakat.receivables'))}
      </Column>

      <SectionHeader title={t('zakat.deductions')} />
      <Column gap="md">
        {alan('debts', t('zakat.debts'))}
        {alan('essentialNeeds', t('zakat.essential'))}
      </Column>

      <Card accent motif="starLattice" style={{ marginTop: theme.spacing.xl }}>
        <Column gap="sm">
          <Row justify="space-between">
            <Text tone="onAccent">{t('zakat.nisab')}</Text>
            <Text tone="onAccent">{para(sonuc.nisabValue)}</Text>
          </Row>
          <Row justify="space-between">
            <Text tone="onAccent">{t('zakat.net')}</Text>
            <Text tone="onAccent">{para(sonuc.netWealth)}</Text>
          </Row>
          <Divider />
          {sonuc.liable ? (
            <Column gap="xxs" align="center">
              <Text variant="caption" tone="onAccent">{t('zakat.due')}</Text>
              <Text variant="title1" tone="onAccent">{para(sonuc.zakatDue)}</Text>
            </Column>
          ) : (
            <Column gap="xxs" align="center">
              <Text variant="bodyStrong" tone="onAccent">{t('zakat.notLiable')}</Text>
              {sonuc.remainingToNisab > 0 ? (
                <Text variant="caption" tone="onAccent">
                  {t('zakat.remainingToNisab', { amount: para(sonuc.remainingToNisab) })}
                </Text>
              ) : null}
            </Column>
          )}
        </Column>
      </Card>

      <SectionHeader title={t('zakat.fitrah')} />
      <Column gap="md">
        <Field label={t('zakat.fitrahPerPerson')} value={fitreTutar} onChangeText={setFitreTutar} keyboardType="decimal-pad" />
        <Field label={t('zakat.fitrahPeople')} value={fitreKisi} onChangeText={setFitreKisi} keyboardType="number-pad" />
        <Card>
          <Row justify="space-between">
            <Text tone="muted">{t('zakat.fitrahTotal')}</Text>
            <Text variant="title3" tone="highlight">
              {para(fitrahTotal(sayi(fitreTutar), sayi(fitreKisi)))}
            </Text>
          </Row>
        </Card>
      </Column>

      <View style={{ marginTop: theme.spacing.lg }}>
        <Banner tone="info" title={t('zakat.method')} description={ZAKAT_METHOD_NOTE} />
      </View>
    </Screen>
  );
}
