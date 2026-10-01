/**
 * Sohbet odası (D31) — metin tabanlı, gerçek zamanlı. Görsel/medya paylaşımı
 * bilerek yok: moderasyon yükünü makul tutmak için kapsam dışı bırakıldı.
 */
import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen, Text, Column, Row, Field, Button, Sheet, EmptyState } from '@/ui';
import { useTheme } from '@/theme/ThemeProvider';
import { useT } from '@/lib/i18n';
import { useDateFormat } from '@/lib/i18n/dates';
import { useSettingsStore } from '@/store/settings';
import { useCommunitySession } from '@/features/community/session';
import {
  MAX_MESSAGE_BODY, type ChatMessage,
  useChatMessages, useSendMessage, useHideOwnMessage,
} from '@/features/community/chat';
import { useReportContent, useBlockUser, useBlockedIds } from '@/features/community/duaBoard';
import { containsBannedWord } from '@/features/community/wordFilter';
import { useProAccess } from '@/features/pro/useProAccess';
import { communityLimits } from '@/features/pro/gates';
import { ProFeatureNote } from '@/features/pro/ProFeatureNote';

export default function ChatRoomScreen() {
  const t = useT();
  const theme = useTheme();
  const saat = useDateFormat({ timeStyle: 'short' });
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const settings = useSettingsStore((s) => s.settings);
  const { userId, nickname } = useCommunitySession();
  const { mesajlar } = useChatMessages(id ?? null);
  const gonder = useSendMessage(userId, nickname);
  const blocked = useBlockedIds(userId);
  // Okumak herkese açık; yazmak Pro (D33).
  const yazabilir = communityLimits(useProAccess().has).canChat;
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [metin, setMetin] = useState('');

  if (!settings.community.enabled || !userId) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: title ?? t('community.chatRooms') }} />
        <EmptyState icon="users" title={t('community.joinFirstTitle')} description={t('community.joinFirstBody')}
          actionLabel={t('community.title')} onAction={() => router.push('/community')} />
      </Screen>
    );
  }

  const gorunurler = mesajlar.filter((m) => !blocked.data?.has(m.authorId));

  const yasakliKelime = containsBannedWord(metin);

  const gonderVeTemizle = () => {
    const gonderilecek = metin;
    if (gonderilecek.trim().length === 0 || !id || containsBannedWord(gonderilecek)) return;
    setMetin('');
    gonder.mutate({ roomId: id, body: gonderilecek });
  };

  return (
    <Screen topInset={false} scroll={false}>
      <Stack.Screen options={{ headerShown: true, title: title ?? t('community.chatRooms') }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={gorunurler}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <Mesaj item={item} kendim={item.authorId === userId} userId={userId} saatBicimi={(iso) => saat.format(new Date(iso))} />
          )}
        />
        {yasakliKelime ? (
          <Text variant="caption" tone="danger" style={{ paddingHorizontal: theme.spacing.lg }}>
            {t('community.bannedWordWarning')}
          </Text>
        ) : null}
        {!yazabilir ? (
          <Column gap="sm" style={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xs }}>
            <Text variant="caption" tone="muted">{t('pro.chatLocked')}</Text>
            <Button label={t('pro.seePlans')} icon="star" size="sm" onPress={() => router.push('/pro')} />
          </Column>
        ) : (
        <Column>
        <ProFeatureNote style={{ paddingHorizontal: theme.spacing.lg }} />
        <Row gap="sm" align="center" style={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xs }}>
          <View style={{ flex: 1 }}>
            <Field
              label={t('community.messageLabel')}
              value={metin}
              onChangeText={setMetin}
              maxLength={MAX_MESSAGE_BODY}
              onSubmitEditing={gonderVeTemizle}
              returnKeyType="send"
            />
          </View>
          <Button label={t('community.send')} icon="share" size="sm" disabled={metin.trim().length === 0 || yasakliKelime}
            loading={gonder.isPending} onPress={gonderVeTemizle} />
        </Row>
        </Column>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Mesaj({ item, kendim, userId, saatBicimi }: {
  item: ChatMessage; kendim: boolean; userId: string; saatBicimi: (iso: string) => string;
}) {
  const t = useT();
  const theme = useTheme();
  const gizle = useHideOwnMessage();
  const raporla = useReportContent();
  const engelle = useBlockUser();
  const [menuAcik, setMenuAcik] = useState(false);
  const [raporAcik, setRaporAcik] = useState(false);
  const [raporSebep, setRaporSebep] = useState('');

  return (
    <Pressable
      onLongPress={() => setMenuAcik(true)}
      accessibilityRole="button"
      accessibilityLabel={`${item.nickname}: ${item.body}`}
      accessibilityHint={t('community.moreOptions')}
      style={{ alignItems: kendim ? 'flex-end' : 'flex-start' }}
    >
      <View style={{ maxWidth: '82%', padding: theme.spacing.md, borderRadius: theme.radius.lg,
        backgroundColor: kendim ? theme.colors.accentSurface : theme.colors.surfaceRaised }}>
        {!kendim ? <Text variant="caption" tone="highlight" style={{ marginBottom: 2 }}>{item.nickname}</Text> : null}
        <Text tone={kendim ? 'onAccent' : 'default'}>{item.body}</Text>
        <Text variant="micro" tone={kendim ? 'onAccent' : 'subtle'} style={{ marginTop: 2, opacity: 0.75 }}>
          {saatBicimi(item.createdAt)}
        </Text>
      </View>

      <Sheet visible={menuAcik} onClose={() => setMenuAcik(false)} title={t('community.moreOptions')}>
        <Column gap="sm" style={{ paddingBottom: theme.spacing.lg }}>
          {kendim ? (
            <Button label={t('community.deleteMessage')} variant="danger"
              onPress={() => { gizle.mutate(item.id); setMenuAcik(false); }} />
          ) : (
            <>
              <Button label={t('community.report')} variant="secondary"
                onPress={() => { setMenuAcik(false); setRaporAcik(true); }} />
              <Button label={t('community.block')} variant="danger"
                onPress={() => { engelle.mutate({ blockerId: userId, blockedId: item.authorId }); setMenuAcik(false); }} />
            </>
          )}
        </Column>
      </Sheet>

      <Sheet visible={raporAcik} onClose={() => setRaporAcik(false)} title={t('community.report')}>
        <Column gap="md" style={{ paddingBottom: theme.spacing.lg }}>
          <Field label={t('community.reportReason')} value={raporSebep} onChangeText={setRaporSebep} multiline
            inputStyle={{ minHeight: 72, textAlignVertical: 'top' }} />
          <Button label={t('community.send')} disabled={raporSebep.trim().length === 0}
            onPress={() => {
              raporla.mutate({ reporterId: userId, targetType: 'chat_message', targetId: item.id, reason: raporSebep });
              setRaporSebep(''); setRaporAcik(false);
            }} block />
        </Column>
      </Sheet>
    </Pressable>
  );
}
