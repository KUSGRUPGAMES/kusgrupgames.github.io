/**
 * Diyanet resmî vakitleri — indirme ve saklama (5 Ekim). Kurallar official.ts'te.
 *
 * Etkin konum Türkiye'de bir ilçeyse (diyanetId) ve yöntem Diyanet'se:
 * açılışta telefondaki kopya yüklenir, önümüzde 10 günden az kaldıysa
 * sunucudan (Edge Function diyanet-times) 30 güne kadar indirilir. İstekte
 * yalnız ilçe kimliği gider; hesap ya da konum gitmez.
 * İnternet yoksa: eldeki resmî vakitler, onlar da yoksa temkinli hesap.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { kv } from '@/boot/storage';
import { logger } from '@/lib/log';
import { useLocationStore } from '@/store/locations';
import { useSettingsStore } from '@/store/settings';
import { zonedNow } from '@/lib/time/zone';
import { dateKeyOf, mergeOfficial, useOfficialStore, type OfficialTimes } from './official';

const log = logger('diyanet');
const KV = 'diyanetTimes';
const URL_TABANI = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANAHTAR = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let yuklendi: Promise<void> | null = null;
function telefondanYukle(): Promise<void> {
  if (!yuklendi) {
    yuklendi = kv.read<Record<string, Record<string, OfficialTimes>> | null>(KV, {
      parse: (r) => (r && typeof r === 'object' ? r as Record<string, Record<string, OfficialTimes>> : null), fallback: null,
    }).then((v) => {
      if (v) useOfficialStore.setState((s) => ({ byId: { ...v, ...s.byId }, version: s.version + 1 }));
    });
  }
  return yuklendi;
}

const suruyor = new Set<string>();

export async function ensureOfficial(id: string, bugun: string): Promise<void> {
  await telefondanYukle();
  const elde = useOfficialStore.getState().byId[id] ?? {};
  const ileri = Object.keys(elde).filter((k) => k >= bugun).length;
  if (ileri >= 10 || suruyor.has(id) || !URL_TABANI || !ANAHTAR) return;
  suruyor.add(id);
  try {
    const r = await fetch(`${URL_TABANI}/functions/v1/diyanet-times?id=${encodeURIComponent(id)}`, {
      headers: { apikey: ANAHTAR, Authorization: `Bearer ${ANAHTAR}` },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = (await r.json()) as { days?: Record<string, OfficialTimes> };
    const days = Object.fromEntries(Object.entries(d.days ?? {})
      .filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && Array.isArray(v) && v.length === 6 && v.every((x) => /^\d{2}:\d{2}$/.test(x))));
    if (Object.keys(days).length) {
      mergeOfficial(id, days, bugun);
      await kv.write(KV, useOfficialStore.getState().byId);
    }
  } catch (e) {
    log.warn('resmî vakitler alınamadı', { error: e });
  } finally {
    suruyor.delete(id);
  }
}

/** Kök bileşende bir kez: etkin ilçenin resmî vakitlerini hazır tutar. */
export function useOfficialTimesSync(): void {
  const konum = useLocationStore((s) => s.active());
  const yontem = useSettingsStore((s) => s.settings.method);
  const id = konum?.diyanetId;
  useEffect(() => {
    void telefondanYukle();
    if (!id || !konum || yontem !== 'diyanet') return undefined;
    const calis = () => { const z = zonedNow(konum.timezone); void ensureOfficial(id, dateKeyOf(z.year, z.month, z.day)); };
    calis();
    const sub = AppState.addEventListener('change', (d) => { if (d === 'active') calis(); });
    return () => sub.remove();
  }, [id, yontem, konum]);
}

/** Resmî vakitler gelince çizelgeleri yeniden hesaplatmak için. */
export function useOfficialVersion(): number {
  return useOfficialStore((s) => s.version);
}
