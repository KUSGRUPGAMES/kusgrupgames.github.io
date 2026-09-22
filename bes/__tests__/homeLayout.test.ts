import { reconcile, useHomeLayoutStore, HOME_CARDS, PINNED_CARDS } from '@/store/homeLayout';
import { useFavoriteStore } from '@/store/favorites';

describe('ana sayfa düzeni', () => {
  beforeEach(() => useHomeLayoutStore.getState().reset());

  it('varsayılan düzende tüm kartlar görünür', () => {
    expect(useHomeLayoutStore.getState().visibleCards()).toEqual([...HOME_CARDS]);
  });

  it('bozuk kayıt varsayılana düşer', () => {
    expect(reconcile(null).map((c) => c.id)).toEqual([...HOME_CARDS]);
    expect(reconcile('saçmalık').map((c) => c.id)).toEqual([...HOME_CARDS]);
    expect(reconcile([{ yanlis: true }, 5, null]).map((c) => c.id)).toEqual([...HOME_CARDS]);
  });

  it('yeni sürümde eklenen kart eski düzenin sonuna gelir', () => {
    const eski = [{ id: 'todayTimes', visible: true }, { id: 'nextPrayer', visible: true }];
    const sonuc = reconcile(eski);
    expect(sonuc.slice(0, 2).map((c) => c.id)).toEqual(['todayTimes', 'nextPrayer']);
    expect(sonuc).toHaveLength(HOME_CARDS.length);
    expect(new Set(sonuc.map((c) => c.id)).size).toBe(HOME_CARDS.length);
  });

  it('artık olmayan kart sessizce atılır', () => {
    const sonuc = reconcile([{ id: 'kaldirilmis-kart', visible: true }, { id: 'nextPrayer', visible: true }]);
    expect(sonuc.some((c) => (c.id as string) === 'kaldirilmis-kart')).toBe(false);
  });

  it('yinelenen kayıt tekilleştirilir', () => {
    const sonuc = reconcile([{ id: 'moon', visible: true }, { id: 'moon', visible: false }]);
    expect(sonuc.filter((c) => c.id === 'moon')).toHaveLength(1);
  });

  it('sabit kart kapatılamaz — depoda kapalı olsa bile açılır', () => {
    for (const id of PINNED_CARDS) {
      expect(reconcile([{ id, visible: false }]).find((c) => c.id === id)?.visible).toBe(true);
      useHomeLayoutStore.getState().toggle(id);
      expect(useHomeLayoutStore.getState().visibleCards()).toContain(id);
    }
  });

  it('kart gizlenip geri açılabilir', () => {
    useHomeLayoutStore.getState().toggle('moon');
    expect(useHomeLayoutStore.getState().visibleCards()).not.toContain('moon');
    useHomeLayoutStore.getState().toggle('moon');
    expect(useHomeLayoutStore.getState().visibleCards()).toContain('moon');
  });

  it('kart yukarı aşağı taşınır, sınırda taşmaz', () => {
    const ilk = useHomeLayoutStore.getState().cards[0]!.id;
    useHomeLayoutStore.getState().move(ilk, -1);
    expect(useHomeLayoutStore.getState().cards[0]?.id).toBe(ilk);

    useHomeLayoutStore.getState().move(ilk, 1);
    expect(useHomeLayoutStore.getState().cards[1]?.id).toBe(ilk);

    const son = useHomeLayoutStore.getState().cards.at(-1)!.id;
    useHomeLayoutStore.getState().move(son, 1);
    expect(useHomeLayoutStore.getState().cards.at(-1)?.id).toBe(son);
  });
});

describe('favoriler', () => {
  beforeEach(() => useFavoriteStore.getState().clear());

  it('ekleme ve çıkarma aynı düğmeyle çalışır', () => {
    expect(useFavoriteStore.getState().toggle('dua', 'sabah-1')).toBe(true);
    expect(useFavoriteStore.getState().has('dua', 'sabah-1')).toBe(true);
    expect(useFavoriteStore.getState().toggle('dua', 'sabah-1')).toBe(false);
    expect(useFavoriteStore.getState().has('dua', 'sabah-1')).toBe(false);
  });

  it('farklı türlerde aynı kimlik karışmaz', () => {
    useFavoriteStore.getState().toggle('dua', '1');
    expect(useFavoriteStore.getState().has('name', '1')).toBe(false);
  });

  it('türe göre listelenir, en yeni başta', () => {
    useFavoriteStore.getState().toggle('dua', 'a');
    useFavoriteStore.getState().toggle('name', 'b');
    useFavoriteStore.getState().toggle('dua', 'c');
    expect(useFavoriteStore.getState().byKind('dua').map((f) => f.recordId)).toEqual(['c', 'a']);
  });
});
