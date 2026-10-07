/**
 * Dua panosu (D31).
 *
 * "Dua ettim" sayısı görünür, kim ettiği gizlidir (riyadan/gösterişten
 * kaçınma niyeti — bkz. şema dosyasındaki not, ve Sahih Müslim 2732: bir
 * Müslümanın kardeşi için gıyabında ettiği dua, meleğin "sana da aynısı"
 * dediği makbul bir duadır). Kişi kendi isteğine gelen toplam sayıyı görür.
 */
import React, { useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Screen, Card, Text, Column, Row, Button, Field, Chip, Badge, Banner, EmptyState, Icon, Sheet, Skeleton,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT, type StringKey } from '@/lib/i18n';
import { useDateFormat } from '@/lib/i18n/dates';
import { useSettingsStore } from '@/store/settings';
import { useCommunitySession } from '@/features/community/session';
import {
  DUA_CATEGORIES, MAX_DUA_BODY, type DuaCategory, type DuaRequest,
  useDuaFeed, useMyDuaRequests, usePostDua, usePrayFor, usePrayedFor, useReportContent, useBlockUser, useBlockedIds,
} from '@/features/community/duaBoard';
import { containsBannedWord } from '@/features/community/wordFilter';
import { useProAccess } from '@/features/pro/useProAccess';
import { communityLimits, countInLast24h } from '@/features/pro/gates';

const KATEGORI_ADI: Record<DuaCategory, StringKey> = {
  saglik: 'community.catHealth', aile: 'community.catFamily', sinav_is: 'community.catExamWork',
  vefat: 'community.catDeceased', genel: 'community.catGeneral',
};

export default function DuaBoardScreen() {
  const t = useT();
  const theme = useTheme();
  const zaman = useDateFormat({ dateStyle: 'medium', timeStyle: 'short' });
  const settings = useSettingsStore((s) => s.settings);
  const { userId } = useCommunitySession();
  const feed = useDuaFeed(userId);
  const gonder = usePostDua(userId);
  const blocked = useBlockedIds(userId);
  const pro = useProAccess().has;

  const [kategori, setKategori] = useState<DuaCategory>('genel');
  const [metin, setMetin] = useState('');
  const [formAcik, setFormAcik] = useState(false);
  const [yalnizBenim, setYalnizBenim] = useState(false);
  const benim = useMyDuaRequests(yalnizBenim ? userId : null);

  if (!settings.community.enabled || !userId) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: t('community.duaBoard') }} />
        <EmptyState icon="users" title={t('community.joinFirstTitle')} description={t('community.joinFirstBody')}
          actionLabel={t('community.title')} onAction={() => router.push('/community')} />
      </Screen>
    );
  }

  const gorunurler = yalnizBenim
    ? (benim.data ?? [])
    : (feed.data ?? []).filter((r) => !blocked.data?.has(r.authorId));
  const aldigimDua = (benim.data ?? []).reduce((top, r) => top + r.prayerCount, 0);
  const yukleniyor = yalnizBenim ? benim.isLoading : feed.isLoading;
  // Günlük istek hakkı: ücretsizde 1, Pro'da 5 (sunucunun üst sınırı) — D33.
  const bugunkuIstek = countInLast24h((feed.data ?? []).filter((r) => r.benimMi).map((r) => r.createdAt));
  const hakBitti = bugunkuIstek >= communityLimits(pro).duaRequestsPerDay;

  return (
    <Screen topInset={false} scroll={false}>
      <Stack.Screen options={{ headerShown: true, title: t('community.duaBoard') }} />
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <Button label={t('community.newRequest')} icon="plus" onPress={() => setFormAcik(true)} block
          disabled={hakBitti} />
        {hakBitti && !pro ? (
          <Column gap="xs" style={{ marginTop: theme.spacing.sm }}>
            <Text variant="caption" tone="muted">{t('pro.duaLimit')}</Text>
            <Button label={t('pro.seePlans')} icon="star" size="sm" variant="secondary" onPress={() => router.push('/pro')} />
          </Column>
        ) : null}
        <Row gap="sm" style={{ marginTop: theme.spacing.md }}>
          <Chip label={t('community.allRequests')} selected={!yalnizBenim} onPress={() => setYalnizBenim(false)} />
          <Chip label={t('community.myRequests')} selected={yalnizBenim} onPress={() => setYalnizBenim(true)} />
        </Row>
        {yalnizBenim && benim.data ? (
          <Text variant="caption" tone="muted" style={{ marginTop: theme.spacing.sm }}>
            {t('community.myRequestsSummary', { n: benim.data.length, p: aldigimDua })}
          </Text>
        ) : null}
      </View>

      {yukleniyor ? (
        <Column gap="sm" style={{ padding: theme.spacing.lg }}>
          <Skeleton height={90} /><Skeleton height={90} /><Skeleton height={90} />
        </Column>
      ) : gorunurler.length === 0 ? (
        <EmptyState icon="heart" title={t('community.duaEmptyTitle')} description={t('community.duaEmptyBody')} />
      ) : (
        <FlatList
          data={gorunurler}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
          renderItem={({ item }) => (
            <DuaCard item={item} userId={userId} zamanBicimi={(iso) => zaman.format(new Date(iso))} />
          )}
        />
      )}

      <Sheet visible={formAcik} onClose={() => setFormAcik(false)} title={t('community.newRequest')}>
        <Column gap="md" style={{ paddingBottom: theme.spacing.lg }}>
          <Row gap="sm" wrap>
            {DUA_CATEGORIES.map((k) => (
              <Chip key={k} label={t(KATEGORI_ADI[k])} selected={kategori === k} onPress={() => setKategori(k)} />
            ))}
          </Row>
          <Field
            label={t('community.requestBody')}
            hint={t('community.requestBodyHint', { n: MAX_DUA_BODY })}
            value={metin}
            onChangeText={setMetin}
            multiline
            maxLength={MAX_DUA_BODY}
            inputStyle={{ minHeight: 96, paddingTop: theme.spacing.md, textAlignVertical: 'top' }}
          />
          {containsBannedWord(metin) ? <Banner tone="warning" title={t('community.bannedWordWarning')} /> : null}
          {gonder.isError ? <Banner tone="danger" title={t('community.postFailed')} /> : null}
          <Button
            label={t('community.send')}
            loading={gonder.isPending}
            disabled={metin.trim().length === 0 || containsBannedWord(metin)}
            onPress={() => {
              gonder.mutate({ category: kategori, body: metin }, {
                onSuccess: () => { setMetin(''); setFormAcik(false); },
              });
            }}
            block
          />
        </Column>
      </Sheet>
    </Screen>
  );
}

