import { hiddenTargets, parseRemoteRows, versePool, useRemoteContent, type RemoteItem } from '@/features/content/remote';
import { allDuas, remoteDua } from '@/features/duas/pool';
import { knowledgeFrom, cardTemplatesFrom } from '@/features/content/pools';
import { pickDailyVerse } from '@/features/daily/verse';
import { KNOWLEDGE } from '@/content/knowledge';
import { CARD_TEMPLATES } from '@/content/cardTemplates';

const r = (type: RemoteItem['type'], extra: Record<string, unknown> = {}, body = 'metin', title = 'Başlık'): RemoteItem =>
  ({ id: `${type}-${Math.random().toString(36).slice(2)}`, type, title, body, extra, sortOrder: 0, createdAt: '' });

afterEach(() => { useRemoteContent.setState({ items: [], version: useRemoteContent.getState().version + 1 }); });

describe('panelden yönetilen içerik (D36)', () => {
  it('bozuk ya da tanınmayan satırlar sessizce atlanır', () => {
    const rows = parseRemoteRows([
      { id: 'a', type: 'dua', title: 'x', body: 'y', extra: {}, sort_order: 1, created_at: '' },
      { id: 'b', type: 'virus', title: 'x' }, null, { type: 'dua' }, 'çöp',
    ]);
    expect(rows.map((x) => x.id)).toEqual(['a']);
    expect(parseRemoteRows('çöp')).toEqual([]);
  });

  it('panelden eklenen dua havuza katılır, gizlenen yerleşik dua çıkar', () => {
    const ilk = allDuas();
    const hedef = ilk[0]!;
    useRemoteContent.setState((s) => ({ items: [r('dua', { category: 'sabah' }, 'Allah’ım bu sabahı hayırlı kıl.', 'Sabah duası'), r('hide', { target: `dua:${hedef.id}` })], version: s.version + 1 }));
    const yeni = allDuas();
    expect(yeni.some((d) => d.id === hedef.id)).toBe(false);
    expect(yeni.at(-1)?.title).toBe('Sabah duası');
    expect(yeni.length).toBe(ilk.length);
  });

  it('âyet referanslı dua metni paketten okunur; geçersiz kategori düşer, boş metin atlanır', () => {
    const d = remoteDua(r('dua', { surah: 2, ayah: 201, category: 'yok' }, '', 'Rabbenâ âtinâ'));
    expect(d?.kind).toBe('quran');
    expect(d?.arabic?.length).toBeGreaterThan(10);
    expect(d?.category).toBe('iman');
    expect(remoteDua(r('dua', {}, '   '))).toBeNull();
  });

  it('âyet havuzu: geçerli çiftler kalır; havuz varsa günün âyeti havuzdan seçilir', () => {
    const havuz = versePool([r('verse', { surah: 1, ayah: 1 }), r('verse', { surah: 999, ayah: 1 }), r('verse', { surah: 2, ayah: 'x' })]);
    expect(havuz).toEqual([{ surah: 1, ayah: 1 }]);
    const v = pickDailyVerse({ year: 2026, month: 9, day: 1 }, havuz);
    expect(v && [v.surah, v.ayah]).toEqual([1, 1]);
    expect(pickDailyVerse({ year: 2026, month: 9, day: 1 }, [])).not.toBeNull();
  });

  it('bilgi ve kart havuzları: gizleme ve ekleme', () => {
    const k = knowledgeFrom([r('knowledge', { topic: 'tarih' }, 'Gövde', 'Yeni bilgi'), r('hide', { target: `knowledge:${KNOWLEDGE[0]!.id}` })]);
    expect(k.some((x) => x.id === KNOWLEDGE[0]!.id)).toBe(false);
    expect(k.at(-1)?.title).toBe('Yeni bilgi');
    const c = cardTemplatesFrom([r('hide', { target: `card:${CARD_TEMPLATES[0]!.id}` })]);
    expect(c.length).toBe(CARD_TEMPLATES.length - 1);
    expect(hiddenTargets([r('hide', {})]).size).toBe(0);
  });
});
