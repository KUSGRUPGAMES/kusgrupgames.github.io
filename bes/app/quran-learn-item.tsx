/** Kur'an okuma eğitimi — tek harf ya da hareke detayı. */
import React from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  Screen, SectionHeader, Card, Column, Row, Text, ArabicText, Button, IconButton, Banner,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useLearningStore, type LearningKind } from '@/store/learning';
import { ARABIC_ALPHABET } from '@/content/arabicAlphabet';
import { HAREKAT } from '@/content/harekat';

export default function QuranLearnItemScreen() {
  const t = useT();
  const theme = useTheme();
  const params = useLocalSearchParams<{ kind: string; id: string }>();
  const kind: LearningKind = params.kind === 'harake' ? 'harake' : 'letter';
  const liste = kind === 'harake' ? HAREKAT : ARABIC_ALPHABET;
  const index = liste.findIndex((x) => x.id === params.id);
  const ogrenildi = useLearningStore((s) => s.has(kind, params.id ?? ''));
  const toggle = useLearningStore((s) => s.toggle);

  if (index < 0) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: true, title: kind === 'harake' ? t('learn.harakat') : t('learn.letters') }} />
      </Screen>
    );
  }

  const oge = liste[index]!;
  const onceki = liste[index - 1];
  const sonraki = liste[index + 1];
  const buyukMetin = kind === 'harake' ? (oge as typeof HAREKAT[number]).example : (oge as typeof ARABIC_ALPHABET[number]).letter;

  return (
    <Screen scroll motif="girih">
      <Stack.Screen options={{ headerShown: true, title: oge.name }} />

      <Row align="center" justify="space-between">
        <IconButton
          name="chevronLeft"
          label={t('nav.back')}
          disabled={!onceki}
          onPress={() => onceki && router.replace(`/quran-learn-item?kind=${kind}&id=${onceki.id}`)}
        />
        <Text variant="micro" tone="subtle">{`${index + 1} / ${liste.length}`}</Text>
        <IconButton
          name="chevronRight"
          label={t('common.next')}
          disabled={!sonraki}
          onPress={() => sonraki && router.replace(`/quran-learn-item?kind=${kind}&id=${sonraki.id}`)}
        />
      </Row>

      <Card accent>
        <Column align="center" gap="md">
          <ArabicText scale={2} style={{ color: theme.colors.onAccent }}>{buyukMetin}</ArabicText>
          <Text variant="title2" tone="onAccent">{oge.name}</Text>
        </Column>
      </Card>

      <SectionHeader title={kind === 'harake' ? t('learn.harakat') : t('learn.letters')} />
      <Card>
        <Column gap="sm">
          <Text variant="body">
            {kind === 'harake' ? (oge as typeof HAREKAT[number]).sound : (oge as typeof ARABIC_ALPHABET[number]).soundHint}
          </Text>
          {kind === 'letter' ? (
            <Row align="center" justify="space-between" style={{ marginTop: theme.spacing.sm }}>
              <Column gap="xxs">
                <Text variant="caption" tone="muted">{t('learn.example')}</Text>
                <Text variant="bodyStrong">{(oge as typeof ARABIC_ALPHABET[number]).exampleMeaning}</Text>
              </Column>
              <ArabicText size="small">{(oge as typeof ARABIC_ALPHABET[number]).example}</ArabicText>
            </Row>
          ) : null}
        </Column>
      </Card>

      <Row style={{ marginTop: theme.spacing.lg }}>
        <Button
          label={ogrenildi ? t('learn.markNotLearned') : t('learn.markLearned')}
          icon={ogrenildi ? 'close' : 'check'}
          variant={ogrenildi ? 'ghost' : 'primary'}
          onPress={() => toggle(kind, oge.id)}
        />
      </Row>

      <Banner tone="info" title={t('learn.disclaimer')} />
    </Screen>
  );
}
