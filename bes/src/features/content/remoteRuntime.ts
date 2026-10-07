/**
 * Uzak içerik — indirme, telefonda saklama, yenileme (D36). Kurallar `remote.ts`te.
 */
import { AppState } from 'react-native';
import { kv } from '@/boot/storage';
import { supabase } from '@/features/community/client';
import { logger } from '@/lib/log';
import { parseRemoteRows, useRemoteContent } from './remote';

const log = logger('uzak-içerik');

const KV_KEY = 'remoteContent';
const ARALIK_MS = 6 * 3600_000;

/** Açılışta telefondaki son kopyayı yükler (ağ beklemeden). */
export async function hydrateRemoteContent(): Promise<void> {
  const kayit = await kv.read<{ locale: string; items: unknown; fetchedAt: number } | null>(KV_KEY, {
    parse: (r) => (r && typeof r === 'object' ? r as { locale: string; items: unknown; fetchedAt: number } : null),
    fallback: null,
  });
  if (!kayit) return;
  useRemoteContent.setState((s) => ({
    locale: kayit.locale, items: parseRemoteRows(kayit.items), fetchedAt: kayit.fetchedAt, version: s.version + 1,
  }));
}

let calisan: Promise<void> | null = null;

/** Yayınlanmış içeriği indirir. Hata olursa eldeki kopya korunur. */
export function refreshRemoteContent(locale: string, force = false): Promise<void> {
  const s = useRemoteContent.getState();
  if (!supabase) return Promise.resolve();
  if (!force && s.locale === locale && s.fetchedAt && Date.now() - s.fetchedAt < ARALIK_MS) return Promise.resolve();
  if (calisan) return calisan;
  calisan = (async () => {
    try {
      const { data, error } = await supabase!.from('content_items')
        .select('id,type,title,body,extra,sort_order,created_at')
        .eq('locale', locale).eq('is_published', true)
        .order('sort_order').order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      const items = parseRemoteRows(data);
      const fetchedAt = Date.now();
      useRemoteContent.setState((st) => ({ locale, items, fetchedAt, version: st.version + 1 }));
      await kv.write(KV_KEY, { locale, items: data, fetchedAt });
    } catch (e) {
      log.warn('içerik indirilemedi', { error: e });
    } finally {
      calisan = null;
    }
  })();
  return calisan;
}

/** Kök bileşende bir kez: açılışta ve öne gelişte (6 saatte bir) yeniler. */
export function startRemoteContent(getLocale: () => string): () => void {
  void hydrateRemoteContent().then(() => refreshRemoteContent(getLocale()));
  const abone = AppState.addEventListener('change', (d) => {
    if (d === 'active') void refreshRemoteContent(getLocale());
  });
  return () => abone.remove();
}
