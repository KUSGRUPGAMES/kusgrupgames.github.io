/**
 * Dua panosu — D31.
 *
 * "Dua ettim" sayısı görünür, kim ettiği görünmez (riyadan kaçınma; bkz.
 * migration'daki not). Zorunlu kaynak künyesi kuralı burada geçerli değil:
 * bu kullanıcı üretimi içerik, âyet/meal değil.
 */
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/log';
import { supabase } from './client';

const log = logger('dua-panosu');

export const DUA_CATEGORIES = ['saglik', 'aile', 'sinav_is', 'vefat', 'genel'] as const;
export type DuaCategory = typeof DUA_CATEGORIES[number];

export const MAX_DUA_BODY = 280;
export const DAILY_DUA_LIMIT = 5;

export interface DuaRequest {
  id: string;
  authorId: string;
  category: DuaCategory;
  body: string;
  prayerCount: number;
  createdAt: string;
  benimMi: boolean;
}

export function validDuaBody(body: string): boolean {
  const t = body.trim();
  return t.length >= 1 && t.length <= MAX_DUA_BODY;
}

interface Row {
  id: string; author_id: string; category: string; body: string;
  prayer_count: number; created_at: string;
}

function fromRow(r: Row, benId: string | null): DuaRequest {
  return {
    id: r.id, authorId: r.author_id,
    category: (DUA_CATEGORIES as readonly string[]).includes(r.category) ? (r.category as DuaCategory) : 'genel',
    body: r.body, prayerCount: r.prayer_count, createdAt: r.created_at, benimMi: r.author_id === benId,
  };
}

export function useDuaFeed(userId: string | null) {
  return useQuery({
    // Kullanıcı kimliği anahtarda: oturum gelmeden yüklenen akış, istekleri
    // "benim değil" diye işaretleyip önbellekte kalıyordu — kişi kendi
    // isteğine "Dua ettim" diyebiliyor, "X kişi senin için dua etti"yi
    // göremiyordu (1 Ekim, mağaza karesinde fark edildi).
    queryKey: ['dua-feed', userId],
    enabled: Boolean(supabase),
    queryFn: async (): Promise<DuaRequest[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('dua_requests').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data as Row[]).map((r) => fromRow(r, userId));
    },
  });
}

export function usePostDua(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ category, body }: { category: DuaCategory; body: string }) => {
      if (!supabase || !userId) throw new Error('oturum yok');
      if (!validDuaBody(body)) throw new Error('geçersiz metin');
      const { error } = await supabase.from('dua_requests')
        .insert({ author_id: userId, category, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dua-feed'] });
      void qc.invalidateQueries({ queryKey: ['dua-mine'] });
    },
    onError: (e) => log.warn('dua isteği gönderilemedi', { error: e }),
  });
}

/** Bu istek için zaten dua edip etmediğimi (cihazda) hatırlar. */
export function usePrayedFor(requestId: string, userId: string | null) {
  const [ettim, setEttim] = useState(false);
  useEffect(() => {
    if (!supabase || !userId) return;
    let alive = true;
    void supabase.from('dua_prayers').select('user_id').eq('request_id', requestId).eq('user_id', userId)
      .maybeSingle().then(({ data }) => { if (alive && data) setEttim(true); });
    return () => { alive = false; };
  }, [requestId, userId]);
  return ettim;
}

export function usePrayFor(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!supabase || !userId) throw new Error('oturum yok');
      const { error } = await supabase.from('dua_prayers').insert({ request_id: requestId, user_id: userId });
      // Aynı isteğe ikinci kez basmak birincil anahtar çakışmasıyla
      // sessizce yok sayılır — kullanıcıya hata göstermeye gerek yok.
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['dua-feed'] });
      void qc.invalidateQueries({ queryKey: ['dua-mine'] });
    },
    onError: (e) => log.warn('dua ettim işaretlenemedi', { error: e }),
  });
}

export const useReportContent = () => {
  return useMutation({
    mutationFn: async (girdi: { reporterId: string; targetType: 'dua_request' | 'chat_message'; targetId: string; reason: string }) => {
      if (!supabase) throw new Error('sunucu yok');
      const { error } = await supabase.from('reports').insert({
        reporter_id: girdi.reporterId, target_type: girdi.targetType, target_id: girdi.targetId, reason: girdi.reason,
      });
      if (error) throw error;
    },
    onError: (e) => log.warn('şikâyet gönderilemedi', { error: e }),
  });
};

export const useBlockUser = () => {
  return useMutation({
    mutationFn: async (girdi: { blockerId: string; blockedId: string }) => {
      if (!supabase) throw new Error('sunucu yok');
      const { error } = await supabase.from('blocks')
        .insert({ blocker_id: girdi.blockerId, blocked_id: girdi.blockedId });
      if (error && error.code !== '23505') throw error;
    },
    onError: (e) => log.warn('engellenemedi', { error: e }),
  });
};

export function useBlockedIds(userId: string | null) {
  return useQuery({
    queryKey: ['blocked-ids', userId],
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<Set<string>> => {
      if (!supabase || !userId) return new Set();
      const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId);
      if (error) throw error;
      return new Set((data ?? []).map((r: { blocked_id: string }) => r.blocked_id));
    },
  });
}

/**
 * Kullanıcının bütün dua istekleri (akıştaki son 100 sınırı yok) — "İsteklerim"
 * görünümü. Aynı hesapla başka telefonda giriş yapınca da aynı geçmiş gelir.
 */
export function useMyDuaRequests(userId: string | null) {
  return useQuery({
    queryKey: ['dua-mine', userId],
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<DuaRequest[]> => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase
        .from('dua_requests').select('*').eq('author_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Row[]).map((r) => fromRow(r, userId));
    },
  });
}
