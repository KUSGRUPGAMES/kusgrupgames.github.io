/**
 * Hatim grupları — göz atma, oluşturma, kodla katılma (D31).
 * Kişisel (tek başına) hatim takibi `app/khatm.tsx`'te, tamamen ayrı ve yerel.
 */
import React, { useState } from 'react';
import { Stack, router } from 'expo-router';
import {
  Screen, SectionHeader, Card, ListItem, Text, Column, Row, Button, Field,
  Toggle, Sheet, EmptyState, Skeleton, Banner,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useCommunitySession } from '@/features/community/session';
import {
  useOpenKhatmCircles, useCreateKhatmCircle, useKhatmCircleByCode, JUZ_COUNT,
} from '@/features/community/khatmCircles';
import { usePro } from '@/features/pro/purchases';
import { communityLimits } from '@/features/pro/gates';

export default function KhatmCirclesScreen() {
  const t = useT();
  const theme = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const { userId } = useCommunitySession();
  const circles = useOpenKhatmCircles();
  const olustur = useCreateKhatmCircle(userId);
  // Katılmak herkese açık; grup kurmak Pro (D33).
  const kurabilir = communityLimits(usePro()).canCreateKhatm;

  const [yeniAcik, setYeniAcik] = useState(false);
  const [baslik, setBaslik] = useState('');
  const [amac, setAmac] = useState('');
  const [herkeseAcik, setHerkeseAcik] = useState(true);

  const [kod, setKod] = useState('');
  const kodlaGrup = useKhatmCircleByCode(kod.length >= 8 ? kod : null);

  if (!settings.community.enabled || !userId) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: t('community.khatmCircles') }} />
        <EmptyState icon="users" title={t('community.joinFirstTitle')} description={t('community.joinFirstBody')}
          actionLabel={t('community.title')} onAction={() => router.push('/community')} />
      </Screen>
    );
  }

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.khatmCircles') }} />
      <Text variant="callout" tone="muted">{t('community.khatmIntro')}</Text>

      <Row gap="sm" style={{ marginTop: theme.spacing.md }}>
        <Button label={t('community.newCircle')} icon={kurabilir ? 'plus' : 'lock'}
          onPress={() => (kurabilir ? setYeniAcik(true) : router.push('/pro'))} />
      </Row>
      {!kurabilir ? <Text variant="caption" tone="muted" style={{ marginTop: theme.spacing.xs }}>{t('pro.khatmLocked')}</Text> : null}

      <SectionHeader title={t('community.joinByCode')} />
      <Card padding="md">
        <Column gap="sm">
          <Field label={t('community.inviteCode')} value={kod} onChangeText={(v) => setKod(v.trim())} autoCapitalize="none" maxLength={8} />
          {kodlaGrup.data ? (
            <Button label={t('community.openCircle', { title: kodlaGrup.data.title })}
              onPress={() => router.push({ pathname: '/khatm-circle', params: { id: kodlaGrup.data!.id } })} />
          ) : kod.length >= 8 && !kodlaGrup.isFetching ? (
            <Text variant="caption" tone="muted">{t('community.codeNotFound')}</Text>
          ) : null}
        </Column>
      </Card>

      <SectionHeader title={t('community.openCircles')} />
      {circles.isLoading ? (
        <Column gap="sm"><Skeleton height={64} /><Skeleton height={64} /></Column>
      ) : (circles.data ?? []).length === 0 ? (
        <EmptyState icon="book" title={t('community.circlesEmptyTitle')} description={t('community.circlesEmptyBody')} />
      ) : (
        <Card padding="sm">
          {(circles.data ?? []).map((c) => (
            <ListItem key={c.id} title={c.title} subtitle={c.purpose || t('community.noPurpose')} icon="book"
              onPress={() => router.push({ pathname: '/khatm-circle', params: { id: c.id } })} />
          ))}
        </Card>
      )}

      <Sheet visible={yeniAcik} onClose={() => setYeniAcik(false)} title={t('community.newCircle')}>
        <Column gap="md" style={{ paddingBottom: theme.spacing.lg }}>
          <Field label={t('community.circleTitle')} value={baslik} onChangeText={setBaslik} maxLength={60} />
          <Field label={t('community.circlePurpose')} hint={t('community.circlePurposeHint')}
            value={amac} onChangeText={setAmac} maxLength={200} />
          <Toggle title={t('community.circlePublic')} subtitle={t('community.circlePublicHint')}
            value={herkeseAcik} onChange={setHerkeseAcik} />
          {olustur.isError ? <Banner tone="danger" title={t('community.postFailed')} /> : null}
          <Button
            label={t('community.create')}
            disabled={baslik.trim().length === 0}
            loading={olustur.isPending}
            onPress={() => {
              olustur.mutate({ title: baslik, purpose: amac, isPublic: herkeseAcik }, {
                onSuccess: (grup) => {
                  setYeniAcik(false); setBaslik(''); setAmac('');
                  router.push({ pathname: '/khatm-circle', params: { id: grup.id } });
                },
              });
            }}
            block
          />
          <Text variant="micro" tone="subtle">{t('community.circleJuzNote', { n: JUZ_COUNT })}</Text>
        </Column>
      </Sheet>
    </Screen>
  );
}
