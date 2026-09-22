/**
 * İçerik güncelleme kanalı — şartname §76, DECISIONS D12.
 *
 * Amaç: dua, bilgi maddesi, dinî gün düzeltmesi gibi metinleri **uygulama
 * güncellemesi beklemeden** yenileyebilmek. Kanal statik dosyalardır:
 * GitHub Pages üzerinde yayınlanan JSON. Sunucu, veritabanı ve hesap yok.
 *
 * Kurallar:
 * 1. **Ağ isteğe bağlıdır.** Kanal hiç cevap vermezse uygulama paketle gelen
 *    içerikle tam çalışır; hiçbir ekran boş kalmaz.
 * 2. **Sürüm numarası artmadan içerik değişmez.** Böylece bozuk bir yayın
 *    kullanıcıya yansımadan geri alınabilir.
 * 3. **Doğrulama zorunlu.** Gelen paket şemaya uymazsa yok sayılır; yarım
 *    içerik gösterilmez.
 */
import { z } from 'zod';
import { request, type CacheStore, type FetchLike } from '@/lib/net/request';
import { logger } from '@/lib/log';

const log = logger('icerik');

/** Yayın adresi — marka yapılandırmasındaki Pages adresinden türer. */
export function channelUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/content/tr.json`;
}

const duaSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(20),
});

const knowledgeSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(40),
});

const religiousDaySchema = z.object({
  slug: z.string().min(1),
  gregorianDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  note: z.string().optional(),
});

export const contentBundleSchema = z.object({
  /** Artan tam sayı. Paketle gelenden büyük değilse yok sayılır. */
  version: z.number().int().min(1),
  publishedAt: z.string(),
  duas: z.array(duaSchema).default([]),
  knowledge: z.array(knowledgeSchema).default([]),
  /** Resmî ilana göre düzeltilen dinî günler (§45). */
  religiousDays: z.array(religiousDaySchema).default([]),
});

export type ContentBundle = z.infer<typeof contentBundleSchema>;

export interface FetchContentOptions {
  baseUrl: string;
  /** Paketle gelen içerik sürümü. */
  bundledVersion: number;
  fetch: FetchLike;
  cache?: CacheStore;
  now?: () => number;
}

export type ContentOutcome =
  | { kind: 'update'; bundle: ContentBundle }
  /** Kanalda yeni bir şey yok. */
  | { kind: 'current' }
  /** Ağ yok ya da paket bozuk — paketle gelen içerik kullanılır. */
  | { kind: 'unavailable'; reason: 'offline' | 'invalid' };

/** Günde bir kez yeter: içerik metni saatlik değişmez. */
export const CONTENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function fetchContent(options: FetchContentOptions): Promise<ContentOutcome> {
  const sonuc = await request(
    {
      fetch: options.fetch,
      ...(options.cache ? { cache: options.cache } : {}),
      ...(options.now ? { now: options.now } : {}),
    },
    {
      url: channelUrl(options.baseUrl),
      cacheKey: 'content.tr',
      maxAge: CONTENT_MAX_AGE_MS,
      timeoutMs: 6000,
      attempts: 2,
      parse: (raw) => contentBundleSchema.parse(raw),
    },
  );

  if (sonuc.kind === 'error') {
    log.warn('içerik kanalı okunamadı', { kind: sonuc.error.kind });
    return { kind: 'unavailable', reason: sonuc.error.kind === 'invalid' ? 'invalid' : 'offline' };
  }

  const bundle = sonuc.value;
  // Eski ya da eşit sürüm yok sayılır: bozuk bir yayın geri alınabilsin diye.
  if (bundle.version <= options.bundledVersion) return { kind: 'current' };
  return { kind: 'update', bundle };
}

/**
 * Paketle gelen listeyi kanaldan gelenle birleştirir.
 * Aynı kimlik güncellenir, yeni kimlik eklenir; **kanal hiçbir şeyi silemez**.
 * Silme yetkisi olsaydı bozuk bir yayın uygulamayı boşaltabilirdi.
 */
export function overlay<T extends { id: string }>(bundled: readonly T[], incoming: readonly T[]): T[] {
  const harita = new Map<string, T>(bundled.map((x) => [x.id, x]));
  for (const x of incoming) harita.set(x.id, x);
  return [...harita.values()];
}
