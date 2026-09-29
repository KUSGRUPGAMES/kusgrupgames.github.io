/**
 * Topluluk oturumu — Google/Apple girişi + takma ad (D31, D32).
 *
 * Kimlik `auth.ts`'ten gelir (Google ya da Apple). Bu kanca yalnız o
 * kimliğe bağlı **profili** yönetir: toplulukta başkalarına görünen tek şey
 * kullanıcının seçtiği takma addır; e-posta hiçbir ekranda gösterilmez.
 *
 * Anonim giriş (D31'in ilk hâli) kaldırıldı: anonim oturum giriş sayılmaz,
 * `girisYap` önce Google/Apple girişi ister.
 */
import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/log';
import { supabase, communityAvailable } from './client';
import { useOturum } from './auth';
import { isValidNickname, suggestNickname } from './nickname';

const log = logger('topluluk');

export interface CommunitySession {
  hazir: boolean;
  /** Google/Apple ile giriş yapılmış mı. */
  girisli: boolean;
  userId: string | null;
  nickname: string | null;
  hata: string | null;
  /** Girişli kullanıcının profilini (takma adla) oluşturur/günceller. */
  girisYap: (nickname: string) => Promise<boolean>;
  takmaAdiGuncelle: (nickname: string) => Promise<boolean>;
}

export function useCommunitySession(): CommunitySession {
  const oturum = useOturum();
  const userId = oturum.girisli ? oturum.session?.user.id ?? null : null;
  const [profilHazir, setProfilHazir] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!oturum.hazir) return;
    if (!supabase || !userId) { setNickname(null); setProfilHazir(true); return; }
    let alive = true;
    setProfilHazir(false);
    (async () => {
      try {
        const { data: profil } = await supabase.from('profiles').select('nickname').eq('id', userId).maybeSingle();
        if (alive) setNickname(profil?.nickname ?? null);
      } catch (e) {
        log.warn('profil okunamadı', { error: e });
      } finally {
        if (alive) setProfilHazir(true);
      }
    })();
    return () => { alive = false; };
  }, [oturum.hazir, userId]);

  const girisYap = useCallback(async (istenenAd: string): Promise<boolean> => {
    if (!supabase) return false;
    if (!userId) { setHata('auth'); return false; }
    const ad = istenenAd.trim();
    if (!isValidNickname(ad)) { setHata('nickname'); return false; }
    setHata(null);
    try {
      const { error: profilHata } = await supabase.from('profiles')
        .upsert({ id: userId, nickname: ad }, { onConflict: 'id' });
      if (profilHata) throw profilHata;
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

  return {
    hazir: oturum.hazir && profilHazir,
    girisli: oturum.girisli,
    userId, nickname, hata, girisYap, takmaAdiGuncelle,
  };
}

export { communityAvailable, suggestNickname };
