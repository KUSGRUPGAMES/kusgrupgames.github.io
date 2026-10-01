/**
 * Pro erişimi — çalışma zamanı (kurallar `access.ts`te).
 *
 * Satış açıksa (1.0.1) ve kullanıcı giriş yapmışsa, satın almamışsa sunucudan
 * bir kerelik 14 günlük denemeyi başlatır/okur. Satış kapalıyken (1.0) sunucuya
 * hiçbir şey sormaz: Pro özellikleri herkese açıktır.
 */
import { useEffect } from 'react';
import Constants from 'expo-constants';
import { create } from 'zustand';
import { supabase } from '@/features/community/client';
import { useOturum } from '@/features/community/auth';
import { logger } from '@/lib/log';
import { usePro } from './purchases';
import { proAccess, type Access } from './access';

const log = logger('pro-deneme');

export const PRO_SALES_ENABLED = (Constants.expoConfig?.extra as { proSales?: boolean } | undefined)?.proSales === true;

interface TrialState { uid: string | null; endsAt: number | null }
const useTrialStore = create<TrialState>(() => ({ uid: null, endsAt: null }));

/** Pro özelliğine erişim (kilitler buna bakar). Reklamsızlık için `usePro()`. */
export function useProAccess(): Access {
  const purchased = usePro();
  const { girisli, session } = useOturum();
  const trial = useTrialStore();
  const endsAt = girisli && session && trial.uid === session.user.id ? trial.endsAt : null;
  return proAccess({ purchased, salesEnabled: PRO_SALES_ENABLED, trialEndsAt: endsAt, now: Date.now() });
}

/** Kök bileşende bir kez: girişte denemeyi başlatır ya da okur. */
export function useProTrialSync(): void {
  const purchased = usePro();
  const { girisli, session } = useOturum();
  const uid = girisli ? session?.user.id ?? null : null;
  useEffect(() => {
    if (!PRO_SALES_ENABLED || !uid || purchased || !supabase) {
      if (!uid) useTrialStore.setState({ uid: null, endsAt: null });
      return;
    }
    let alive = true;
    void supabase.rpc('start_pro_trial').then(({ data, error }) => {
      if (!alive) return;
      if (error) { log.warn('deneme alınamadı', { error }); return; }
      const t = typeof data === 'string' ? Date.parse(data) : NaN;
      useTrialStore.setState({ uid, endsAt: Number.isFinite(t) ? t : null });
    });
    return () => { alive = false; };
  }, [uid, purchased]);
}
