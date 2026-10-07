/**
 * Topluluk modülü — Supabase istemcisi (D31).
 *
 * Uygulamanın geri kalanı **hesapsız** çalışır (D12, `app/account.tsx`).
 * Bu, kullanıcının Ayarlar → Topluluk'tan **kendi isteğiyle** açtığı tek ağ
 * bağlantılı, kimlikli katmandır. Sunucu bilgisi derleme sırasında GitHub
 * secret'larından gelir (`EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`,
 * `bes/COMMUNITY_SETUP.md`); ayarlanmamışsa `supabase` `null` olur ve
 * topluluk ekranları "henüz hazır değil" gösterir — hiçbir yerde çökme yok.
 *
 * Kimlik Google ya da Apple girişiyle gelir (D32, `auth.ts`); toplulukta
 * başkalarına yalnız kullanıcının seçtiği takma ad görünür.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Sunucu yapılandırılmış mı — ekranlar bu bayrağa bakıp kendini gizler. */
export const communityAvailable = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = communityAvailable
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Google girişi tarayıcıdan `bes://auth-callback?code=…` ile döner;
        // kod, cihazda saklanan doğrulayıcıyla oturuma çevrilir (auth.ts).
        flowType: 'pkce',
      },
    })
  : null;
