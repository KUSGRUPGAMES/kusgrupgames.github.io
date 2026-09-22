import {
  dateKey, parseDateKey, daysBetween, withinDays, summarize,
  currentStreak, dailyTotals, type DhikrSession,
} from '@/features/dhikr/stats';
import { useWorshipStore, QADA_SLOTS } from '@/store/worship';
import { DHIKR_PRESETS, DHIKR_TARGETS } from '@/content/dhikr';

const oturum = (onDate: string, count: number, title = 'Sübhânallah'): DhikrSession => ({
  id: `${onDate}-${title}-${count}`, title, count, target: 33, onDate, createdAt: 1,
});

describe('gün anahtarı', () => {
  it('sıfır dolgulu biçimde üretilir', () => {
    expect(dateKey(2026, 0, 5)).toBe('2026-01-05');
    expect(dateKey(2026, 11, 31)).toBe('2026-12-31');
  });

  it('çözümlenir ve bozuk girdide null döner', () => {
    expect(parseDateKey('2026-03-09')).toEqual({ year: 2026, month: 2, day: 9 });
    expect(parseDateKey('saçmalık')).toBeNull();
    expect(parseDateKey('2026-3-9')).toBeNull();
  });

  it('gün farkı ay ve yıl sınırını aşar', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
    expect(daysBetween('2026-03-01', '2026-02-28')).toBe(-1);
    expect(daysBetween('bozuk', '2026-01-01')).toBeNull();
  });
});

describe('zikir istatistiği', () => {
  const bugun = '2026-05-10';
  const kayitlar = [
    oturum('2026-05-10', 33),
    oturum('2026-05-10', 99, 'Estağfirullah'),
    oturum('2026-05-09', 33),
    oturum('2026-05-08', 100, 'Salavât'),
    oturum('2026-04-20', 33),
  ];

  it('son N gün penceresi doğru kesiyor', () => {
    expect(withinDays(kayitlar, bugun, 1)).toHaveLength(2);
    expect(withinDays(kayitlar, bugun, 3)).toHaveLength(4);
    expect(withinDays(kayitlar, bugun, 365)).toHaveLength(5);
  });

  it('gelecekteki kayıt pencereye girmez', () => {
    const gelecek = [...kayitlar, oturum('2026-05-11', 10)];
    expect(withinDays(gelecek, bugun, 7).some((s) => s.onDate === '2026-05-11')).toBe(false);
  });

  it('özet toplam, gün ve ortalama verir', () => {
    const o = summarize(withinDays(kayitlar, bugun, 3));
    expect(o.total).toBe(33 + 99 + 33 + 100);
    expect(o.sessionCount).toBe(4);
    expect(o.days).toBe(3);
    expect(o.average).toBe(Math.round(265 / 3));
    expect(o.topTitle).toBe('Salavât');
  });

  it('boş listede sıfır döner, bölme hatası olmaz', () => {
    expect(summarize([])).toEqual({ total: 0, sessionCount: 0, days: 0, average: 0, topTitle: null });
  });

  it('seri ardışık günleri sayar', () => {
    expect(currentStreak(kayitlar, bugun)).toBe(3);
  });

  it('bugün çekilmediyse seri kırılmış sayılmaz', () => {
    const dunden = kayitlar.filter((s) => s.onDate !== '2026-05-10');
    expect(currentStreak(dunden, bugun)).toBe(2);
  });

  it('iki gün boşluk seriyi bitirir', () => {
    expect(currentStreak([oturum('2026-05-07', 33)], bugun)).toBe(0);
  });

  it('hiç kayıt yoksa seri sıfırdır', () => {
    expect(currentStreak([], bugun)).toBe(0);
  });

  it('günlük toplamlar eskiden yeniye ve boş günler sıfır', () => {
    const g = dailyTotals(kayitlar, bugun, 4);
    expect(g.map((x) => x.date)).toEqual(['2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10']);
    expect(g.map((x) => x.total)).toEqual([0, 100, 33, 132]);
  });
});

