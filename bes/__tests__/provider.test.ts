import { resolveDay, localProvider, type PrayerTimesProvider } from '@/features/prayer/provider';
import { useLocationStore } from '@/store/locations';
import type { ScheduleInput } from '@/features/prayer/schedule';
import { findPlace } from '@/features/location/places';

const istanbul: ScheduleInput = {
  latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul',
  options: { method: 'diyanet', asrShadow: 1 },
};

const kirikAg: PrayerTimesProvider = {
  id: 'network', needsNetwork: true,
  async getDay() { throw new Error('sunucu yok'); },
};

const calisanAg: PrayerTimesProvider = {
  id: 'network', needsNetwork: true,
  async getDay(input, y, m, d) {
    const local = await localProvider.getDay(input, y, m, d);
    return { ...local, times: { ...local.times, dhuhr: 12.5 } };
  },
};

describe('vakit kaynağı çözümü', () => {
  it('varsayılan yerel hesap — internet gerekmez', async () => {
    const r = await resolveDay(istanbul, 2026, 2, 15, { preferred: 'local', online: false });
    expect(r.source).toBe('local');
    expect(r.fellBack).toBe(false);
    expect(r.schedule.times.dhuhr).not.toBeNull();
  });

  it('ağ kaynağı seçili ve çalışıyorsa o kullanılır', async () => {
    const r = await resolveDay(istanbul, 2026, 2, 15, { preferred: 'network', online: true, network: calisanAg });
    expect(r.source).toBe('network');
    expect(r.schedule.times.dhuhr).toBe(12.5);
  });

  it('ağ kaynağı çökerse sessizce hesaba düşülür — boş dönmez', async () => {
    const r = await resolveDay(istanbul, 2026, 2, 15, { preferred: 'network', online: true, network: kirikAg });
    expect(r.source).toBe('local');
    expect(r.fellBack).toBe(true);
    expect(r.schedule.times.fajr).not.toBeNull();
  });

  it('çevrimdışıyken ağ kaynağı hiç denenmez', async () => {
    let denendi = false;
    const izleyen: PrayerTimesProvider = {
      id: 'network', needsNetwork: true,
      async getDay(...args) { denendi = true; return localProvider.getDay(...args); },
    };
    const r = await resolveDay(istanbul, 2026, 2, 15, { preferred: 'network', online: false, network: izleyen });
    expect(denendi).toBe(false);
    expect(r.source).toBe('local');
  });
});

describe('konum deposu', () => {
  beforeEach(() => useLocationStore.setState({ locations: [], activeId: null, hydrated: false }));

  const ist = findPlace('tr-34')!;
  const ank = findPlace('tr-06')!;

  it('ilk eklenen konum birincil ve aktif olur', () => {
    const k = useLocationStore.getState().add(ist);
    expect(k.isPrimary).toBe(true);
    expect(useLocationStore.getState().active()?.id).toBe('tr-34');
  });

  it('ikinci konum birincili değiştirmez', () => {
    useLocationStore.getState().add(ist);
    useLocationStore.getState().add(ank);
    const s = useLocationStore.getState();
    expect(s.locations.filter((l) => l.isPrimary)).toHaveLength(1);
    expect(s.locations.find((l) => l.isPrimary)?.id).toBe('tr-34');
    // Yeni eklenen aktif olur ama birincil olmaz.
    expect(s.activeId).toBe('tr-06');
  });

  it('aynı yer iki kez eklenmez', () => {
    useLocationStore.getState().add(ist);
    useLocationStore.getState().add(ist, { label: 'Ev' });
    const s = useLocationStore.getState();
    expect(s.locations).toHaveLength(1);
    expect(s.locations[0]?.label).toBe('Ev');
  });

  it('birincil silinirse başka bir konum birincil olur', () => {
    useLocationStore.getState().add(ist);
    useLocationStore.getState().add(ank);
    useLocationStore.getState().remove('tr-34');
    const s = useLocationStore.getState();
    expect(s.locations).toHaveLength(1);
    expect(s.locations[0]?.isPrimary).toBe(true);
    expect(s.active()?.id).toBe('tr-06');
  });

  it('hepsi silinince aktif null olur, çökmez', () => {
    useLocationStore.getState().add(ist);
    useLocationStore.getState().remove('tr-34');
    expect(useLocationStore.getState().active()).toBeNull();
  });

  it('olmayan konuma geçilemez', () => {
    useLocationStore.getState().add(ist);
    useLocationStore.getState().setActive('yok');
    expect(useLocationStore.getState().activeId).toBe('tr-34');
  });

  it('bozuk kayıttan hidrasyon birincil eksikliğini onarır', () => {
    useLocationStore.getState().hydrate(
      [{ ...ist, label: 'a', isPrimary: false, origin: 'manual', savedAt: 1 },
       { ...ank, label: 'b', isPrimary: false, origin: 'manual', savedAt: 2 }],
      null,
    );
    const s = useLocationStore.getState();
    expect(s.locations.filter((l) => l.isPrimary)).toHaveLength(1);
    expect(s.activeId).not.toBeNull();
  });
});
