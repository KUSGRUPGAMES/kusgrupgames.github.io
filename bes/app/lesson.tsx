/**
 * Ders oynatıcı — Kur'an okuma kursu (DECISIONS D26).
 *
 * Ders, `course.ts`in ürettiği adımlardan oluşur: bilgi kartı, harf kartı,
 * hece ve kelime tabloları, alıştırma ve sure okuma. Her adımda tek iş
 * yapılır; üstteki çubuk nerede olunduğunu gösterir. Sonuç yıldızla kaydedilir.
 *
 * Yazı yönü: hece ve kelime tabloları arayüz dili ne olursa olsun sağdan
 * sola dizilir; Arapça böyle okunur.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nManager, Pressable, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Screen, Card, Text, Column, Row, Button, ProgressBar, Banner, ArabicText, Icon, IconButton, Badge,
} from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { letterForms } from '@/content/arabicAlphabet';
import {
  LESSONS, buildLesson, lessonMeta, nextLesson, starsFor, type Question, type Step,
} from '@/features/learn/course';
import { surahWords, type QuranWord } from '@/features/learn/words';
import { useLearnAudio, type LearnAudio } from '@/features/learn/useLearnAudio';
import { useLearningStore } from '@/store/learning';
import { getSurah } from '@/features/quran/data';

/** Arapça dizilim: LTR arayüzde satırı ters çevir, RTL'de zaten sağdan başlar. */
const ARAPCA_SATIR = I18nManager.isRTL ? 'row' : 'row-reverse';

export default function LessonScreen() {
  const t = useT();
  const theme = useTheme();
  const { id = 'harf-1' } = useLocalSearchParams<{ id?: string }>();
  const meta = lessonMeta(id);
  const [deneme, setDeneme] = useState(0);
  const adimlar = useMemo(() => buildLesson(id, deneme), [id, deneme]);
  const [sira, setSira] = useState(0);
  const [dogru, setDogru] = useState(0);
  const [toplam, setToplam] = useState(0);
  const [bitti, setBitti] = useState(false);
  const ses = useLearnAudio();
  const tamamla = useLearningStore((s) => s.complete);
  const sonuclar = useLearningStore((s) => s.results);

  // Ders değişince (Sonraki ders) baştan başla.
  useEffect(() => {
    setDeneme(0); setSira(0); setDogru(0); setToplam(0); setBitti(false);
  }, [id]);

  const ileri = useCallback(() => {
    ses.stop();
    if (sira + 1 < adimlar.length) setSira(sira + 1);
    else setBitti(true);
  }, [ses, sira, adimlar.length]);

  // Ders bittiğinde sonucu bir kez kaydet.
  useEffect(() => {
    if (bitti) tamamla(id, starsFor(dogru, toplam));
  }, [bitti]);

  const tekrar = () => {
    ses.stop();
    setDeneme((d) => d + 1); setSira(0); setDogru(0); setToplam(0); setBitti(false);
  };

  const adim = adimlar[sira];
  const baslik = meta?.title ?? t('learn.title');

  if (!meta || !adim) {
    return (
      <Screen topInset={false}>
        <Stack.Screen options={{ headerShown: true, title: t('learn.title') }} />
        <Banner tone="warning" title={t('learn.audioFailed')} />
      </Screen>
    );
  }

  if (bitti) {
    const yildiz = starsFor(dogru, toplam);
    const biten = new Set([...sonuclar.map((r) => r.lessonId), id]);
    // Önce bu dersten sonra gelen ilk bitmemiş ders; yoksa baştan ilk eksik.
    const buradan = LESSONS.findIndex((l) => l.id === id);
    const sonraki = LESSONS.slice(buradan + 1).find((l) => !biten.has(l.id)) ?? nextLesson(biten);
    return (
      <Screen scroll topInset={false}>
        <Stack.Screen options={{ headerShown: true, title: baslik }} />
        <Card accent padding="lg">
          <Column align="center" gap="md">
            <Text variant="title2" tone="onAccent" align="center">{t('learn.resultTitle')}</Text>
            <Row gap="sm" accessibilityLabel={t('learn.stars', { n: yildiz })}>
              {[1, 2, 3].map((i) => (
                <Icon key={i} name="star" size={40}
                  color={i <= yildiz ? theme.colors.onAccentHighlight : theme.colors.onAccentBorder} />
              ))}
            </Row>
            {toplam > 0 ? (
              <Text variant="bodyStrong" tone="onAccent" align="center">
                {t('learn.resultScore', { correct: dogru, total: toplam })}
              </Text>
            ) : null}
          </Column>
        </Card>
        <Column gap="sm" style={{ marginTop: theme.spacing.lg }}>
          {sonraki ? (
            <Button label={t('learn.nextLesson')} icon="chevronRight" block
              onPress={() => router.replace({ pathname: '/lesson', params: { id: sonraki.id } })} />
          ) : null}
          {toplam > 0 ? <Button label={t('learn.retry')} icon="refresh" variant="secondary" block onPress={tekrar} /> : null}
          <Button label={t('learn.backToCourse')} variant="ghost" block onPress={() => router.back()} />
        </Column>
      </Screen>
    );
  }

  return (
    <Screen scroll topInset={false}>
      <Stack.Screen options={{ headerShown: true, title: baslik }} />
      <ProgressBar value={(sira + 1) / adimlar.length} height={6}
        accessibilityLabel={`${sira + 1} / ${adimlar.length}`} />
      <View style={{ height: theme.spacing.lg }} />

      {ses.failed ? (
        <Banner tone="warning" title={t('learn.audioFailed')} style={{ marginBottom: theme.spacing.md }} />
      ) : null}
      {ses.ttsAvailable === false && konusmaKullanir(adim) ? (
        <Banner tone="info" title={t('learn.ttsMissing')} style={{ marginBottom: theme.spacing.md }} />
      ) : null}

      <AdimGorunumu
        key={`${deneme}-${sira}`}
        adim={adim}
        ses={ses}
        ileri={ileri}
        cevapla={(ok) => { setToplam((n) => n + 1); if (ok) setDogru((n) => n + 1); }}
      />
    </Screen>
  );
}

