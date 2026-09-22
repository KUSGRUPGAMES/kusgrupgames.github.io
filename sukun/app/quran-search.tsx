/** Kur'an araması — şartname §35, §78. */
import React, { useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import {
  Screen, Field, Card, Column, Row, Text, ArabicText, Badge, Segmented, EmptyState, SourceNote,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { searchArabic, searchTranslation, getSource, getTranslationInfo } from '@/features/quran/data';
import { useSettingsStore } from '@/store/settings';

export default function QuranSearchScreen() {
  const t = useT();
  const theme = useTheme();
  const [sorgu, setSorgu] = useState('');
  const [nerede, setNerede] = useState<'both' | 'arabic' | 'translation'>('both');
  const settings = useSettingsStore((s) => s.settings);
  const kaynak = useMemo(() => getSource(), []);
  const mealKunye = useMemo(() => getTranslationInfo(), []);

  const arapca = useMemo(
    () => (nerede !== 'translation' && sorgu.trim().length >= 2 ? searchArabic(sorgu, 40) : []),
    [sorgu, nerede],
  );
  const meal = useMemo(
    () => (nerede !== 'arabic' && sorgu.trim().length >= 3 ? searchTranslation(sorgu, 40) : []),
    [sorgu, nerede],
  );
  const sonuclar = useMemo(() => [
    ...meal.map((m) => ({
      key: `m-${m.surah}:${m.ayah}`, surah: m.surah, ayah: m.ayah,
      surahName: m.surahName, body: m.body, arabic: null as string | null, juz: 0,
    })),
    ...arapca.map((h) => ({
      key: `a-${h.ayah.surah}:${h.ayah.ayah}`, surah: h.ayah.surah, ayah: h.ayah.ayah,
      surahName: h.surahName, body: null as string | null, arabic: h.ayah.text, juz: h.ayah.juz,
    })),
  ], [arapca, meal]);

  return (
    <Screen scroll motif="girih">
      <Stack.Screen options={{ headerShown: true, title: t('common.search') }} />

      <Field
        label={t('quran.searchArabic')}
        hint={t('quran.searchHint')}
        value={sorgu}
        onChangeText={setSorgu}
        autoCorrect={false}
      />

      <Segmented
        options={[
          { value: 'both', label: t('quran.searchBoth') },
          { value: 'arabic', label: t('quran.searchArabicOnly') },
          { value: 'translation', label: t('quran.searchTranslationOnly') },
        ]}
        value={nerede}
        onChange={(v) => setNerede(v as 'both' | 'arabic' | 'translation')}
        label={t('quran.searchIn')}
      />

      {sorgu.trim().length >= 2 ? (
        sonuclar.length === 0 ? (
          <EmptyState icon="search" title={t('quran.noResults')} description={t('quran.searchHint')} />
        ) : (
          <Column gap="md" style={{ marginTop: theme.spacing.md }}>
            <Text variant="caption" tone="muted">{t('quran.searchResults', { count: sonuclar.length })}</Text>
            {sonuclar.map((h) => (
              <Card
                key={h.key}
                onPress={() => router.push(`/reader?surah=${h.surah}&ayah=${h.ayah}`)}
              >
                <Column gap="sm">
                  <Row align="center" gap="sm">
                    <Badge label={`${h.surahName} ${h.ayah}`} tone="neutral" />
                  </Row>
                  {h.arabic ? (
                    <ArabicText scale={Math.min(1.2, settings.quran.fontScale)} size="small">
                      {h.arabic}
                    </ArabicText>
                  ) : null}
                  {h.body ? <Text variant="body" tone="muted" lines={3}>{h.body}</Text> : null}
                </Column>
              </Card>
            ))}
          </Column>
        )
      ) : null}

      <SourceNote source={kaynak.name} license={kaynak.metadataLicense} />
      <SourceNote source={t('quran.translationSource', { name: mealKunye.name, rights: t('quran.publicDomain') })} />
    </Screen>
  );
}
