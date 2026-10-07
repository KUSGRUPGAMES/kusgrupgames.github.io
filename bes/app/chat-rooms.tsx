/** Sohbet odaları listesi (D31) — sabit, konu başlıklı odalar. */
import React from 'react';
import { Stack, router } from 'expo-router';
import { Screen, Card, ListItem, EmptyState, Skeleton, Column } from '@/ui';
import { useT } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settings';
import { useCommunitySession } from '@/features/community/session';
import { useChatRooms } from '@/features/community/chat';

export default function ChatRoomsScreen() {
  const t = useT();
  const settings = useSettingsStore((s) => s.settings);
  const { userId } = useCommunitySession();
  const rooms = useChatRooms();

  if (!settings.community.enabled || !userId) {
    return (
      <Screen topInset={false} scroll>
        <Stack.Screen options={{ headerShown: true, title: t('community.chatRooms') }} />
        <EmptyState icon="users" title={t('community.joinFirstTitle')} description={t('community.joinFirstBody')}
          actionLabel={t('community.title')} onAction={() => router.push('/community')} />
      </Screen>
    );
  }

  return (
    <Screen topInset={false} scroll>
      <Stack.Screen options={{ headerShown: true, title: t('community.chatRooms') }} />
      {rooms.isLoading ? (
        <Column gap="sm"><Skeleton height={64} /><Skeleton height={64} /><Skeleton height={64} /></Column>
      ) : (
        <Card padding="sm">
          {(rooms.data ?? []).map((r) => (
            <ListItem key={r.id} title={r.title} subtitle={r.description} icon="message"
              onPress={() => router.push({ pathname: '/chat-room', params: { id: r.id, title: r.title } })} />
          ))}
        </Card>
      )}
    </Screen>
  );
}
