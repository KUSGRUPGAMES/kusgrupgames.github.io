/** Hatim grubu ayrıntısı — 30 cüz, alma/bırakma/tamamlama (D31). */
import React, { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Screen, SectionHeader, Card, ProgressBar, Text, Column, Row, Button, Banner, Sheet, EmptyState,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useCommunitySession } from '@/features/community/session';
import {
  useKhatmCircleClaims, useClaimJuz, useReleaseJuz, useCompleteJuz, useKhatmCircleById,
  computeProgress, JUZ_COUNT, type JuzClaim,
} from '@/features/community/khatmCircles';

export default function KhatmCircleScreen() {
  const t = useT();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const settings = useSettingsStore((s) => s.settings);
  const { userId, nickname } = useCommunitySession();
  const { claims, yukleniyor } = useKhatmCircleClaims(id ?? null);
  const { data: grup } = useKhatmCircleById(id ?? null);

  const claimJuz = useClaimJuz(userId, nickname);
  const releaseJuz = useReleaseJuz();
  const completeJuz = useCompleteJuz();

  const [secili, setSecili] = useState<JuzClaim | null>(null);

  if (!settings.community.enabled || !userId) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: t('community.khatmCircles') }} />
        <EmptyState icon="users" title={t('community.joinFirstTitle')} description={t('community.joinFirstBody')}
          actionLabel={t('community.title')} onAction={() => router.push('/community')} />
      </Screen>
    );
  }

  const ilerleme = computeProgress(claims);
  const tamamlandi = ilerleme.completed === JUZ_COUNT;

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: grup?.title ?? t('community.khatmCircles') }} />

      {grup?.purpose ? <Text variant="callout" tone="muted">{grup.purpose}</Text> : null}

      {tamamlandi ? (
        <Banner tone="success" title={t('community.circleCompleted')} style={{ marginTop: theme.spacing.md }} />
      ) : null}

      <Card padding="md" style={{ marginTop: theme.spacing.md }}>
        <Column gap="sm">
          <Row align="center">
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {t('community.circleProgress', { done: ilerleme.completed, total: JUZ_COUNT })}
            </Text>
            <Text variant="caption" tone="muted">{t('community.circleClaimed', { n: ilerleme.claimed })}</Text>
          </Row>
          <ProgressBar value={ilerleme.completed / JUZ_COUNT} accessibilityLabel={t('community.circleProgress', { done: ilerleme.completed, total: JUZ_COUNT })} />
        </Column>
      </Card>

      {grup ? (
        <Button
          label={t('community.shareInviteCode')} variant="secondary" size="sm" icon="share"
          style={{ marginTop: theme.spacing.md, alignSelf: 'flex-start' }}
          onPress={() => { void Share.share({ message: t('community.shareInviteMessage', { title: grup.title, code: grup.inviteCode }) }); }}
        />
      ) : null}

      <SectionHeader title={t('quran.juz')} />
      {yukleniyor ? (
        <Text variant="caption" tone="muted">{t('common.loading')}</Text>
      ) : (
        <Card padding="md">
          <Row gap="sm" wrap>
            {claims.map((c) => {
              const benim = c.claimedBy === userId;
              const bg = c.completed ? theme.colors.success
                : benim ? theme.colors.accent
                : c.claimedBy ? theme.colors.surfaceRaised
                : theme.colors.surface;
              const border = c.completed ? theme.colors.success
                : benim ? theme.colors.accent
                : theme.colors.border;
              return (
                <Pressable
                  key={c.juzNo}
                  onPress={() => setSecili(c)}
                  accessibilityRole="button"
                  accessibilityLabel={t('quran.juzNo', { n: c.juzNo })}
                  accessibilityHint={c.completed ? t('community.juzStateCompleted')
                    : c.claimedBy ? (benim ? t('community.juzStateMine') : t('community.juzStateTaken', { name: c.claimedNickname ?? '' }))
                    : t('community.juzStateFree')}
                  style={{ width: 48, height: 48, borderRadius: theme.radius.md, alignItems: 'center',
                    justifyContent: 'center', backgroundColor: bg, borderWidth: 1, borderColor: border }}
                >
                  <Text variant="bodyStrong" tone={c.completed || benim ? 'onAccent' : 'muted'}>{String(c.juzNo)}</Text>
                </Pressable>
              );
            })}
          </Row>
        </Card>
      )}

      <Sheet visible={secili !== null} onClose={() => setSecili(null)} title={t('quran.juzNo', { n: secili?.juzNo ?? 0 })}>
        <Column gap="md" style={{ paddingBottom: theme.spacing.lg }}>
          {secili ? (
            <>
              <Text tone="muted">
                {secili.completed ? t('community.juzStateCompleted')
                  : secili.claimedBy === userId ? t('community.juzStateMine')
                  : secili.claimedBy ? t('community.juzStateTaken', { name: secili.claimedNickname ?? '' })
                  : t('community.juzStateFree')}
              </Text>
              {!secili.claimedBy ? (
                <Button label={t('community.claimJuz')} onPress={() => {
                  claimJuz.mutate({ circleId: secili.circleId, juzNo: secili.juzNo });
                  setSecili(null);
                }} block />
              ) : secili.claimedBy === userId && !secili.completed ? (
                <>
                  <Button label={t('community.completeJuz')} onPress={() => {
                    completeJuz.mutate({ circleId: secili.circleId, juzNo: secili.juzNo });
                    setSecili(null);
                  }} block />
                  <Button label={t('community.releaseJuz')} variant="secondary" onPress={() => {
                    releaseJuz.mutate({ circleId: secili.circleId, juzNo: secili.juzNo });
                    setSecili(null);
                  }} block />
                </>
              ) : null}
            </>
          ) : null}
        </Column>
      </Sheet>
      <View style={{ height: theme.spacing.xl }} />
    </Screen>
  );
}
