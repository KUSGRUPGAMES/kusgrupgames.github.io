/**
 * Kur'an okuma eğitimi — elifbâdan kısa surelere, adım adım.
 * Harf ve harekeler bu uygulamada seslendirilmiyor (bkz. detay ekranındaki
 * uyarı); pratik bölümü ise gerçek kıraat sesiyle çalışan okuyucuya bağlanır.
 */
import React, { useMemo } from 'react';
import { router, Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, ArabicText, ListItem, ProgressBar, Icon, Banner,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useLearningStore } from '@/store/learning';
import { ARABIC_ALPHABET } from '@/content/arabicAlphabet';
import { HAREKAT } from '@/content/harekat';
import { getSurah } from '@/features/quran/data';

/** Amme cüzünden, elifbâyı yeni bitiren biri için uygun kısa sureler. */
const PRATIK_SURELER = [1, 112, 113, 114, 108, 103, 110, 107];

export default function QuranLearnScreen() {
  const t = useT();
  const theme = useTheme();
  const items = useLearningStore((s) => s.items);

  const ogrenilenHarfler = useMemo(
    () => new Set(items.filter((i) => i.kind === 'letter').map((i) => i.recordId)),
    [items],
  );
  const ogrenilenHarekeler = useMemo(
    () => new Set(items.filter((i) => i.kind === 'harake').map((i) => i.recordId)),
    [items],
  );

  return (
    <Screen scroll motif="girih">
      <Stack.Screen options={{ headerShown: true, title: t('learn.title') }} />

      <Text variant="body" tone="muted">{t('learn.subtitle')}</Text>

      <SectionHeader
        title={t('learn.letters')}
        subtitle={t('learn.letterProgress', { done: ogrenilenHarfler.size, total: ARABIC_ALPHABET.length })}
      />
      <ProgressBar
        value={ogrenilenHarfler.size / ARABIC_ALPHABET.length}
        height={8}
        accessibilityLabel={t('learn.letters')}
      />
      <Row gap="sm" wrap style={{ marginTop: theme.spacing.sm }}>
        {ARABIC_ALPHABET.map((harf) => {
          const ogrenildi = ogrenilenHarfler.has(harf.id);
          return (
            <Card
              key={harf.id}
              padding="sm"
              style={{ width: 78 }}
              onPress={() => router.push(`/quran-learn-item?kind=letter&id=${harf.id}`)}
              accessibilityLabel={harf.name}
            >
              <Column align="center" gap="xxs">
                <ArabicText size="small">{harf.letter}</ArabicText>
                <Text variant="micro" tone={ogrenildi ? 'accent' : 'muted'}>{harf.name}</Text>
                {ogrenildi ? <Icon name="check" size={14} color={theme.colors.accent} /> : null}
              </Column>
            </Card>
          );
        })}
      </Row>

      <SectionHeader
        title={t('learn.harakat')}
        subtitle={t('learn.harakatProgress', { done: ogrenilenHarekeler.size, total: HAREKAT.length })}
      />
      <Card padding="sm">
        {HAREKAT.map((hareke, i) => {
          const ogrenildi = ogrenilenHarekeler.has(hareke.id);
          return (
            <ListItem
              key={hareke.id}
              title={hareke.name}
              subtitle={hareke.example}
              icon={ogrenildi ? 'check' : undefined}
              onPress={() => router.push(`/quran-learn-item?kind=harake&id=${hareke.id}`)}
              style={i > 0 ? { borderTopWidth: 1, borderTopColor: theme.colors.border } : undefined}
            />
          );
        })}
      </Card>

      <SectionHeader title={t('learn.practice')} />
      <Text variant="body" tone="muted">{t('learn.practiceBody')}</Text>
      <Card padding="sm" style={{ marginTop: theme.spacing.sm }}>
        {PRATIK_SURELER.map((no, i) => {
          const sure = getSurah(no);
          if (!sure) return null;
          return (
            <ListItem
              key={no}
              title={sure.nameTr}
              value={`${sure.ayahCount}`}
              icon="book"
              onPress={() => router.push(`/reader?surah=${no}&ayah=1`)}
              style={i > 0 ? { borderTopWidth: 1, borderTopColor: theme.colors.border } : undefined}
            />
          );
        })}
      </Card>

      <Banner tone="info" title={t('learn.disclaimer')} />
    </Screen>
  );
}
