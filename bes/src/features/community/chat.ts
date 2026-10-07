/**
 * Sohbet odaları — D31.
 *
 * Bilerek **sabit, konu başlıklı** odalar (`chat_rooms` migration'da
 * tohumlanır); rastgele eşleştirme ya da özel (1'e1) mesajlaşma YOK. Apple'ın
 * 1.2 kuralı rastgele/anonim sohbeti ayrıca sıkı denetliyor; sabit odalar
 * hem daha güvenli hem şikâyet/engelleme ile denetlenmesi daha basit.
 */
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/log';
import { supabase } from './client';

const log = logger('sohbet');

export const MAX_MESSAGE_BODY = 500;

export interface ChatRoom {
  id: string; slug: string; title: string; description: string;
}

export interface ChatMessage {
  id: string; roomId: string; authorId: string; nickname: string; body: string; createdAt: string;
}

export function validMessageBody(body: string): boolean {
  const t = body.trim();
  return t.length >= 1 && t.length <= MAX_MESSAGE_BODY;
}

interface RoomRow { id: string; slug: string; title: string; description: string; sort_order: number }
interface MessageRow {
  id: string; room_id: string; author_id: string; nickname: string; body: string; created_at: string;
  is_hidden?: boolean;
}

export function useChatRooms() {
  return useQuery({
    queryKey: ['chat-rooms'],
    enabled: Boolean(supabase),
    queryFn: async (): Promise<ChatRoom[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('chat_rooms').select('*').order('sort_order');
      if (error) throw error;
      return (data as RoomRow[]).map((r) => ({ id: r.id, slug: r.slug, title: r.title, description: r.description }));
    },
  });
}

const KAYIT_SINIRI = 200;

/** Geçmiş mesajlar + gerçek zamanlı yeni mesaj aboneliği. */
export function useChatMessages(roomId: string | null) {
  const [mesajlar, setMesajlar] = useState<ChatMessage[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!supabase || !roomId) { setYukleniyor(false); return; }
    let alive = true;
    setYukleniyor(true);
    void supabase.from('chat_messages').select('*').eq('room_id', roomId).eq('is_hidden', false)
      .order('created_at', { ascending: false }).limit(KAYIT_SINIRI)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { log.warn('mesajlar okunamadı', { error }); setYukleniyor(false); return; }
        const satirlar = (data as MessageRow[]).map(fromMessageRow).reverse();
        setMesajlar(satirlar);
        setYukleniyor(false);
      });

    const kanal = supabase.channel(`oda-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          const yeni = fromMessageRow(payload.new as MessageRow);
          setMesajlar((onceki) => (onceki.some((m) => m.id === yeni.id) ? onceki : [...onceki, yeni].slice(-KAYIT_SINIRI)));
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          // Yalnız "gizle" güncellemesi olabilir (mesajlar başka türlü
          // değişmez) — gizlenen mesaj listeden kaldırılır.
          const guncel = payload.new as MessageRow;
          if (guncel.is_hidden) setMesajlar((onceki) => onceki.filter((m) => m.id !== guncel.id));
        })
      .subscribe();

    return () => { alive = false; void supabase?.removeChannel(kanal); };
  }, [roomId]);

  return { mesajlar, yukleniyor };
}

function fromMessageRow(r: MessageRow): ChatMessage {
  return { id: r.id, roomId: r.room_id, authorId: r.author_id, nickname: r.nickname, body: r.body, createdAt: r.created_at };
}

export function useSendMessage(userId: string | null, nickname: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, body }: { roomId: string; body: string }) => {
      if (!supabase || !userId || !nickname) throw new Error('oturum yok');
      if (!validMessageBody(body)) throw new Error('geçersiz mesaj');
      const { error } = await supabase.from('chat_messages')
        .insert({ room_id: roomId, author_id: userId, nickname, body: body.trim() });
      if (error) throw error;
    },
    onError: (e) => { log.warn('mesaj gönderilemedi', { error: e }); void qc.invalidateQueries(); },
  });
}

/** Kullanıcı kendi mesajını gizler (silme değil — geri alınamaz bir "sil"). */
export function useHideOwnMessage() {
  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!supabase) throw new Error('sunucu yok');
      const { error } = await supabase.from('chat_messages').update({ is_hidden: true }).eq('id', messageId);
      if (error) throw error;
    },
    onError: (e) => log.warn('mesaj gizlenemedi', { error: e }),
  });
}
