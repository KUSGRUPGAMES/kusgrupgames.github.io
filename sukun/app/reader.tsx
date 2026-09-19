/**
 * Kur'an okuyucu — şartname §28, §29, §30.
 *
 * İçerik durumu: şu an yalnız **Arapça metin** gösterilir. Meal ve tefsir
 * modları arayüzde duruyor ama kaynak lisansı gelmeden içerik yüklenmez;
 * kullanıcıya boş ekran değil, nedeni yazılı bir açıklama gösterilir (§92).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, Share } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Screen, Card, Row, Column, Text, ArabicText, IconButton, Sheet, Banner,
  SectionHeader, Stepper, Segmented, Field, Button, Badge, SourceNote, Divider,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import {
  getSurah, getSurahAyahs, getSource, getSurahTranslations, getTranslationInfo,
  surahFirstGlobalAyah, type QuranAyah,
} from '@/features/quran/data';
import { useRecitation } from '@/features/audio/useRecitation';
import { getReciter, AUDIO_SOURCE } from '@/features/audio/source';
import { localPath } from '@/features/audio/downloadManager';
import { useReadingStore, BOOKMARK_COLORS, type BookmarkColor } from '@/store/reading';
import { useSettingsStore } from '@/store/settings';
import { useFavoriteStore } from '@/store/favorites';

export default function ReaderScreen() {
  const t = useT();
  const theme = useTheme();
  const params = useLocalSearchParams<{ surah?: string; ayah?: string }>();
  const sureNo = Math.min(114, Math.max(1, Number(params.surah ?? 1) || 1));
  const hedefAyet = Math.max(1, Number(params.ayah ?? 1) || 1);

  const sure = useMemo(() => getSurah(sureNo), [sureNo]);
  const ayetler = useMemo(() => getSurahAyahs(sureNo), [sureNo]);
  const kaynak = useMemo(() => getSource(), []);
  const mealler = useMemo(() => getSurahTranslations(sureNo), [sureNo]);
  const mealKunye = useMemo(() => getTranslationInfo(), []);

  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const setPosition = useReadingStore((s) => s.setPosition);
  const bookmarkAt = useReadingStore((s) => s.bookmarkAt);
  const addBookmark = useReadingStore((s) => s.addBookmark);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);
  const bookmarks = useReadingStore((s) => s.bookmarks);
  const fav = useFavoriteStore();

  const [ayarlarAcik, setAyarlarAcik] = useState(false);

  const ilkGlobal = useMemo(() => surahFirstGlobalAyah(sureNo) ?? 1, [sureNo]);
  const okuyucu = getReciter(settings.recitation.reciterId);
  const kiraat = useRecitation({
    reciterId: settings.recitation.reciterId,
    bitrate: settings.recitation.bitrate,
    localUri: (global) => localPath(settings.recitation.reciterId, settings.recitation.bitrate, global),
  });

  /** Verilen âyetten başlayarak surenin sonuna kadar çalar. */
  const dinle = useCallback((ayahNo: number) => {
    const kuyruk = ayetler.map((a) => ({ surah: a.surah, ayah: a.ayah }));
    const numaralar = ayetler.map((_a, i) => ilkGlobal + i);
    kiraat.start(kuyruk, numaralar, { surah: sureNo, ayah: ayahNo });
  }, [ayetler, ilkGlobal, kiraat, sureNo]);
  const [secili, setSecili] = useState<QuranAyah | null>(null);
  const [not, setNot] = useState('');
  const liste = useRef<FlatList<QuranAyah>>(null);

  // Açılışta hedef âyete konumlan ve "son okunan"ı güncelle.
  useEffect(() => {
    setPosition(sureNo, hedefAyet);
  }, [sureNo, hedefAyet, setPosition]);

  const ayetAc = useCallback((a: QuranAyah) => {
    setSecili(a);
    setNot(bookmarkAt(a.surah, a.ayah)?.note ?? '');
  }, [bookmarkAt]);

  const paylas = useCallback(async (a: QuranAyah) => {
    const ad = getSurah(a.surah)?.nameTr ?? String(a.surah);
    // Paylaşımda kaynak künyesi **her zaman** gider (CONTENT_SOURCES kuralı 3).
    const meal = mealler[a.ayah - 1] ?? '';
    await Share.share({
      message: `${a.text}\n\n${meal}\n\n${ad} ${a.ayah}\n${t('quran.sourceNote')}\n${t('quran.translationSource', { name: mealKunye.name, rights: t('quran.publicDomain') })}`,
    });
  }, [t, mealler, mealKunye]);

  if (!sure) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: t('quran.title') }} />
        <Banner tone="warning" title={t('error.notFound')} />
      </Screen>
    );
  }

  const yerImi = secili ? bookmarkAt(secili.surah, secili.ayah) : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `${sure.number}. ${sure.nameTr}`,
        }}
      />

      <FlatList
        ref={liste}
        data={[...ayetler]}
        keyExtractor={(a) => `${a.surah}:${a.ayah}`}
        initialScrollIndex={Math.max(0, hedefAyet - 1)}
        getItemLayout={(_d, i) => ({ length: 140, offset: 140 * i, index: i })}
        onScrollToIndexFailed={() => { /* liste henüz ölçülmedi; kullanıcı kaydırabilir */ }}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        ListHeaderComponent={
          <Row align="center" justify="space-between" style={{ marginBottom: theme.spacing.md }}>
            <Column gap="xxs">
              <Text variant="title3">{sure.nameTr}</Text>
              <Text variant="caption" tone="muted">
                {`${t('quran.ayahCount', { count: sure.ayahCount })} · ${sure.revelation === 'mekki' ? t('quran.mekki') : t('quran.medeni')}`}
              </Text>
            </Column>
            <Row gap="xs" align="center">
              <IconButton
                name={kiraat.playing ? 'pause' : 'play'}
                label={kiraat.playing ? t('audio.pause') : t('audio.playSurah')}
                onPress={() => (kiraat.playing ? kiraat.toggle() : dinle(1))}
              />
              <IconButton name="settings" label={t('quran.readerSettings')} onPress={() => setAyarlarAcik(true)} />
            </Row>
          </Row>
        }
        ListFooterComponent={
          <Column gap="sm" style={{ marginTop: theme.spacing.xl }}>
            <SourceNote source={kaynak.name} license={kaynak.metadataLicense} />
            <SourceNote
              source={t('quran.translationSource', {
                name: mealKunye.name,
                rights: t('quran.publicDomain'),
              })}
            />
              <SourceNote source={`${AUDIO_SOURCE.name} · ${okuyucu?.name ?? ''}`} />
            <Banner tone="info" title={t('quran.tafsir')} description={t('quran.contentPending')} />
          </Column>
        }
        renderItem={({ item }) => {
          const imli = bookmarks.some((b) => b.surah === item.surah && b.ayah === item.ayah);
          return (
            <Card onPress={() => ayetAc(item)} accessibilityLabel={`${sure.nameTr} ${item.ayah}`}>
              <Column gap="sm">
                <Row align="center" gap="sm">
                  <Badge label={String(item.ayah)} tone={imli ? 'highlight' : 'neutral'} />
                  {item.sajda ? <Badge label={t('quran.sajdaAyah')} tone="accent" /> : null}
                  <View style={{ flex: 1 }} />
                  <IconButton
                    name={kiraat.playing && kiraat.current?.ayah === item.ayah ? 'pause' : 'play'}
                    label={t('audio.play')}
                    size={16}
                    onPress={() => (kiraat.playing && kiraat.current?.ayah === item.ayah
                      ? kiraat.toggle()
                      : dinle(item.ayah))}
                  />
                  <Text variant="micro" tone="subtle">{t('quran.pageNo', { n: item.page })}</Text>
                </Row>
                {settings.quran.mode !== 'translation' ? (
                  <ArabicText scale={settings.quran.fontScale}>{item.text}</ArabicText>
                ) : null}
                {settings.quran.mode !== 'arabic' ? (
                  <Text variant="body" tone={settings.quran.mode === 'both' ? 'muted' : 'default'}>
                    {mealler[item.ayah - 1] ?? ''}
                  </Text>
                ) : null}
              </Column>
            </Card>
          );
        }}
      />

      <Sheet visible={ayarlarAcik} onClose={() => setAyarlarAcik(false)} title={t('quran.readerSettings')}>
        <Column gap="lg">
          <Text variant="caption" tone="muted">{t('quran.readerSettingsHint')}</Text>
          <Stepper
            title={t('quran.fontSize')}
            value={Math.round(settings.quran.fontScale * 10)}
            min={8}
            max={20}
            step={1}
            onChange={(v) => update({ quran: { ...settings.quran, fontScale: v / 10 } })}
          />
          <Segmented
            options={[
              { value: 'arabic', label: t('quran.arabicOnly') },
              { value: 'both', label: t('quran.arabicAndTranslation') },
              { value: 'translation', label: t('quran.translationOnly') },
            ]}
            value={settings.quran.mode}
            onChange={(v) => update({ quran: { ...settings.quran, mode: v as 'arabic' | 'both' | 'translation' } })}
            accessibilityLabel={t('quran.translation')}
          />
          {settings.quran.mode !== 'arabic' ? (
            <Text variant="caption" tone="muted">
              {t('quran.translationSource', { name: mealKunye.name, rights: t('quran.publicDomain') })}
            </Text>
          ) : null}
          <ArabicText scale={settings.quran.fontScale} size="small">
            {'بِسْمِ اللَّهِ'}
          </ArabicText>
        </Column>
      </Sheet>

      <Sheet
        visible={secili !== null}
        onClose={() => setSecili(null)}
        title={secili ? `${sure.nameTr} ${secili.ayah}` : ''}
      >
        {secili ? (
          <Column gap="lg">
            <ArabicText scale={settings.quran.fontScale}>{secili.text}</ArabicText>
            <Text variant="body" tone="muted">{mealler[secili.ayah - 1] ?? ''}</Text>
            <Divider />
            <Row gap="sm" wrap>
              <Button
                label={yerImi ? t('quran.bookmarkRemove') : t('quran.bookmarkAdd')}
                icon="bookmark"
                variant="secondary"
                size="sm"
                onPress={() => {
                  if (yerImi) removeBookmark(yerImi.id);
                  else addBookmark(secili.surah, secili.ayah, { note: not });
                }}
              />
              <Button
                label={fav.has('ayah', `${secili.surah}:${secili.ayah}`) ? t('favorite.remove') : t('favorite.add')}
                icon="heart"
                variant="secondary"
                size="sm"
                onPress={() => fav.toggle('ayah', `${secili.surah}:${secili.ayah}`)}
              />
              <Button
                label={t('audio.play')}
                icon="play"
                variant="secondary"
                size="sm"
                onPress={() => { dinle(secili.ayah); setSecili(null); }}
              />
              <Button
                label={t('share.title')}
                icon="share"
                variant="secondary"
                size="sm"
                onPress={() => {
                  const meal = mealler[secili.ayah - 1] ?? '';
                  const kunye = t('quran.translationSource', {
                    name: mealKunye.name, rights: t('quran.publicDomain'),
                  });
                  router.push(
                    `/share-card?body=${encodeURIComponent(meal)}` +
                    `&arabic=${encodeURIComponent(secili.text)}` +
                    `&reference=${encodeURIComponent(`${sure.nameTr} ${secili.ayah}`)}` +
                    `&source=${encodeURIComponent(kunye)}`,
                  );
                  setSecili(null);
                }}
              />
              <Button
                label={t('quran.shareAyah')}
                icon="share"
                variant="secondary"
                size="sm"
                onPress={() => { void paylas(secili); }}
              />
            </Row>

            <SectionHeader title={t('quran.noteLabel')} />
            <Field
              label={t('quran.noteLabel')}
              hint={t('quran.noteHint')}
              value={not}
              onChangeText={setNot}
              multiline
            />
            <Row gap="sm">
              <Button
                label={t('common.save')}
                onPress={() => {
                  addBookmark(secili.surah, secili.ayah, { note: not });
                  setSecili(null);
                }}
              />
              <Row gap="xs" align="center">
                {BOOKMARK_COLORS.map((c) => (
                  <IconButton
                    key={c}
                    name="bookmark"
                    label={c}
                    size={18}
                    onPress={() => addBookmark(secili.surah, secili.ayah, { color: c as BookmarkColor, note: not })}
                  />
                ))}
              </Row>
            </Row>

            <SourceNote source={kaynak.name} />
          </Column>
        ) : null}
      </Sheet>
    </View>
  );
}
