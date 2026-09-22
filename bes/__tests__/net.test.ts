import { request, backoffDelay, isRetryable, RequestError, type FetchLike, type CacheStore } from '@/lib/net/request';

const parse = (raw: unknown): { v: number } => {
  if (typeof raw !== 'object' || raw === null || typeof (raw as { v?: unknown }).v !== 'number') {
    throw new Error('biçim');
  }
  return { v: (raw as { v: number }).v };
};

function bellek(): CacheStore & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    set: async (k, v) => { store.set(k, v); },
  };
}

const hemen = async () => { /* sınamada bekleme yok */ };

function yanit(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('ağ katmanı', () => {
  it('başarılı istek taze değer döner ve önbelleğe yazar', async () => {
    const cache = bellek();
    const fetchLike: FetchLike = async () => yanit(200, { v: 7 });
    const r = await request({ fetch: fetchLike, cache, sleep: hemen }, { url: 'u', cacheKey: 'k', parse });
    expect(r).toEqual({ kind: 'fresh', value: { v: 7 } });
    expect(cache.store.size).toBe(1);
  });

  it('taze önbellek varken ağa hiç çıkmaz', async () => {
    const cache = bellek();
    cache.store.set('k', JSON.stringify({ value: { v: 1 }, storedAt: 1000 }));
    let cagrildi = 0;
    const fetchLike: FetchLike = async () => { cagrildi++; return yanit(200, { v: 2 }); };
    const r = await request(
      { fetch: fetchLike, cache, now: () => 1500, sleep: hemen },
      { url: 'u', cacheKey: 'k', maxAge: 1000, parse },
    );
    expect(r).toEqual({ kind: 'cache', value: { v: 1 }, stale: false });
    expect(cagrildi).toBe(0);
  });

  it('500 hatasında yeniden dener, sonunda başarır', async () => {
    let n = 0;
    const fetchLike: FetchLike = async () => { n++; return n < 3 ? yanit(500, {}) : yanit(200, { v: 9 }); };
    const r = await request({ fetch: fetchLike, sleep: hemen }, { url: 'u', attempts: 3, parse });
    expect(r).toEqual({ kind: 'fresh', value: { v: 9 } });
    expect(n).toBe(3);
  });

  it('404 kalıcı sayılır, yeniden denenmez', async () => {
    let n = 0;
    const fetchLike: FetchLike = async () => { n++; return yanit(404, {}); };
    const r = await request({ fetch: fetchLike, sleep: hemen }, { url: 'u', attempts: 3, parse });
    expect(n).toBe(1);
    expect(r.kind).toBe('error');
    if (r.kind === 'error') expect(r.error.status).toBe(404);
  });

  it('ağ çökerse bayat önbellek döner — kullanıcı boş ekran görmez', async () => {
    const cache = bellek();
    cache.store.set('k', JSON.stringify({ value: { v: 3 }, storedAt: 0 }));
    const fetchLike: FetchLike = async () => { throw new Error('ENOTFOUND'); };
    const r = await request(
      { fetch: fetchLike, cache, now: () => 999999, sleep: hemen },
      { url: 'u', cacheKey: 'k', maxAge: 1000, attempts: 2, parse },
    );
    expect(r).toEqual({ kind: 'cache', value: { v: 3 }, stale: true });
  });

  it('bozuk gövde önbelleğe yazılmaz', async () => {
    const cache = bellek();
    const fetchLike: FetchLike = async () => yanit(200, { yanlis: true });
    const r = await request({ fetch: fetchLike, cache, sleep: hemen }, { url: 'u', cacheKey: 'k', attempts: 1, parse });
    expect(r.kind).toBe('error');
    if (r.kind === 'error') expect(r.error.kind).toBe('invalid');
    expect(cache.store.size).toBe(0);
  });

  it('zaman aşımı hata türü olarak ayırt edilir', async () => {
    const fetchLike: FetchLike = async (_u, init) => {
      await new Promise((r) => setTimeout(r, 30));
      if (init?.signal?.aborted) {
        const e = new Error('abort'); e.name = 'AbortError'; throw e;
      }
      return yanit(200, { v: 1 });
    };
    const r = await request({ fetch: fetchLike, sleep: hemen }, { url: 'u', timeoutMs: 5, attempts: 1, parse });
    expect(r.kind).toBe('error');
    if (r.kind === 'error') expect(r.error.kind).toBe('timeout');
  });

  it('geri çekilme üstel artar ve tavanı aşmaz', () => {
    expect(backoffDelay(1)).toBe(400);
    expect(backoffDelay(2)).toBe(800);
    expect(backoffDelay(3)).toBe(1600);
    expect(backoffDelay(10)).toBe(4000);
  });

  it('yeniden deneme kuralı', () => {
    expect(isRetryable(new RequestError('timeout', ''))).toBe(true);
    expect(isRetryable(new RequestError('offline', ''))).toBe(true);
    expect(isRetryable(new RequestError('http', '', 500))).toBe(true);
    expect(isRetryable(new RequestError('http', '', 429))).toBe(true);
    expect(isRetryable(new RequestError('http', '', 400))).toBe(false);
    expect(isRetryable(new RequestError('invalid', ''))).toBe(false);
  });
});
