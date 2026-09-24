/**
 * Kur'an ana ekranı — şartname §27, §29, §30, §80.
 *
 * Sure ve cüz listeleri sanallaştırılmıştır: 114 satırı tek seferde çizmek
 * hem açılışı hem tema değişimini yavaşlatıyordu.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  Screen, SectionHeader, Card, ListItem, Segmented, Row, Column, Text,
  Badge, Button, EmptyState, SourceNote, VirtualList,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { getSurahs, getJuzStarts, getSource, type SurahMeta } from '@/features/quran/data';
import { useSurahName } from '@/features/quran/names';
import { useReadingStore, type Bookmark } from '@/store/reading';

type Sekme = 'surahs' | 'juz' | 'bookmarks';

const SATIR_YUKSEKLIGI = 68;

export default function QuranScreen() {
  const t = useT();
  const theme = useTheme();
  const [sekme, setSekme] = useState<Sekme>('surahs');
  const position = useReadingStore((s) => s.position);
  const bookmarks = useReadingStore((s) => s.bookmarks);

  const sureler = useMemo(() => getSurahs(), []);
  const cuzler = useMemo(() => getJuzStarts(), []);
  const kaynak = useMemo(() => getSource(), []);

  // Ad dile göre gelir: Arapça arayüzde `nameAr`, diğerlerinde `nameTr`.
  const adiGoster = useSurahName();
  const sureAdi = useCallback(
    (n: number) => adiGoster(sureler.find((s) => s.number === n), String(n)),
    [sureler, adiGoster],
  );

  const sureSatiri = useCallback((s: SurahMeta) => (
    <ListItem
      title={`${s.number}. ${adiGoster(s)}`}
      subtitle={`${t('quran.ayahCount', { count: s.ayahCount })} · ${s.revelation === 'mekki' ? t('quran.mekki') : t('quran.medeni')}`}
      value={s.nameAr === adiGoster(s) ? s.nameTr : s.nameAr}
      onPress={() => router.push(`/reader?surah=${s.number}&ayah=1`)}
    />
  ), [t, adiGoster]);

  const cuzSatiri = useCallback((c: { juz: number; surah: number; ayah: number }) => (
    <ListItem
      title={t('quran.juzNo', { n: c.juz })}
      subtitle={`${sureAdi(c.surah)} ${c.ayah}`}
      onPress={() => router.push(`/reader?surah=${c.surah}&ayah=${c.ayah}`)}
    />
  ), [t, adiGoster]);

  const yerImiSatiri = useCallback((b: Bookmark) => (
    <ListItem
      title={`${sureAdi(b.surah)} ${b.ayah}`}
      {...(b.note ? { subtitle: b.note } : {})}
      right={<Badge label={b.color} tone="neutral" />}
      onPress={() => router.push(`/reader?surah=${b.surah}&ayah=${b.ayah}`)}
    />
  ), [sureAdi]);

  /** Liste üstünde duran, kaydırmayla birlikte hareket eden bölüm. */
  const baslik = (
    <Column gap="md" style={{ paddingBottom: theme.spacing.md }}>
      <SectionHeader title={t('quran.title')} />

      {position ? (
        <Card
          accent
          onPress={() => router.push(`/reader?surah=${position.surah}&ayah=${position.ayah}`)}
        >
          <Column gap="xs">
            <Text variant="caption" tone="onAccent">{t('quran.continue')}</Text>
            <Text variant="title3" tone="onAccent">
              {t('quran.continueAt', { surah: sureAdi(position.surah), ayah: position.ayah })}
            </Text>
          </Column>
        </Card>
      ) : null}

      <Row gap="sm">
        <Button
          label={t('common.search')}
          icon="search"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/quran-search')}
        />
        <Button
          label={t('audio.title')}
          icon="play"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/recitation')}
        />
      </Row>

      <Segmented
        options={[
          { value: 'surahs', label: t('quran.surahs') },
          { value: 'juz', label: t('quran.juz') },
          { value: 'bookmarks', label: t('quran.bookmarks') },
        ]}
        value={sekme}
        onChange={(v) => setSekme(v as Sekme)}
        accessibilityLabel={t('quran.title')}
      />
    </Column>
  );

  const kunye = (
    <Column gap="xs" style={{ paddingTop: theme.spacing.lg }}>
      <SourceNote source={kaynak.name} license={kaynak.metadataLicense} />
      <Text variant="micro" tone="subtle">{t('quran.sourceNote')}</Text>
    </Column>
  );

  return (
    <Screen motif="girih" padding="lg">
      <View style={{ flex: 1 }}>
        {sekme === 'surahs' ? (
          <VirtualList
            data={sureler}
            keyExtractor={(s) => String(s.number)}
            renderItem={sureSatiri}
            itemHeight={SATIR_YUKSEKLIGI}
            header={baslik}
            footer={kunye}
          />
        ) : null}

        {sekme === 'juz' ? (
          <VirtualList
            data={cuzler}
            keyExtractor={(c) => String(c.juz)}
            renderItem={cuzSatiri}
            itemHeight={SATIR_YUKSEKLIGI}
            header={baslik}
            footer={kunye}
          />
        ) : null}

        {sekme === 'bookmarks' ? (
          <VirtualList
            data={bookmarks}
            keyExtractor={(b) => b.id}
            renderItem={yerImiSatiri}
            itemHeight={SATIR_YUKSEKLIGI}
            header={baslik}
            footer={kunye}
            empty={
              <EmptyState icon="bookmark" title={t('quran.noBookmarks')} description={t('empty.body')} />
            }
          />
        ) : null}
      </View>
    </Screen>
  );
}
