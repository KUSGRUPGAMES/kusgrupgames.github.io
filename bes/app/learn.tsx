/**
 * Öğren — Kur'an okuma kursu ve dinî bilgi (DECISIONS D25, D26).
 *
 * Eskiden kurs Kur'an sekmesinin içinde iki ekran derindeydi. Artık kendi
 * sekmesi var: açınca ilerleme ve "Devam et" hemen görünür, dersler ünite
 * ünite listelenir. Dersler kilitli değildir; bilen kullanıcı atlayabilir.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, ListItem, Text, Button, ProgressBar, Column, Row, Icon, ProBadge,
  SourceNote, FeatureTile,
} from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { useLearningStore } from '@/store/learning';
import { LESSONS, UNITS, nextLesson } from '@/features/learn/course';
import { useProAccess } from '@/features/pro/useProAccess';
import { isLessonFree } from '@/features/pro/gates';

export default function LearnScreen() {
  const t = useT();
  const theme = useTheme();
  const results = useLearningStore((s) => s.results);

  const yildiz = useMemo(() => new Map(results.map((r) => [r.lessonId, r.stars])), [results]);
  const biten = useMemo(() => new Set(yildiz.keys()), [yildiz]);
  const sirada = nextLesson(biten);
  const tamam = LESSONS.filter((l) => biten.has(l.id)).length;

  const erisim = useProAccess();
  const kilitli = (unit: number) => !erisim.has && !isLessonFree(unit);
  // Kilitli ders Pro sayfasını açar (D33); ilk üç ünite herkese açık.
  const ac = (id: string) => {
    const m = LESSONS.find((l) => l.id === id);
    if (m && kilitli(m.unit)) { router.push('/pro'); return; }
    router.push({ pathname: '/lesson', params: { id } });
  };

  return (
    <Screen scroll motif="arch" topInset={false}>
      {/* Sekme değil; Kur'an sekmesinden açılır (1 Ekim: beş sekme sınırı). */}
      <Stack.Screen options={{ headerShown: true, title: t('learn.title') }} />
      <Text variant="callout" tone="muted" style={{ marginBottom: theme.spacing.md }}>{t('learn.subtitle')}</Text>

      <Card accent padding="lg">
        <Column gap="md">
          <Text variant="caption" tone="onAccent">
            {t('learn.progress', { done: tamam, total: LESSONS.length })}
          </Text>
          <ProgressBar value={tamam / LESSONS.length} height={8} color={theme.colors.onAccentHighlight}
            track={theme.colors.onAccentBorder} />
          {sirada ? (
            <>
              <Column gap="xxs">
                <Text variant="title3" tone="onAccent">{sirada.title}</Text>
                <Text variant="caption" tone="onAccent">
                  {`${t('learn.unit', { n: sirada.unit })} · ${UNITS.find((u) => u.no === sirada.unit)?.title ?? ''}`}
                </Text>
              </Column>
              <Button
                label={tamam === 0 ? t('learn.start') : t('learn.continue')}
                icon="play"
                variant="secondary"
                onPress={() => ac(sirada.id)}
              />
            </>
          ) : (
            <Text variant="title3" tone="onAccent">{t('learn.courseDone')}</Text>
          )}
        </Column>
      </Card>

      {/* Bilgi ve rehberler en üstte: eskiden "Diğer" başlığıyla yedi
          ünitenin altında kalıyordu; İslami bilgi sayfasını bulan olmuyordu. */}
      <SectionHeader title={t('learn.guides')} />
      <Row gap="sm" wrap>
        <FeatureTile title={t('learn.alphabet')} icon="sparkle" onPress={() => router.push('/alphabet')} />
        <FeatureTile title={t('worship.guide')} icon="mosque" onPress={() => router.push('/prayer-guide')} />
        <FeatureTile title={t('explore.articles')} icon="info" onPress={() => router.push('/knowledge')} />
        <FeatureTile title={t('worship.names')} icon="star" onPress={() => router.push('/names')} />
      </Row>

      {UNITS.map((u) => (
        <View key={u.no}>
          <SectionHeader title={`${t('learn.unit', { n: u.no })} · ${u.title}`} subtitle={u.description}
            badge={isLessonFree(u.no) ? undefined : <ProBadge />} />
          <Card padding="md">
            {LESSONS.filter((l) => l.unit === u.no).map((l) => {
              const s = yildiz.get(l.id);
              return (
                <ListItem
                  key={l.id}
                  title={l.title}
                  subtitle={l.subtitle}
                  onPress={() => ac(l.id)}
                  {...(kilitli(l.unit) ? { right: <Icon name="lock" size={16} color={theme.colors.textSubtle} /> }
                    : s ? { right: <Yildizlar n={s} etiket={t('learn.stars', { n: s })} /> }
                    : sirada?.id === l.id ? { right: <Icon name="play" size={18} color={theme.colors.highlight} /> }
                      : {})}
                />
              );
            })}
          </Card>
        </View>
      ))}

      <View style={{ marginTop: theme.spacing.lg }}>
        <Text variant="caption" tone="muted">{t('learn.disclaimer')}</Text>
        <SourceNote source={t('learn.audioSource')} />
      </View>
      <View style={{ height: theme.spacing.xxl }} />
    </Screen>
  );
}

function Yildizlar({ n, etiket }: { n: number; etiket: string }) {
  const theme = useTheme();
  return (
    <Row gap="xxs" accessibilityLabel={etiket}>
      {[1, 2, 3].map((i) => (
        <Icon key={i} name="star" size={14} color={i <= n ? theme.colors.highlight : theme.colors.bezemeSolgun} />
      ))}
    </Row>
  );
}