function DuaCard({ item, userId, zamanBicimi }: { item: DuaRequest; userId: string; zamanBicimi: (iso: string) => string }) {
  const t = useT();
  const theme = useTheme();
  const ettim = usePrayedFor(item.id, userId);
  const dua = usePrayFor(userId);
  const raporla = useReportContent();
  const engelle = useBlockUser();
  const [menuAcik, setMenuAcik] = useState(false);
  const [raporSebep, setRaporSebep] = useState('');
  const [raporAcik, setRaporAcik] = useState(false);

  return (
    <Card padding="md">
      <Column gap="sm">
        <Row align="center" gap="sm">
          <Badge label={t(KATEGORI_ADI[item.category])} tone="accent" />
          <Text variant="micro" tone="subtle" style={{ flex: 1, textAlign: 'right' }}>{zamanBicimi(item.createdAt)}</Text>
          {!item.benimMi ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('community.moreOptions')} onPress={() => setMenuAcik(true)} hitSlop={8}>
              <Icon name="info" size={18} color={theme.colors.textSubtle} />
            </Pressable>
          ) : null}
        </Row>
        <Text variant="body">{item.body}</Text>
        <Row align="center" gap="sm">
          {/* Kendi isteğine "Dua ettim" denmez: sayaç başkalarının duasını gösterir. */}
          {!item.benimMi ? (
            <Button
              label={ettim ? t('community.prayed') : t('community.prayForThis')}
              icon="heart"
              variant={ettim ? 'secondary' : 'primary'}
              size="sm"
              disabled={ettim || dua.isPending}
              onPress={() => dua.mutate(item.id)}
            />
          ) : <Icon name="heart" size={16} color={theme.colors.highlight} />}
          <Text variant="caption" tone="muted">
            {item.benimMi
              ? t('community.prayedForYouCount', { n: item.prayerCount })
              : t('community.prayerCount', { n: item.prayerCount })}
          </Text>
        </Row>
      </Column>

      <Sheet visible={menuAcik} onClose={() => setMenuAcik(false)} title={t('community.moreOptions')}>
        <Column gap="sm" style={{ paddingBottom: theme.spacing.lg }}>
          {!item.benimMi ? (
            <Button label={t('community.report')} variant="secondary" onPress={() => { setMenuAcik(false); setRaporAcik(true); }} />
          ) : null}
          {!item.benimMi ? (
            <Button label={t('community.block')} variant="danger" onPress={() => {
              engelle.mutate({ blockerId: userId, blockedId: item.authorId });
              setMenuAcik(false);
            }} />
          ) : null}
        </Column>
      </Sheet>

      <Sheet visible={raporAcik} onClose={() => setRaporAcik(false)} title={t('community.report')}>
        <Column gap="md" style={{ paddingBottom: theme.spacing.lg }}>
          <Field label={t('community.reportReason')} value={raporSebep} onChangeText={setRaporSebep} multiline
            inputStyle={{ minHeight: 72, textAlignVertical: 'top' }} />
          <Button label={t('community.send')} disabled={raporSebep.trim().length === 0}
            onPress={() => {
              raporla.mutate({ reporterId: userId, targetType: 'dua_request', targetId: item.id, reason: raporSebep });
              setRaporSebep(''); setRaporAcik(false);
            }} block />
        </Column>
      </Sheet>
    </Card>
  );
}
