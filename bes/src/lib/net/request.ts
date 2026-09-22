/**
 * Ağ katmanı — şartname §76, §82.
 *
 * Bu uygulamada ağ **ikincildir**: namaz vakti, Kuran ve zikir çevrimdışı
 * çalışır (DECISIONS D6). Bu yüzden katmanın işi hızlı başarmak değil,
 * **hızlı vazgeçmek**: zaman aşımı kısa, yeniden deneme sınırlı, başarısızlıkta
 * önbellekteki son iyi yanıt döner.
 *
 * `fetch` dışarıdan verilir; böylece sınamada gerçek ağ kullanılmaz.
 */
import { logger } from '@/lib/log';

const log = logger('net');

export interface CacheEntry<T> {
  value: T;
  storedAt: number;
}

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export type FetchLike = (url: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export interface RequestOptions<T> {
  url: string;
  /** Önbellek anahtarı. Verilmezse önbellek kullanılmaz. */
  cacheKey?: string;
  /** Önbelleğin taze sayıldığı süre (ms). Süresi geçmiş kayıt yine de
   *  başarısızlıkta yedek olarak kullanılır. */
  maxAge?: number;
  timeoutMs?: number;
  /** Toplam deneme sayısı (ilk istek dahil). */
  attempts?: number;
  headers?: Record<string, string>;
  /** Gelen gövdeyi doğrular. Doğrulama başarısızsa yanıt **yok sayılır**;
   *  bozuk veri önbelleğe yazılmaz. */
  parse: (raw: unknown) => T;
}

export type RequestOutcome<T> =
  | { kind: 'fresh'; value: T }
  | { kind: 'cache'; value: T; stale: boolean }
  | { kind: 'error'; error: RequestError };

export type RequestErrorKind = 'timeout' | 'offline' | 'http' | 'invalid';

export class RequestError extends Error {
  readonly kind: RequestErrorKind;
  readonly status?: number;
  constructor(kind: RequestErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'RequestError';
    this.kind = kind;
    if (status !== undefined) this.status = status;
  }
}

/** Yeniden denemeye değer mi: 4xx kalıcıdır, denenmez. */
export function isRetryable(error: RequestError): boolean {
  if (error.kind === 'http') {
    const s = error.status ?? 0;
    return s === 408 || s === 429 || s >= 500;
  }
  return error.kind === 'timeout' || error.kind === 'offline';
}

/** Üstel geri çekilme; sınamada beklenebilir olması için rastgelelik yok. */
export function backoffDelay(attempt: number, base = 400, max = 4000): number {
  return Math.min(max, base * Math.pow(2, Math.max(0, attempt - 1)));
}

export interface RequestDeps {
  fetch: FetchLike;
  cache?: CacheStore;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

async function once<T>(deps: RequestDeps, o: RequestOptions<T>): Promise<T> {
  const timeoutMs = o.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const init: { signal: AbortSignal; headers?: Record<string, string> } = { signal: controller.signal };
    if (o.headers) init.headers = o.headers;
    const res = await deps.fetch(o.url, init);
    if (!res.ok) throw new RequestError('http', `HTTP ${res.status}`, res.status);
    let raw: unknown;
    try {
      raw = await res.json();
    } catch {
      throw new RequestError('invalid', 'Yanıt çözümlenemedi');
    }
    try {
      return o.parse(raw);
    } catch {
      throw new RequestError('invalid', 'Yanıt beklenen biçimde değil');
    }
  } catch (e) {
    if (e instanceof RequestError) throw e;
    const name = (e as { name?: string })?.name;
    if (name === 'AbortError') throw new RequestError('timeout', 'Zaman aşımı');
    throw new RequestError('offline', 'Ağa ulaşılamadı');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * İstek: önbellek → ağ → yeniden deneme → bayat önbellek → hata.
 * Hiçbir yolda istisna fırlatmaz; sonucu `RequestOutcome` olarak döner ki
 * çağıran taraf arayüzde ne göstereceğini açıkça seçsin (§82).
 */
export async function request<T>(deps: RequestDeps, o: RequestOptions<T>): Promise<RequestOutcome<T>> {
  const now = deps.now ?? (() => Date.now());
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const attempts = Math.max(1, o.attempts ?? 3);

  const okuOnbellek = async (): Promise<CacheEntry<T> | null> => {
    if (!deps.cache || !o.cacheKey) return null;
    try {
      const raw = await deps.cache.get(o.cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { value: unknown; storedAt: number };
      return { value: o.parse(parsed.value), storedAt: parsed.storedAt };
    } catch {
      return null;
    }
  };

  const onbellek = await okuOnbellek();
  if (onbellek && o.maxAge !== undefined && now() - onbellek.storedAt < o.maxAge) {
    return { kind: 'cache', value: onbellek.value, stale: false };
  }

  let sonHata = new RequestError('offline', 'Ağa ulaşılamadı');
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const value = await once(deps, o);
      if (deps.cache && o.cacheKey) {
        try {
          await deps.cache.set(o.cacheKey, JSON.stringify({ value, storedAt: now() }));
        } catch {
          log.warn('önbelleğe yazılamadı');
        }
      }
      return { kind: 'fresh', value };
    } catch (e) {
      sonHata = e instanceof RequestError ? e : new RequestError('offline', 'Bilinmeyen ağ hatası');
      if (attempt >= attempts || !isRetryable(sonHata)) break;
      await sleep(backoffDelay(attempt));
    }
  }

  if (onbellek) return { kind: 'cache', value: onbellek.value, stale: true };
  log.warn('istek başarısız', { kind: sonHata.kind, status: sonHata.status });
  return { kind: 'error', error: sonHata };
}
