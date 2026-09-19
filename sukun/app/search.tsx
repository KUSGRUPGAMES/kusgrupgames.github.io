/** Global arama — şartname §51. */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Screen, Field, Card, Column, Row, Text, Badge, EmptyState, Banner, VirtualList,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { globalSearch, type ResultKind } from '@/features/search/global';
import { getSurahs, searchArabic, searchTranslation } from '@/features/quran/data';

export default function SearchScreen() {
  const t = useT();
  const theme = useTheme();
  const [sorgu, setSorgu] = useState('');

  const deps = useMemo(() => ({
    surahs: getSurahs().map((s) => ({
      number: s.number, nameTr: s.nameTr, nameAr: s.nameAr, ayahCount: s.ayahCount,
    })),
    searchAyahs: (q: string, limit: number) =>
      searchArabic(q, limit).map((h) => ({
        surah: h.ayah.surah, ayah: h.ayah.ayah, surahName: h.surahName,
      })),
    searchTranslations: (q: string, limit: number) =>
      searchTranslation(q, limit).map((h) => ({
        surah: h.surah, ayah: h.ayah, surahName: h.surahName, body: h.body,
      })),
  }), []);

  const sonuclar = useMemo(() => globalSearch(sorgu, deps, 40), [sorgu, deps]);

  const etiket = (kind: ResultKind) => {
    switch (kind) {
      case 'surah': return t('search.kindSurah');
      case 'ayahRef': case 'ayahText': case 'translation': return t('search.kindAyah');
      case 'dua': return t('search.kindDua');
      case 'name': return t('search.kindName');
      case 'knowledge': return t('search.kindKnowledge');
    }
  };

  return (
    <Screen motif="girih">
      <Stack.Screen options={{ headerShown: true, title: t('search.title') }} />

      <Field
        label={t('common.search')}
        hint={t('search.hint')}
        value={sorgu}
        onChangeText={setSorgu}
        autoCorrect={false}
        autoFocus
      />

      {sorgu.trim().length >= 2 ? (
        sonuclar.length === 0 ? (
          <EmptyState icon="search" title={t('quran.noResults')} description={t('search.hint')} />
        ) : (
          <View style={{ flex: 1, marginTop: theme.spacing.md }}>
            <VirtualList
              data={sonuclar}
              keyExtractor={(r, i) => `${r.kind}-${r.href}-${i}`}
              separators={false}
              header={
                <Text variant="caption" tone="muted" style={{ paddingBottom: theme.spacing.sm }}>
                  {t('search.results', { count: sonuclar.length })}
                </Text>
              }
              renderItem={(r) => (
                <Card onPress={() => router.push(r.href as never)} style={{ marginBottom: theme.spacing.md }}>
                  <Column gap="xs">
                    <Row gap="sm" align="center">
                      <Badge label={etiket(r.kind)} tone="neutral" />
                      <Text variant="bodyStrong" style={{ flex: 1 }}>{r.title}</Text>
                    </Row>
                    {r.subtitle ? <Text variant="caption" tone="muted" lines={2}>{r.subtitle}</Text> : null}
                  </Column>
                </Card>
              )}
            />
          </View>
        )
      ) : (
        <Banner tone="info" title={t('search.title')} description={t('search.hint')} />
      )}
    </Screen>
  );
}