function konusmaKullanir(adim: Step): boolean {
  if (adim.kind === 'letter' || adim.kind === 'syllables') return true;
  if (adim.kind === 'quiz') return adim.questions.some((q) => q.kind === 'hearLetter' || q.kind === 'hearSyllable');
  return false;
}

// ------------------------------------------------------------------ adımlar

function AdimGorunumu({ adim, ses, ileri, cevapla }: {
  adim: Step; ses: LearnAudio; ileri: () => void; cevapla: (ok: boolean) => void;
}) {
  switch (adim.kind) {
    case 'info': return <BilgiAdimi baslik={adim.title} metin={adim.body} ileri={ileri} />;
    case 'letter': return <HarfAdimi adim={adim} ses={ses} ileri={ileri} />;
    case 'syllables': return (
      <TabloAdimi baslik={adim.title} metin={adim.body} ileri={ileri}
        ogeler={adim.items.map((s) => ({ key: s.text, text: s.text, cal: () => ses.speak(s.text) }))}
        aktif={ses.active} buyuk />
    );
    case 'words': return (
      <TabloAdimi baslik={adim.title} metin={adim.body} ileri={ileri}
        ogeler={adim.items.map((w) => ({ key: kelimeAnahtari(w), text: w.text, cal: () => ses.playWord(w) }))}
        aktif={ses.active} />
    );
    case 'quiz': return <Alistirma sorular={adim.questions} ses={ses} ileri={ileri} cevapla={cevapla} />;
    case 'surah': return <SureAdimi sure={adim.surah} ses={ses} ileri={ileri} />;
  }
}

const kelimeAnahtari = (w: QuranWord) => `${w.surah}:${w.ayah}:${w.index}`;

function BilgiAdimi({ baslik, metin, ileri }: { baslik: string; metin: string; ileri: () => void }) {
  const t = useT();
  const theme = useTheme();
  return (
    <Column gap="lg">
      <Card padding="lg">
        <Column gap="md">
          <Icon name="info" size={28} color={theme.colors.highlight} />
          <Text variant="title2">{baslik}</Text>
          <Text variant="body">{metin}</Text>
        </Column>
      </Card>
      <Button label={t('common.next')} icon="chevronRight" block onPress={ileri} />
    </Column>
  );
}

