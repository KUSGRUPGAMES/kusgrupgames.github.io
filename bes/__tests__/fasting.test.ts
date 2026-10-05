import { planFasting, defaultFastingSettings, type FastingSettings } from '@/features/notifications/fasting';
import { rangeSchedule } from '@/features/prayer/schedule';

const gunler = rangeSchedule({ latitude: 39.93, longitude: 32.86, timezone: 'Europe/Istanbul', options: { method: 'diyanet', asrShadow: 1 } },
  { year: 2026, month: 9, day: 5 }, 3);
const once = new Date(Date.UTC(2026, 9, 4, 12));
const ayar = (p: Partial<FastingSettings>): FastingSettings => ({ ...defaultFastingSettings, ...p });

describe('oruç bildirimleri (5 Ekim)', () => {
  it('varsayılan kapalı: Ramazan dışında hiçbir oruç bildirimi yok', () => {
    expect(planFasting(gunler, defaultFastingSettings, () => true, new Set(), once)).toEqual([]);
    expect(planFasting(gunler, ayar({ mode: 'ramadan' }), () => false, new Set(), once)).toEqual([]);
  });
  it('her gün: sahur imsaktan N dk önce, imsak sabah vaktinde, iftar akşamda', () => {
    const p = planFasting(gunler, ayar({ mode: 'everyday', sahurMinutes: 45 }), () => false, new Set(), once);
    expect(p).toHaveLength(9);
    const g = gunler[0]!;
    const fajr = g.entries.find((e) => e.key === 'fajr')!.at!.getTime();
    expect(p[0]).toMatchObject({ event: 'sahur', minutes: 45 });
    expect(p[0]!.at.getTime()).toBe(fajr - 45 * 60000);
    expect(p[1]!.at.getTime()).toBe(fajr);
    expect(p[2]!.at.getTime()).toBe(g.entries.find((e) => e.key === 'maghrib')!.at!.getTime());
  });
  it('planlı: yalnız İbadet → Oruç’ta işaretli günler; kapalı seçenekler atlanır; geçmiş kurulmaz', () => {
    const p = planFasting(gunler, ayar({ mode: 'planned', sahurMinutes: 0, atImsak: false }), () => false, new Set(['2026-10-06']), once);
    expect(p.map((x) => x.id)).toEqual(['reminder-oruc-20261006-iftar']);
    const sonra = new Date(Date.UTC(2026, 9, 7, 23));
    expect(planFasting(gunler, ayar({ mode: 'everyday' }), () => false, new Set(), sonra)).toEqual([]);
  });
});
