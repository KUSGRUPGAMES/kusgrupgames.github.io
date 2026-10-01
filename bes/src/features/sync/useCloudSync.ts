/**
 * Hesapla eşitleme — çalışma zamanı (D35). Birleştirme kuralları `cloud.ts`'te.
 *
 * Döngü (tek satır, `user_data`): oku → üç yönlü birleştir → gerekirse
 * cihaza uygula → hesaba yaz → "son eşitlenen hâl"i (base) kaydet.
 *
 * Ne zaman çalışır:
 * - giriş yapıldığında ve uygulama açıldığında,
 * - uygulama öne geldiğinde (en sık dakikada bir),
 * - cihazda bir kayıt değiştiğinde, 4 saniye sessizlikten sonra,
 * - uygulama arka plana geçerken (son değişiklik kaybolmasın).
 *
 * Giriş yoksa ya da kullanıcı eşitlemeyi kapattıysa hiçbir şey gönderilmez.
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { kv } from '@/boot/storage';
import { applySnapshot, snapshotAll } from '@/boot/persistence';
import type { BackupPayload } from '@/features/backup/backup';
import { supabase } from '@/features/community/client';
import { useOturum } from '@/features/community/auth';
import { logger } from '@/lib/log';
import { useSettingsStore } from '@/store/settings';
import { useLocationStore } from '@/store/locations';
import { useReadingStore } from '@/store/reading';
import { useWorshipStore } from '@/store/worship';
import { useFavoriteStore } from '@/store/favorites';
import { useLearningStore } from '@/store/learning';
import { useHomeLayoutStore } from '@/store/homeLayout';
import { mergeThreeWay, payloadEquals } from './cloud';

const log = logger('eşitleme');

export type EsitlemeDurumu = 'kapali' | 'bekliyor' | 'calisiyor' | 'tamam' | 'hata';

interface SyncState {
  durum: EsitlemeDurumu;
  sonEsitleme: number | null;
}

export const useCloudSyncStore = create<SyncState>(() => ({ durum: 'kapali', sonEsitleme: null }));

const tabanAnahtari = (uid: string) => `cloudBase.${uid}`;
const tabanCodec = { parse: (r: unknown) => (r && typeof r === 'object' ? (r as BackupPayload) : null), fallback: null as BackupPayload | null };
const cihazCodec = { parse: (r: unknown) => (typeof r === 'string' ? r : null), fallback: null as string | null };

async function cihazKimligi(): Promise<string> {
  const mevcut = await kv.read('deviceId', cihazCodec);
  if (mevcut) return mevcut;
  const yeni = Crypto.randomUUID();
  await kv.write('deviceId', yeni);
  return yeni;
}

let calisan: Promise<void> | null = null;
/** Kendi uyguladığımız birleştirme mağaza aboneliklerini tetiklemesin. */
let uyguluyor = false;

/** Tek bir eşitleme turu. Aynı anda ikinci tur başlamaz, öncekini bekler. */
export function syncNow(uid: string): Promise<void> {
  if (calisan) return calisan;
  calisan = (async () => {
    if (!supabase) return;
    useCloudSyncStore.setState({ durum: 'calisiyor' });
    try {
      const [{ data, error }, base, cihaz] = await Promise.all([
        supabase.from('user_data').select('payload').eq('user_id', uid).maybeSingle(),
        kv.read(tabanAnahtari(uid), tabanCodec),
        cihazKimligi(),
      ]);
      if (error) throw error;
      const yerel = snapshotAll();
      const uzak = (data?.payload as BackupPayload | undefined) ?? null;
      const sonuc = uzak ? mergeThreeWay(base, yerel, uzak) : yerel;

      if (!payloadEquals(sonuc, yerel)) {
        uyguluyor = true;
        try { applySnapshot(sonuc); } finally { uyguluyor = false; }
      }
      if (!uzak || !payloadEquals(sonuc, uzak)) {
        const { error: yazHata } = await supabase.from('user_data').upsert(
          { user_id: uid, payload: sonuc, device_id: cihaz, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
        if (yazHata) throw yazHata;
      }
      await kv.write(tabanAnahtari(uid), sonuc);
      useCloudSyncStore.setState({ durum: 'tamam', sonEsitleme: Date.now() });
    } catch (e) {
      log.warn('eşitleme başarısız', { error: e });
      useCloudSyncStore.setState({ durum: 'hata' });
    } finally {
      calisan = null;
    }
  })();
  return calisan;
}

/** Çıkışta: bu hesabın "son eşitlenen hâl" kaydı silinir; cihazdaki veri kalır. */
export async function forgetSyncBase(uid: string): Promise<void> {
  await kv.write(tabanAnahtari(uid), null);
}

/** Kök bileşende bir kez çağrılır (AppProviders → BildirimEsitleyici). */
export function useCloudSync(): void {
  const { girisli, session } = useOturum();
  const uid = girisli ? session?.user.id ?? null : null;
  const acik = useSettingsStore((s) => s.settings.cloudSync);
  const sonOne = useRef(0);

  useEffect(() => {
    if (!uid || !acik || !supabase) { useCloudSyncStore.setState({ durum: 'kapali' }); return undefined; }
    useCloudSyncStore.setState({ durum: 'bekliyor' });
    void syncNow(uid);

    let zamanlayici: ReturnType<typeof setTimeout> | null = null;
    const degisti = () => {
      if (uyguluyor) return;
      if (zamanlayici) clearTimeout(zamanlayici);
      zamanlayici = setTimeout(() => { void syncNow(uid); }, 4000);
    };
    const abonelikler = [
      useSettingsStore.subscribe(degisti), useLocationStore.subscribe(degisti), useReadingStore.subscribe(degisti),
      useWorshipStore.subscribe(degisti), useFavoriteStore.subscribe(degisti), useLearningStore.subscribe(degisti),
      useHomeLayoutStore.subscribe(degisti),
    ];
    const durumAboneligi = AppState.addEventListener('change', (d) => {
      if (d === 'active' && Date.now() - sonOne.current > 60_000) { sonOne.current = Date.now(); void syncNow(uid); }
      if (d === 'background' && zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; void syncNow(uid); }
    });
    return () => {
      abonelikler.forEach((kaldir) => kaldir());
      durumAboneligi.remove();
      if (zamanlayici) clearTimeout(zamanlayici);
    };
  }, [uid, acik]);
}