function HarfAdimi({ adim, ses, ileri }: {
  adim: Extract<Step, { kind: 'letter' }>; ses: LearnAudio; ileri: () => void;
}) {
  const t = useT();
  const theme = useTheme();
  const l = adim.letter;
  const f = letterForms(l.letter);
  const yazilis: [string, string][] = [
    [t('learn.formIsolated'), f.isolated], [t('learn.formInitial'), f.initial],
    [t('learn.formMedial'), f.medial], [t('learn.formFinal'), f.final],
  ];
  const adCaliyor = ses.active === `ad-${l.id}`;

  return (
    <Column gap="lg">
      <Card padding="lg">
        <Column align="center" gap="sm">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${l.name}, ${t('learn.listen')}`}
            onPress={() => ses.speak(l.arName, `ad-${l.id}`)}
            style={{ width: 168, height: 168, borderRadius: 84, alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: adCaliyor ? theme.colors.highlight : theme.colors.bezemeSolgun,
              backgroundColor: theme.colors.surfaceRaised }}
          >
            <ArabicText scale={2} style={{ textAlign: 'center', writingDirection: 'rtl' }}>{l.letter}</ArabicText>
          </Pressable>
          <Text variant="title2" align="center">{l.name}</Text>
          <ArabicText size="small" tone="muted" style={{ textAlign: 'center' }}>{l.arName}</ArabicText>
          <Text variant="callout" tone="muted" align="center">{l.soundHint}</Text>
          <Button label={t('learn.listen')} icon="play" variant="secondary"
            onPress={() => ses.speak(l.arName, `ad-${l.id}`)} />
        </Column>
      </Card>

      <Card padding="md">
        <Text variant="caption" tone="muted">{t('learn.forms')}</Text>
        <Row gap="sm" style={{ flexDirection: ARAPCA_SATIR, marginTop: theme.spacing.sm }}>
          {yazilis.map(([ad, bicim]) => (
            <Column key={ad} flex={1} align="center" gap="xxs" style={{ paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceRaised }}>
              <ArabicText size="small" style={{ textAlign: 'center' }}>{bicim}</ArabicText>
              <Text variant="micro" tone="muted" align="center">{ad}</Text>
            </Column>
          ))}
        </Row>
      </Card>

      {adim.example ? (
        <Card padding="md" onPress={() => ses.playWord(adim.example!)} accessibilityLabel={t('learn.fromQuran')}>
          <Row align="center" gap="md">
            <Icon name={ses.active === kelimeAnahtari(adim.example) ? 'pause' : 'play'} size={22}
              color={theme.colors.highlight} />
            <Column flex={1} gap="xxs">
              <Text variant="caption" tone="muted">{t('learn.fromQuran')}</Text>
              <Badge label={t('learn.humanVoice')} tone="neutral" />
            </Column>
            <ArabicText style={{ textAlign: 'center' }}>{adim.example.text}</ArabicText>
          </Row>
        </Card>
      ) : null}

      <Button label={t('common.next')} icon="chevronRight" block onPress={ileri} />
    </Column>
  );
}

function TabloAdimi({ baslik, metin, ogeler, aktif, ileri, buyuk = false }: {
  baslik: string; metin: string; ogeler: { key: string; text: string; cal: () => void }[];
  aktif: string | null; ileri: () => void; buyuk?: boolean;
}) {
  const t = useT();
  const theme = useTheme();
  return (
    <Column gap="lg">
      <Column gap="xs">
        <Text variant="title2">{baslik}</Text>
        <Text variant="body" tone="muted">{metin}</Text>
      </Column>
      <View style={{ flexDirection: ARAPCA_SATIR, flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {ogeler.map((o) => {
          const caliyor = aktif === o.key || aktif === o.text;
          return (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              accessibilityLabel={`${o.text}, ${t('learn.listen')}`}
              onPress={o.cal}
              style={{ minWidth: buyuk ? 64 : 92, flexGrow: buyuk ? 0 : 1, alignItems: 'center',
                paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs,
                borderRadius: theme.radius.md, borderWidth: caliyor ? 2 : 1,
                borderColor: caliyor ? theme.colors.highlight : theme.colors.bezemeSolgun,
                backgroundColor: theme.colors.surface }}
            >
              <ArabicText size={buyuk ? 'normal' : 'small'} style={{ textAlign: 'center' }}>{o.text}</ArabicText>
            </Pressable>
          );
        })}
      </View>
      <Button label={t('common.next')} icon="chevronRight" block onPress={ileri} />
    </Column>
  );
}

// ---------------------------------------------------------------- alıştırma

function Alistirma({ sorular, ses, ileri, cevapla }: {
  sorular: Question[]; ses: LearnAudio; ileri: () => void; cevapla: (ok: boolean) => void;
}) {
  const t = useT();
  const theme = useTheme();
  const [no, setNo] = useState(0);
  const [secilen, setSecilen] = useState<string | null>(null);
  const soru = sorular[no]!;
  const dinlemeli = soru.kind !== 'nameLetter';

  const cal = useCallback(() => {
    if (soru.kind === 'hearLetter' || soru.kind === 'hearSyllable') ses.speak(soru.say, 'soru');
    else if (soru.kind === 'hearWord') ses.playWord(soru.word);
  }, [soru, ses]);

  // Yeni soruda sesi kendiliğinden çal: dinleme alıştırmasında ilk iş dinlemek.
  useEffect(() => { if (dinlemeli) cal(); }, [no]);

  const sec = (o: string) => {
    if (secilen) return;
    setSecilen(o);
    cevapla(o === soru.answer);
  };
  const sonraki = () => {
    setSecilen(null);
    if (no + 1 < sorular.length) setNo(no + 1);
    else ileri();
  };
  const arapcaSecenek = soru.kind !== 'nameLetter';

  return (
    <Column gap="lg">
      <Row justify="space-between" align="center">
        <Text variant="caption" tone="muted">{`${no + 1} / ${sorular.length}`}</Text>
        <Text variant="caption" tone="muted">{dinlemeli ? t('learn.quizHear') : t('learn.quizName')}</Text>
      </Row>

      <Card padding="lg">
        <Column align="center" gap="sm">
          {dinlemeli ? (
            <>
              <IconButton name={ses.active ? 'pause' : 'play'} label={t('learn.playAgain')} filled onPress={cal} />
              <Text variant="callout" tone="muted">{t('learn.playAgain')}</Text>
            </>
          ) : (
            <ArabicText scale={2} style={{ textAlign: 'center' }}>{soru.kind === 'nameLetter' ? soru.letter : ''}</ArabicText>
          )}
        </Column>
      </Card>

      <View style={{ flexDirection: arapcaSecenek ? ARAPCA_SATIR : 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {soru.options.map((o) => {
          const dogruMu = secilen !== null && o === soru.answer;
          const yanlisMi = secilen === o && o !== soru.answer;
          return (
            <Pressable
              key={o}
              accessibilityRole="button"
              accessibilityState={{ selected: secilen === o, disabled: secilen !== null }}
              accessibilityLabel={o}
              onPress={() => sec(o)}
              style={{ flexBasis: '46%', flexGrow: 1, minHeight: 72, alignItems: 'center', justifyContent: 'center',
                padding: theme.spacing.sm, borderRadius: theme.radius.lg,
                borderWidth: dogruMu || yanlisMi ? 2 : 1,
                borderColor: dogruMu ? theme.colors.success : yanlisMi ? theme.colors.danger : theme.colors.bezemeSolgun,
                backgroundColor: theme.colors.surface }}
            >
              {arapcaSecenek
                ? <ArabicText size={o.length <= 3 ? 'normal' : 'small'} scale={o.length <= 3 ? 1.3 : 1}
                    style={{ textAlign: 'center' }}>{o}</ArabicText>
                : <Text variant="bodyStrong" align="center">{o}</Text>}
            </Pressable>
          );
        })}
      </View>

      {secilen ? (
        <Column gap="md">
          <Banner
            tone={secilen === soru.answer ? 'success' : 'warning'}
            title={secilen === soru.answer ? t('learn.correct') : t('learn.wrong', { answer: soru.answer })}
          />
          <Button label={t('common.next')} icon="chevronRight" block onPress={sonraki} />
        </Column>
      ) : null}
    </Column>
  );
}

// ------------------------------------------------------------------- sure

function SureAdimi({ sure, ses, ileri }: { sure: number; ses: LearnAudio; ileri: () => void }) {
  const t = useT();
  const theme = useTheme();
  const ayetler = useMemo(() => surahWords(sure), [sure]);
  const ad = useMemo(() => getSurah(sure)?.nameAr ?? '', [sure]);

  return (
    <Column gap="lg">
      <Text variant="body" tone="muted">{t('learn.surahHint')}</Text>
      {ad ? <ArabicText style={{ textAlign: 'center' }}>{ad}</ArabicText> : null}
      {ayetler.map((a) => {
        const ayetCaliyor = ses.active === `${sure}:${a.ayah}`;
        return (
          <Card key={a.ayah} padding="md"
            style={ayetCaliyor ? { borderColor: theme.colors.highlight, borderWidth: 2 } : undefined}>
            <View style={{ flexDirection: ARAPCA_SATIR, flexWrap: 'wrap', gap: theme.spacing.xs }}>
              {a.words.map((w) => {
                const aktif = ses.active === kelimeAnahtari(w);
                return (
                  <Pressable key={w.index} accessibilityRole="button" accessibilityLabel={w.text}
                    onPress={() => ses.playWord(w)}
                    style={{ paddingHorizontal: theme.spacing.xs, borderRadius: theme.radius.sm,
                      backgroundColor: aktif ? theme.colors.surfaceRaised : 'transparent',
                      borderBottomWidth: aktif ? 2 : 0, borderBottomColor: theme.colors.highlight }}>
                    <ArabicText size="small">{w.text}</ArabicText>
                  </Pressable>
                );
              })}
            </View>
            <Row justify="space-between" align="center" style={{ marginTop: theme.spacing.sm }}>
              <Badge label={String(a.ayah)} tone="neutral" />
              <Button label={t('learn.playAyah')} icon={ayetCaliyor ? 'pause' : 'play'} size="sm" variant="ghost"
                onPress={() => (ayetCaliyor ? ses.stop() : ses.playAyah(sure, a.ayah))} />
            </Row>
          </Card>
        );
      })}
      <Button label={t('learn.finishSurah')} icon="check" block onPress={ileri} />
    </Column>
  );
}
