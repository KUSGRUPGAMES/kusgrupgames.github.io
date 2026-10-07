/**
 * Topluluk kimliği — Google / Apple ile giriş (D32).
 *
 * Giriş **isteğe bağlıdır**: onboarding'de atlanabilir bir adım olarak
 * sorulur, yalnız Topluluk için gerekir. Uygulamanın geri kalanı hesapsız
 * çalışmaya devam eder (D12) — App Review 5.1.1(v) hesap gerektirmeyen
 * özelliği girişe bağlamayı reddeder.
 *
 * - **Apple**: iOS'un kendi paneli (`expo-apple-authentication`), kimlik
 *   belirteci Supabase'e `signInWithIdToken` ile verilir. Nonce ham hâliyle
 *   Supabase'e, SHA-256 özetiyle Apple'a gider; ikisi eşleşmezse sunucu
 *   reddeder (tekrar oynatma koruması).
 * - **Google**: Supabase'in OAuth akışı, sistemin güvenli tarayıcı
 *   oturumunda (`ASWebAuthenticationSession` / Custom Tabs). Uygulamaya
 *   Google SDK'sı girmez; dönüş `bes://auth-callback`'e PKCE koduyla gelir.
 *
 * Apple kuralı 4.8: iOS'ta Google girişi sunan uygulama Apple girişini de
 * sunmak zorunda. Android'de Apple düğmesi gösterilmez.
 *
 * Apple kuralı 5.1.1(v): hesap açtıran uygulama, uygulama içinden hesap
 * silmeyi de sunmak zorunda — `hesabiSil()`, sunucudaki `delete_my_account()`
 * işlevini çağırır (migration 0003).
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { logger } from '@/lib/log';
import { supabase } from './client';

const log = logger('kimlik');

WebBrowser.maybeCompleteAuthSession();

export type GirisSonucu = 'ok' | 'cancelled' | 'error';
export type Saglayici = 'apple' | 'google';

/** Google dönüş adresi — Supabase panosunda "Redirect URLs" listesine yazılır. */
export const AUTH_REDIRECT = Linking.createURL('auth-callback');

/** Apple girişi bu cihazda kullanılabilir mi (iOS 13+; Android'de yok). */
export async function appleKullanilabilir(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function appleIleGiris(): Promise<GirisSonucu> {
  if (!supabase) return 'error';
  try {
    const hamNonce = Crypto.randomUUID();
    const ozet = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, hamNonce);
    // Ad istenmez: topluluk takma adla çalışır. E-posta Apple'ın gizleme
    // seçeneğiyle gelebilir; yalnız hesabı tanımak için tutulur, kimseye
    // gösterilmez.
    const kimlik = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: ozet,
    });
    if (!kimlik.identityToken) return 'error';
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple', token: kimlik.identityToken, nonce: hamNonce,
    });
    if (error) throw error;
    return 'ok';
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return 'cancelled';
    log.warn('Apple girişi başarısız', { error: e });
    return 'error';
  }
}

export async function googleIleGiris(): Promise<GirisSonucu> {
  if (!supabase) return 'error';
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: AUTH_REDIRECT, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw error ?? new Error('OAuth adresi alınamadı');
    const sonuc = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT);
    if (sonuc.type !== 'success') return 'cancelled';
    const { queryParams } = Linking.parse(sonuc.url);
    const kod = typeof queryParams?.code === 'string' ? queryParams.code : null;
    if (!kod) {
      log.warn('Google dönüşünde kod yok', { error: queryParams?.error_description });
      return 'error';
    }
    const { error: degisimHata } = await supabase.auth.exchangeCodeForSession(kod);
    if (degisimHata) throw degisimHata;
    return 'ok';
  } catch (e) {
    log.warn('Google girişi başarısız', { error: e });
    return 'error';
  }
}

export async function cikisYap(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    log.warn('çıkış başarısız', { error: e });
  }
}

/**
 * Hesabı ve toplulukta paylaşılan her şeyi siler. Sunucu tarafı
 * `auth.users` satırını siler; bütün topluluk tabloları ona `on delete
 * cascade` ile bağlı (hatim cüzleri `set null` — grup bozulmaz).
 */
export async function hesabiSil(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    await supabase.auth.signOut({ scope: 'local' });
    return true;
  } catch (e) {
    log.warn('hesap silinemedi', { error: e });
    return false;
  }
}

export interface Oturum {
  hazir: boolean;
  session: Session | null;
  /** Anonim oturum (eski sürümden kalma) giriş sayılmaz. */
  girisli: boolean;
  email: string | null;
  saglayici: string | null;
}

/** Oturumu dinler; giriş/çıkış bütün ekranlara anında yansır. */
export function useOturum(): Oturum {
  const [hazir, setHazir] = useState(!supabase);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setHazir(true);
    }).catch(() => { if (alive) setHazir(true); });
    const { data } = supabase.auth.onAuthStateChange((_olay, yeni) => { if (alive) setSession(yeni); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  const user = session?.user ?? null;
  return {
    hazir,
    session,
    girisli: Boolean(user && !user.is_anonymous),
    email: user?.email ?? null,
    saglayici: (user?.app_metadata?.provider as string | undefined) ?? null,
  };
}
