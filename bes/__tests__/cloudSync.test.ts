import { mergeThreeWay } from '@/features/sync/cloud';
import type { BackupPayload } from '@/features/backup/backup';

const bos = (): BackupPayload => ({
  settings: { a: 1 },
  homeLayout: [],
  locations: { locations: [], activeId: null },
  favorites: [],
  reading: { position: null, bookmarks: [] },
  worship: { sessions: [], khatms: [], reminders: [], qada: {}, qadaHistory: [], days: {}, fasts: {} },
  learning: [],
});
const yi = (id: string, createdAt = 1) => ({ id, surah: 1, ayah: 1, color: 'gold', createdAt });
const kopya = (p: BackupPayload): BackupPayload => JSON.parse(JSON.stringify(p)) as BackupPayload;

describe('hesapla eşitleme — üç yönlü birleştirme (D35)', () => {
  it('bir telefonda eklenen kayıt öbürüne geçer, hiçbir yeni kayıt kaybolmaz', () => {
    const base = bos();
    const a = kopya(base); a.reading.bookmarks.push(yi('A'));
    const b = kopya(base); b.reading.bookmarks.push(yi('B'));
    const m = mergeThreeWay(base, a, b);
    expect(m.reading.bookmarks.map((x) => x.id).sort()).toEqual(['A', 'B']);
  });

  it('bir telefonda silinen kayıt öbüründen geri gelmez', () => {
    const base = bos(); base.reading.bookmarks.push(yi('X'));
    const a = kopya(base); a.reading.bookmarks = [];   // A sildi
    const b = kopya(base);                             // B dokunmadı
    expect(mergeThreeWay(base, a, b).reading.bookmarks).toEqual([]);
    expect(mergeThreeWay(base, b, a).reading.bookmarks).toEqual([]);
  });

  it('kaza sayaçlarında iki telefondaki değişiklikler toplanır', () => {
    const base = bos(); base.worship.qada = { fajr: 10 };
    const a = kopya(base); a.worship.qada = { fajr: 8 };   // A'da 2 kaza kılındı
    const b = kopya(base); b.worship.qada = { fajr: 7 };   // B'de 3 kaza kılındı
    expect(mergeThreeWay(base, a, b).worship.qada).toEqual({ fajr: 5 });
  });

  it('ibadet defterinde aynı günün iki telefondaki kayıtları birleşir', () => {
    const base = bos();
    const a = kopya(base); a.worship.days = {}; a.worship.days['2026-10-01'] = { date: '2026-10-01', prayers: { fajr: 'alone' }, quranMinutes: 10 };
    const b = kopya(base); b.worship.days = {}; b.worship.days['2026-10-01'] = { date: '2026-10-01', prayers: { isha: 'jamaah' }, quranMinutes: 25 };
    const gun = mergeThreeWay(base, a, b).worship.days?.['2026-10-01'];
    if (!gun) throw new Error('gün yok');
    expect(gun.prayers).toEqual({ fajr: 'alone', isha: 'jamaah' });
    expect(gun.quranMinutes).toBe(25);
  });

  it('hatimde iki telefonda okunan cüzler birleşir', () => {
    const base = bos();
    base.worship.khatms = [{ id: 'h', title: 'H', startedOn: '2026-10-01', completedJuz: [1], active: true }];
    const a = kopya(base); a.worship.khatms![0]!.completedJuz = [1, 2];
    const b = kopya(base); b.worship.khatms![0]!.completedJuz = [1, 3];
    expect(mergeThreeWay(base, a, b).worship.khatms?.[0]?.completedJuz).toEqual([1, 2, 3]);
  });

  it('ayarlarda değişen taraf kazanır; etkin konum cihaza özel kalır', () => {
    const yer = (id: string) => ({ id, name: id, country: 'TR', countryCode: 'TR', timezone: 'Europe/Istanbul',
      latitude: 41, longitude: 29, label: id, isPrimary: id === 'ist', origin: 'gps' as const, savedAt: 1 });
    const base = bos(); base.locations = { locations: [yer('ist'), yer('ank')], activeId: 'ist' };
    const a = kopya(base); a.locations.activeId = 'ank';
    const b = kopya(base); b.settings = { a: 2 };
    const m = mergeThreeWay(base, a, b);
    expect(m.settings).toEqual({ a: 2 });
    expect(m.locations.activeId).toBe('ank');
  });

  it('ilk eşitlemede (base yok) hiçbir şey silinmez; boş cihaz sayaçları hesaptan alır', () => {
    const yerel = bos();
    const uzak = bos(); uzak.reading.bookmarks.push(yi('U')); uzak.worship.qada = { isha: 4 };
    const m = mergeThreeWay(null, yerel, uzak);
    expect(m.reading.bookmarks.map((x) => x.id)).toEqual(['U']);
    expect(m.worship.qada).toEqual({ isha: 4 });
  });

  it('birleştirme değişmezdir: aynı veri ikinci kez birleşince sonuç değişmez', () => {
    const base = bos(); base.reading.bookmarks.push(yi('X'));
    const a = kopya(base); a.reading.bookmarks.push(yi('A'));
    const once = mergeThreeWay(base, a, base);
    expect(mergeThreeWay(once, once, once)).toEqual(once);
  });
});
