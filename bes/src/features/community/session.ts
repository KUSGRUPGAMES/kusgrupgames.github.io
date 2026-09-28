/**
 * Topluluk oturumu — anonim giriş + takma ad (D31).
 *
 * `supabase.auth.signInAnonymously()` cihaz başına kararlı bir `auth.uid()`
 * üretir; oturum `AsyncStorage`te tutulur (bkz. `client.ts`), bir daha
 * girişe gerek kalmaz. E-posta/şifre/Apple girişi **yok** — bu modülün
 * bilerek hesapsız kalan uygulamaya en az sürtünmeyle eklenmesi gerekiyordu.
 */
import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/log';
import { supabase, communityAvailable } from './client';
import { isValidNickname, suggestNickname } from './nickname';

const log = logger('topluluk');

export interface CommunitySession {
  hazir: boolean;
  userId: string | null;
  nickname: string | null;
  hata: string | null;
  /** Anonim girişi başlatır ve profili (takma adla) oluşturur/günceller. */
  girisYap: (nickname: string) => Promise<boolean>;
  takmaAdiGuncelle: (nickname: string) => Promise<boolean>;
}

export function useCommunitySession(): CommunitySession {
  const [hazir, setHazir] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) { setHazir(true); return; }
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        const uid = data.session?.user.id ?? null;
        setUserId(uid);
        if (uid) {
          const { data: profil } = await supabase.from('profiles').select('nickname').eq('id', uid).maybeSingle();
          if (alive) setNickname(profil?.nickname ?? null);
        }
      } catch (e) {
        log.warn('oturum okunamadı', { error: e });
      } finally {
        if (alive) setHazir(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const girisYap = useCallback(async (istenenAd: string): Promise<boolean> => {
    if (!supabase) return false;
    const ad = istenenAd.trim();
    if (!isValidNickname(ad)) { setHata('nickname'); return false; }
    setHata(null);
    try {
      let uid = userId;
      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) throw error ?? new Error('oturum açılamadı');
        uid = data.user.id;
      }
      const { error: profilHata } = await supabase.from('profiles')
        .upsert({ id: uid, nickname: ad }, { onConflict: 'id' });
      if (profilHata) throw profilHata;
      setUserId(uid);
      setNickname(ad);
      return true;
    } catch (e) {
      log.warn('topluluğa katılım başarısız', { error: e });
      setHata('network');
      return false;
    }
  }, [userId]);

  const takmaAdiGuncelle = useCallback(async (yeniAd: string): Promise<boolean> => {
    if (!supabase || !userId) return false;
    const ad = yeniAd.trim();
    if (!isValidNickname(ad)) return false;
    try {
      const { error } = await supabase.from('profiles').update({ nickname: ad }).eq('id', userId);
      if (error) throw error;
      setNickname(ad);
      return true;
    } catch (e) {
      log.warn('takma ad güncellenemedi', { error: e });
      return false;
    }
  }, [userId]);

  return { hazir, userId, nickname, hata, girisYap, takmaAdiGuncelle };
}

export { communityAvailable, suggestNickname };
