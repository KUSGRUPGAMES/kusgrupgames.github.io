/**
 * Hatim grupları — D31. Bir Kur'an hatmini (30 cüz) birlikte tamamlamak
 * isteyen bir topluluk: her katılımcı istediği kadar cüz işaretler, okuyunca
 * "tamamladım" der; 30'u da bitince grup kendiliğinden "tamamlandı" olur
 * (bkz. migration'daki `khatm_check_complete` tetikleyicisi) ve bu, her
 * katılımcının kendi kayıtlarında kalıcı bir geçmiş oluşturur.
 *
 * Kişisel (tek başına) hatim takibi zaten var (`app/khatm.tsx`, tamamen
 * yerel) — bu, ondan bağımsız, ÇOK KİŞİLİ bir katman.
 */
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/log';
import { supabase } from './client';

const log = logger('hatim-grubu');

export const JUZ_COUNT = 30;

export interface KhatmCircle {
  id: string; title: string; purpose: string; createdBy: string; isPublic: boolean;
  inviteCode: string; createdAt: string; completedAt: string | null;
}

export interface JuzClaim {
  circleId: string; juzNo: number; claimedBy: string | null; claimedNickname: string | null;
  completed: boolean; completedAt: string | null;
}

export interface CircleProgress { claimed: number; completed: number; total: number }

export function computeProgress(claims: readonly JuzClaim[]): CircleProgress {
  return {
    claimed: claims.filter((c) => c.claimedBy !== null).length,
    completed: claims.filter((c) => c.completed).length,
    total: JUZ_COUNT,
  };
}

interface CircleRow {
  id: string; title: string; purpose: string; created_by: string; is_public: boolean;
  invite_code: string; created_at: string; completed_at: string | null;
}
interface ClaimRow {
  circle_id: string; juz_no: number; claimed_by: string | null; claimed_nickname: string | null;
  completed: boolean; completed_at: string | null;
}

function fromCircleRow(r: CircleRow): KhatmCircle {
  return {
    id: r.id, title: r.title, purpose: r.purpose, createdBy: r.created_by, isPublic: r.is_public,
    inviteCode: r.invite_code, createdAt: r.created_at, completedAt: r.completed_at,
  };
}
function fromClaimRow(r: ClaimRow): JuzClaim {
  return {
    circleId: r.circle_id, juzNo: r.juz_no, claimedBy: r.claimed_by, claimedNickname: r.claimed_nickname,
    completed: r.completed, completedAt: r.completed_at,
  };
}

/** Herkese açık, henüz tamamlanmamış gruplar — katılmak için göz atma listesi. */
export function useOpenKhatmCircles() {
  return useQuery({
    queryKey: ['khatm-circles-open'],
    enabled: Boolean(supabase),
    queryFn: async (): Promise<KhatmCircle[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('khatm_circles')
        .select('*').eq('is_public', true).is('completed_at', null)
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data as CircleRow[]).map(fromCircleRow);
    },
  });
}

/** Herkese açık/özel, tamamlanmış/tamamlanmamış — id ile tek bir grup. */
export function useKhatmCircleById(id: string | null) {
  return useQuery({
    queryKey: ['khatm-circle', id],
    enabled: Boolean(supabase && id),
    queryFn: async (): Promise<KhatmCircle | null> => {
      if (!supabase || !id) return null;
      const { data, error } = await supabase.from('khatm_circles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? fromCircleRow(data as CircleRow) : null;
    },
  });
}

export function useKhatmCircleByCode(code: string | null) {
  return useQuery({
    queryKey: ['khatm-circle-by-code', code],
    enabled: Boolean(supabase && code && code.length >= 4),
    queryFn: async (): Promise<KhatmCircle | null> => {
      if (!supabase || !code) return null;
      const { data, error } = await supabase.from('khatm_circles').select('*').eq('invite_code', code).maybeSingle();
      if (error) throw error;
      return data ? fromCircleRow(data as CircleRow) : null;
    },
  });
}

export function useCreateKhatmCircle(userId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (girdi: { title: string; purpose: string; isPublic: boolean }): Promise<KhatmCircle> => {
      if (!supabase || !userId) throw new Error('oturum yok');
      const { data, error } = await supabase.from('khatm_circles')
        .insert({ title: girdi.title.trim(), purpose: girdi.purpose.trim(), is_public: girdi.isPublic, created_by: userId })
        .select('*').single();
      if (error) throw error;
      return fromCircleRow(data as CircleRow);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['khatm-circles-open'] }); },
    onError: (e) => log.warn('grup oluşturulamadı', { error: e }),
  });
}