describe('hazır zikirler', () => {
  it('kimlikler tekildir ve hedefler pozitiftir', () => {
    expect(new Set(DHIKR_PRESETS.map((p) => p.id)).size).toBe(DHIKR_PRESETS.length);
    for (const p of DHIKR_PRESETS) {
      expect(p.target).toBeGreaterThan(0);
      expect(p.meaning.length).toBeGreaterThan(5);
    }
  });

  it('hedef listesi artan sıradadır', () => {
    expect([...DHIKR_TARGETS]).toEqual([...DHIKR_TARGETS].sort((a, b) => a - b));
  });
});

describe('ibadet deposu', () => {
  beforeEach(() => useWorshipStore.getState().hydrate({}));

  it('zikir oturumu eklenir ve negatif sayı sıfırlanır', () => {
    useWorshipStore.getState().addSession({ title: 'x', count: -5, target: 33, onDate: '2026-01-01' });
    expect(useWorshipStore.getState().sessions[0]?.count).toBe(0);
  });

  it('kaza sayacı eksiye düşmez', () => {
    const s = useWorshipStore.getState();
    s.adjustQada('fajr', 5);
    expect(useWorshipStore.getState().qada.fajr).toBe(5);
    s.adjustQada('fajr', -10);
    expect(useWorshipStore.getState().qada.fajr).toBe(0);
  });

  it('toplu giriş bütün vakitlere ekler', () => {
    useWorshipStore.getState().bulkQada(30);
    for (const slot of QADA_SLOTS) {
      expect(useWorshipStore.getState().qada[slot]).toBe(30);
    }
  });

  it('son işlem geri alınır', () => {
    const s = useWorshipStore.getState();
    s.adjustQada('asr', 10);
    s.adjustQada('asr', -3);
    expect(useWorshipStore.getState().qada.asr).toBe(7);
    useWorshipStore.getState().undoLastQada();
    expect(useWorshipStore.getState().qada.asr).toBe(10);
    useWorshipStore.getState().undoLastQada();
    expect(useWorshipStore.getState().qada.asr).toBe(0);
  });

  it('geri alınacak işlem yoksa çökmez', () => {
    expect(() => useWorshipStore.getState().undoLastQada()).not.toThrow();
  });

  it('sıfıra düşmüş sayaçta eksi işlem geçmişe yazılmaz', () => {
    useWorshipStore.getState().adjustQada('isha', -5);
    expect(useWorshipStore.getState().qadaHistory).toHaveLength(0);
  });

  it('ibadet defteri günü oluşturur ve günceller', () => {
    const s = useWorshipStore.getState();
    s.setPrayer('2026-02-02', 'fajr', 'jamaah');
    s.setQuranMinutes('2026-02-02', 20);
    s.setDayNote('2026-02-02', 'iyi geçti');
    const gun = useWorshipStore.getState().days['2026-02-02'];
    expect(gun?.prayers.fajr).toBe('jamaah');
    expect(gun?.quranMinutes).toBe(20);
    expect(gun?.note).toBe('iyi geçti');
  });

  it('namaz işareti kaldırılabilir', () => {
    const s = useWorshipStore.getState();
    s.setPrayer('2026-02-02', 'asr', 'alone');
    s.setPrayer('2026-02-02', 'asr', null);
    expect(useWorshipStore.getState().days['2026-02-02']?.prayers.asr).toBeUndefined();
  });

  it('oruç kaydı eklenir ve silinir', () => {
    const s = useWorshipStore.getState();
    s.setFast('2026-03-20', 'ramadan', true);
    expect(useWorshipStore.getState().fasts['2026-03-20']?.kind).toBe('ramadan');
    s.clearFast('2026-03-20');
    expect(useWorshipStore.getState().fasts['2026-03-20']).toBeUndefined();
  });

  it('bozuk hidrasyon varsayılana düşer', () => {
    useWorshipStore.getState().hydrate({});
    for (const slot of QADA_SLOTS) {
      expect(useWorshipStore.getState().qada[slot]).toBe(0);
    }
  });
});
