/**
 * Elifbâ tablosu — 28 harf, sağdan sola. Harfe dokununca adı okunur ve
 * üstte dört yazılışı ile Kur'an'dan bir örnek kelime görünür.
 */
import React, { useMemo, useState } from 'react';
import { I18nManager, Pressable, View } from 'react-native';
import { Stack } from 'expo-router';
import { Screen, Card, Text, Column, Row, ArabicText, Icon, SourceNote } from '@/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { ARABIC_ALPHABET, letterForms } from '@/content/arabicAlphabet';
import { exampleForLetter } from '@/features/learn/words';
import { useLearnAudio } from '@/features/learn/useLearnAudio';

const ARAPCA_SATIR = I18nManager.isRTL ? 'row' : 'row-reverse';

export default function AlphabetScreen() {
  const t = useT();
  const theme = useTheme();
  const ses = useLearnAudio();
  const [secili, setSecili] = useState(ARABIC_ALPHABET[0]!);
  const ornek = useMemo(() => exampleForLetter(secili.letter), [secili]);
  const f = letterForms(secili.letter);
  const yazilis: [string, string][] = [
    [t('learn.formIsolated'), f.isolated], [t('learn.formInitial'), f.initial],
    [t('learn.formMedial'), f.medial], [t('learn.formFinal'), f.final],
  ];

  return (
    <Screen scroll topInset={false}>
      <Stack.Screen options={{ headerShown: true, title: t('learn.alphabet') }} />
      <Text variant="callout" tone="muted" style={{ marginBottom: theme.spacing.md }}>{t('learn.alphabetHint')}</Text>

      <Card padding="md">
        <Row align="center" gap="md">
          <Column flex={1} gap="xxs">
            <Text variant="title2">{secili.name}</Text>
            <Text variant="caption" tone="muted">{secili.soundHint}</Text>
          </Column>
          <ArabicText scale={1.6} style={{ textAlign: 'center' }}>{secili.letter}</ArabicText>
        </Row>
        <Row gap="xs" style={{ flexDirection: ARAPCA_SATIR, marginTop: theme.spacing.sm }}>
          {yazilis.map(([ad, bicim]) => (
            <Column key={ad} flex={1} align="center" style={{ borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surfaceRaised }}>
              <ArabicText size="small" style={{ textAlign: 'center' }}>{bicim}</ArabicText>
              <Text variant="micro" tone="muted" align="center">{ad}</Text>
            </Column>
          ))}
        </Row>
        {ornek ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('learn.fromQuran')}
            onPress={() => ses.playWord(ornek)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Icon name="play" size={18} color={theme.colors.highlight} />
            <Text variant="caption" tone="muted" style={{ flex: 1 }}>
              {`${t('learn.fromQuran')} · ${t('learn.humanVoice')}`}
            </Text>
            <ArabicText size="small">{ornek.text}</ArabicText>
          </Pressable>
        ) : null}
      </Card>

      <View style={{ flexDirection: ARAPCA_SATIR, flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
        {ARABIC_ALPHABET.map((l) => {
          const aktif = secili.id === l.id;
          return (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityLabel={`${l.name}, ${t('learn.listen')}`}
              accessibilityState={{ selected: aktif }}
              onPress={() => { setSecili(l); ses.speak(l.arName, `ad-${l.id}`); }}
              style={{ width: '22%', flexGrow: 1, alignItems: 'center', paddingVertical: theme.spacing.xs,
                borderRadius: theme.radius.md, borderWidth: aktif ? 2 : 1,
                borderColor: aktif ? theme.colors.highlight : theme.colors.bezemeSolgun,
                backgroundColor: theme.colors.surface }}
            >
              {/* Satır yüksek tutulur: ج ح خ ع غ kuyrukları alttaki adın üstüne biniyordu. */}
              <ArabicText style={{ textAlign: 'center', lineHeight: 72 }}>{l.letter}</ArabicText>
              <Text variant="micro" tone="muted" align="center" lines={1}>{l.name}</Text>
            </Pressable>
          );
        })}
      </View>
      {ses.ttsAvailable === false ? (
        <Text variant="caption" tone="warning" style={{ marginTop: theme.spacing.md }}>{t('learn.ttsMissing')}</Text>
      ) : null}
      <SourceNote source={t('learn.audioSource')} />
      <View style={{ height: theme.spacing.xxl }} />
    </Screen>
  );
}