/** Bir grubun 30 cüzü + gerçek zamanlı güncellemeler. */
export function useKhatmCircleClaims(circleId: string | null) {
  const [claims, setClaims] = useState<JuzClaim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!supabase || !circleId) { setYukleniyor(false); return; }
    let alive = true;
    setYukleniyor(true);
    void supabase.from('khatm_juz_claims').select('*').eq('circle_id', circleId).order('juz_no')
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { log.warn('cüzler okunamadı', { error }); setYukleniyor(false); return; }
        setClaims((data as ClaimRow[]).map(fromClaimRow));
        setYukleniyor(false);
      });

    const kanal = supabase.channel(`hatim-${circleId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'khatm_juz_claims', filter: `circle_id=eq.${circleId}` },
        (payload) => {
          const guncel = fromClaimRow(payload.new as ClaimRow);
          setClaims((onceki) => onceki.map((c) => (c.juzNo === guncel.juzNo ? guncel : c)));
        })
      .subscribe();

    return () => { alive = false; void supabase?.removeChannel(kanal); };
  }, [circleId]);

  return { claims, yukleniyor };
}

export function useClaimJuz(userId: string | null, nickname: string | null) {
  return useMutation({
    mutationFn: async ({ circleId, juzNo }: { circleId: string; juzNo: number }) => {
      if (!supabase || !userId) throw new Error('oturum yok');
      const { error } = await supabase.from('khatm_juz_claims')
        .update({ claimed_by: userId, claimed_nickname: nickname })
        .eq('circle_id', circleId).eq('juz_no', juzNo).is('claimed_by', null);
      if (error) throw error;
    },
    onError: (e) => log.warn('cüz alınamadı', { error: e }),
  });
}

export function useReleaseJuz() {
  return useMutation({
    mutationFn: async ({ circleId, juzNo }: { circleId: string; juzNo: number }) => {
      if (!supabase) throw new Error('sunucu yok');
      const { error } = await supabase.from('khatm_juz_claims')
        .update({ claimed_by: null, claimed_nickname: null, completed: false, completed_at: null })
        .eq('circle_id', circleId).eq('juz_no', juzNo);
      if (error) throw error;
    },
    onError: (e) => log.warn('cüz bırakılamadı', { error: e }),
  });
}

export function useCompleteJuz() {
  return useMutation({
    mutationFn: async ({ circleId, juzNo }: { circleId: string; juzNo: number }) => {
      if (!supabase) throw new Error('sunucu yok');
      const { error } = await supabase.from('khatm_juz_claims')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('circle_id', circleId).eq('juz_no', juzNo);
      if (error) throw error;
    },
    onError: (e) => log.warn('cüz tamamlanamadı', { error: e }),
  });
}

export interface HatimGecmisi { circleTitle: string; juzNo: number; completedAt: string; circleCompletedAt: string | null }

/** Kayıtlarım: tamamladığım her cüz, hangi grupta, grup ne zaman bitti. */
export function useMyKhatmHistory(userId: string | null) {
  return useQuery({
    queryKey: ['khatm-history', userId],
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<HatimGecmisi[]> => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase.from('khatm_juz_claims')
        .select('juz_no, completed_at, khatm_circles(title, completed_at)')
        .eq('claimed_by', userId).eq('completed', true).order('completed_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Array<{ juz_no: number; completed_at: string; khatm_circles: { title: string; completed_at: string | null } }>)
        .map((r) => ({
          circleTitle: r.khatm_circles.title, juzNo: r.juz_no,
          completedAt: r.completed_at, circleCompletedAt: r.khatm_circles.completed_at,
        }));
    },
  });
}
