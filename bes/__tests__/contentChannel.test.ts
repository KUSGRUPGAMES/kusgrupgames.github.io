import {
  fetchContent, contentBundleSchema, channelUrl, overlay, CONTENT_MAX_AGE_MS,
} from '@/features/content/channel';
import type { FetchLike, CacheStore } from '@/lib/net/request';

const gecerli = {
  version: 2,
  publishedAt: '2026-10-01',
  duas: [{ id: 'd1', category: 'sabah', title: 'Bir dua', body: 'Bu metin yeterince uzundur, evet.' }],
  knowledge: [],
  religiousDays: [],
};

function yanit(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function bellek(): CacheStore & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return { store, get: async (k) => store.get(k) ?? null, set: async (k, v) => { store.set(k, v); } };
}

describe('içerik kanalı', () => {
  it('adres Pages kökünden türer ve çift eğik çizgi olmaz', () => {
    expect(channelUrl('https://kusgrupgames.github.io/bes')).toBe('https://kusgrupgames.github.io/bes/content/tr.json');
    expect(channelUrl('https://kusgrupgames.github.io/bes/')).toBe('https://kusgrupgames.github.io/bes/content/tr.json');
  });

  it('daha yeni sürüm güncelleme olarak döner', async () => {
    const fetchLike: FetchLike = async () => yanit(200, gecerli);
    const r = await fetchContent({ baseUrl: 'https://x/y', bundledVersion: 1, fetch: fetchLike });
    expect(r.kind).toBe('update');
    if (r.kind === 'update') expect(r.bundle.duas).toHaveLength(1);
  });

  it('eşit veya eski sürüm yok sayılır — bozuk yayın geri alınabilsin', async () => {
    const fetchLike: FetchLike = async () => yanit(200, gecerli);
    expect((await fetchContent({ baseUrl: 'https://x', bundledVersion: 2, fetch: fetchLike })).kind).toBe('current');
    expect((await fetchContent({ baseUrl: 'https://x', bundledVersion: 5, fetch: fetchLike })).kind).toBe('current');
  });

  it('ağ yoksa uygulama paketle gelen içeriğe düşer', async () => {
    const fetchLike: FetchLike = async () => { throw new Error('ENOTFOUND'); };
    const r = await fetchContent({ baseUrl: 'https://x', bundledVersion: 1, fetch: fetchLike });
    expect(r).toEqual({ kind: 'unavailable', reason: 'offline' });
  });

  it('şemaya uymayan paket yok sayılır', async () => {
    const fetchLike: FetchLike = async () => yanit(200, { version: 'iki', duas: 'liste değil' });
    const r = await fetchContent({ baseUrl: 'https://x', bundledVersion: 1, fetch: fetchLike });
    expect(r.kind).toBe('unavailable');
    if (r.kind === 'unavailable') expect(r.reason).toBe('invalid');
  });

  it('çok kısa metin kabul edilmez', () => {
    const r = contentBundleSchema.safeParse({
      version: 2, publishedAt: 'x',
      duas: [{ id: 'a', category: 'b', title: 'c', body: 'kısa' }],
    });
    expect(r.success).toBe(false);
  });

  it('eksik alanlar varsayılanla tamamlanır', () => {
    const r = contentBundleSchema.parse({ version: 3, publishedAt: '2026-01-01' });
    expect(r.duas).toEqual([]);
    expect(r.knowledge).toEqual([]);
    expect(r.religiousDays).toEqual([]);
  });

  it('dinî gün tarihi biçimi denetlenir', () => {
    const iyi = contentBundleSchema.safeParse({
      version: 2, publishedAt: 'x',
      religiousDays: [{ slug: 'a', gregorianDate: '2027-02-08', title: 'b' }],
    });
    const kotu = contentBundleSchema.safeParse({
      version: 2, publishedAt: 'x',
      religiousDays: [{ slug: 'a', gregorianDate: '8 Şubat 2027', title: 'b' }],
    });
    expect(iyi.success).toBe(true);
    expect(kotu.success).toBe(false);
  });

  it('taze önbellek varken ağa çıkılmaz', async () => {
    const cache = bellek();
    cache.store.set('content.tr', JSON.stringify({ value: gecerli, storedAt: 1000 }));
    let cagrildi = 0;
    const fetchLike: FetchLike = async () => { cagrildi++; return yanit(200, gecerli); };
    await fetchContent({
      baseUrl: 'https://x', bundledVersion: 1, fetch: fetchLike, cache,
      now: () => 1000 + CONTENT_MAX_AGE_MS - 1,
    });
    expect(cagrildi).toBe(0);
  });
});

describe('içerik bindirmesi', () => {
  const paketle = [{ id: 'a', v: 1 }, { id: 'b', v: 1 }];

  it('aynı kimlik güncellenir', () => {
    const r = overlay(paketle, [{ id: 'a', v: 2 }]);
    expect(r.find((x) => x.id === 'a')?.v).toBe(2);
  });

  it('yeni kimlik eklenir', () => {
    expect(overlay(paketle, [{ id: 'c', v: 1 }])).toHaveLength(3);
  });

  it('kanal hiçbir şeyi silemez', () => {
    const r = overlay(paketle, []);
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.id).sort()).toEqual(['a', 'b']);
  });
});
