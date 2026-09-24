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
  Badge, Button, EmptyState, SourceNote, VirtualList, PageHeader, Icon,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { getSurahs, getJuzStarts, getSource, type SurahMeta } from '@/features/quran/data';
import { useSurahName } from '@/features/quran/names';
import { useReadingStore, type Bookmark } from '@/store/reading';

type Sekme = 'surahs' | 'juz' | 'bookmarks';

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
    <Card padding="md" onPress={() => router.push(`/reader?surah=${s.number}&ayah=1`)}
      accessibilityLabel={`${s.number}. ${adiGoster(s)}`}
      style={{ marginBottom: theme.spacing.sm }}>
      <Row align="center" gap="md" style={{ minHeight: 60 }}>
        <View style={{ width: 42, height: 42, borderWidth: 1,
          borderColor: theme.colors.bezemeSolgun, borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceRaised,
          alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="bodyStrong" tone="highlight">{s.number}</Text>
        </View>
        <Column flex={1} gap="xxs">
          <Text variant="bodyStrong" lines={1}>{adiGoster(s)}</Text>
          <Text variant="caption" tone="muted" lines={1}>
            {`${t('quran.ayahCount', { count: s.ayahCount })} · ${s.revelation === 'mekki' ? t('quran.mekki') : t('quran.medeni')}`}
          </Text>
        </Column>
        <Text variant="callout" tone="muted" lines={1}
          style={{ maxWidth: '27%', textAlign: 'right' }}>
          {s.nameAr === adiGoster(s) ? s.nameTr : s.nameAr}
        </Text>
        <Icon name="chevronRight" size={16} color={theme.colors.highlight} />
      </Row>
    </Card>
  ), [t, adiGoster, theme]);

  const cuzSatiri = useCallback((c: { juz: number; surah: number; ayah: number }) => (
    <Card padding="sm" style={{ marginBottom: theme.spacing.sm }}>
      <ListItem title={t('quran.juzNo', { n: c.juz })} icon="book"
        subtitle={`${sureAdi(c.surah)} ${c.ayah}`}
        onPress={() => router.push(`/reader?surah=${c.surah}&ayah=${c.ayah}`)} />
    </Card>
  ), [t, sureAdi, theme]);

  const yerImiSatiri = useCallback((b: Bookmark) => (
    <Card padding="sm" style={{ marginBottom: theme.spacing.sm }}><ListItem
      title={`${sureAdi(b.surah)} ${b.ayah}`}
      {...(b.note ? { subtitle: b.note } : {})}
      right={<Badge label={b.color} tone="neutral" />}
      onPress={() => router.push(`/reader?surah=${b.surah}&ayah=${b.ayah}`)}
    /></Card>
  ), [sureAdi, theme]);

  /** Liste üstünde duran, kaydırmayla birlikte hareket eden bölüm. */
  const baslik = (
    <Column gap="md" style={{ paddingBottom: theme.spacing.md }}>
      <PageHeader title={t('quran.title')} icon="book" />

      {position ? (
        <Card
          accent
          onPress={() => router.push(`/reader?surah=${position.surah}&ayah=${position.ayah}`)}
        >
          <Column gap="xs">
            <Text variant="caption" tone="onAccent" style={{ color: theme.colors.onAccentHighlight }}>
              {t('quran.continue')}
            </Text>
            <Text variant="title3" tone="onAccent">
              {t('quran.continueAt', { surah: sureAdi(position.surah), ayah: position.ayah })}
            </Text>
          </Column>
        </Card>
      ) : null}

      <Row gap="sm" wrap>
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
        <Button
          label={t('worship.khatm')}
          icon="check"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/khatm')}
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
      <SectionHeader title={sekme === 'surahs' ? t('quran.surahs')
        : sekme === 'juz' ? t('quran.juz') : t('quran.bookmarks')} />
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
            separators={false}
            header={baslik}
            footer={kunye}
          />
        ) : null}

        {sekme === 'juz' ? (
          <VirtualList
            data={cuzler}
            keyExtractor={(c) => String(c.juz)}
            renderItem={cuzSatiri}
            separators={false}
            header={baslik}
            footer={kunye}
          />
        ) : null}

        {sekme === 'bookmarks' ? (
          <VirtualList
            data={bookmarks}
            keyExtractor={(b) => b.id}
            renderItem={yerImiSatiri}
            separators={false}
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
