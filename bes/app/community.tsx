/**
 * Topluluk — giriş ekranı (D31).
 *
 * Uygulamanın geri kalanı hesapsız çalışır (D12); bu, kullanıcının kendi
 * isteğiyle açtığı TEK ağ bağlantılı, kimlikli özellik grubudur. Bu yüzden:
 * - Sunucu yapılandırılmamışsa (Supabase kurulmadıysa) sessizce "hazır değil" der.
 * - Yapılandırılmış olsa bile varsayılan **kapalı**dır; kullanıcı burada
 *   açıkça "katıl" demeden hiçbir veri gönderilmez/okunmaz.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router, Stack } from 'expo-router';
import {
  Screen, SectionHeader, Card, ListItem, Text, Column, Button, Field, Banner, EmptyState, Icon,
} from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { communityAvailable } from '@/features/community/client';
import { useCommunitySession, suggestNickname } from '@/features/community/session';
import { isValidNickname } from '@/features/community/nickname';

export default function CommunityScreen() {
  const t = useT();
  const theme = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const { hazir, userId, nickname, girisYap, takmaAdiGuncelle } = useCommunitySession();

  const [ad, setAd] = useState('');
  const [duzenle, setDuzenle] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState(false);

  const katildi = settings.community.enabled && Boolean(userId) && Boolean(nickname);

  if (!communityAvailable) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: t('community.title') }} />
        <EmptyState icon="users" title={t('community.notReadyTitle')} description={t('community.notReadyBody')} />
      </Screen>
    );
  }

  const katil = async () => {
    if (!isValidNickname(ad)) { setHata(true); return; }
    setHata(false);
    setGonderiliyor(true);
    const basarili = await girisYap(ad);
    setGonderiliyor(false);
    if (basarili) update({ community: { ...settings.community, enabled: true } });
  };

  const ayrilYaTemsilci = () => {
    update({ community: { ...settings.community, enabled: false } });
  };

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.title') }} />
      <Text variant="callout" tone="muted">{t('community.intro')}</Text>

      {!katildi ? (
        <>
          <Banner tone="info" title={t('community.privacyTitle')} description={t('community.privacyBody')}
            style={{ marginTop: theme.spacing.md }} />
          <Card padding="md" style={{ marginTop: theme.spacing.md }}>
            <Column gap="md">
              <Field
                label={t('community.nicknameLabel')}
                hint={t('community.nicknameHint')}
                value={ad}
                onChangeText={setAd}
                placeholder={hazir ? suggestNickname(userId ?? String(Date.now())) : ''}
                maxLength={24}
                error={hata ? t('community.nicknameError') : undefined}
              />
              <Button label={t('community.join')} onPress={() => { void katil(); }} loading={gonderiliyor} block />
            </Column>
          </Card>
          <Text variant="micro" tone="subtle" style={{ marginTop: theme.spacing.sm }}>
            {t('community.guidelinesNote')}
          </Text>
        </>
      ) : (
        <>
          <Card padding="sm" style={{ marginTop: theme.spacing.md }}>
            {duzenle ? (
              <Column gap="sm" style={{ padding: theme.spacing.md }}>
                <Field label={t('community.nicknameLabel')} value={ad || nickname || ''} onChangeText={setAd} maxLength={24} />
                <Button label={t('common.save')} onPress={() => {
                  void takmaAdiGuncelle(ad || nickname || '').then((ok) => { if (ok) setDuzenle(false); });
                }} />
              </Column>
            ) : (
              <ListItem
                title={t('community.you', { name: nickname ?? '' })}
                subtitle={t('community.editNickname')}
                icon="user"
                onPress={() => { setAd(nickname ?? ''); setDuzenle(true); }}
              />
            )}
          </Card>

          <SectionHeader title={t('community.featuresTitle')} />
          <Card padding="sm">
            <ListItem title={t('community.duaBoard')} subtitle={t('community.duaBoardHint')} icon="heart"
              onPress={() => router.push('/dua-board')} />
            <ListItem title={t('community.chatRooms')} subtitle={t('community.chatRoomsHint')} icon="message"
              onPress={() => router.push('/chat-rooms')} />
            <ListItem title={t('community.khatmCircles')} subtitle={t('community.khatmCirclesHint')} icon="book"
              onPress={() => router.push('/khatm-circles')} />
            <ListItem title={t('community.myRecords')} subtitle={t('community.myRecordsHint')} icon="chart"
              onPress={() => router.push('/khatm-history')} />
            <ListItem title={t('community.announcements')} icon="bell" onPress={() => router.push('/announcements')} />
            <ListItem title={t('community.infoArticles')} icon="info" onPress={() => router.push('/community-info')} />
          </Card>

          <SectionHeader title={t('community.safetyTitle')} />
          <Card padding="sm">
            <ListItem title={t('community.guidelines')} icon="info" onPress={() => router.push('/community-guidelines')} />
            <ListItem title={t('community.leave')} icon="close" onPress={ayrilYaTemsilci} />
          </Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginTop: theme.spacing.md }}>
            <Icon name="lock" size={14} color={theme.colors.textSubtle} />
            <Text variant="micro" tone="subtle" style={{ flex: 1 }}>{t('community.leaveNote')}</Text>
          </View>
        </>
      )}
    </Screen>
  );
}
