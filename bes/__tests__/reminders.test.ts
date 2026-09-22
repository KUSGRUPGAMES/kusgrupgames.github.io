import { planReminders, describeTrigger, type Reminder } from '@/features/notifications/reminders';
import { rangeSchedule, type ScheduleInput } from '@/features/prayer/schedule';

const istanbul: ScheduleInput = {
  latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul',
  options: { method: 'diyanet', asrShadow: 1 },
};
const tromso: ScheduleInput = {
  latitude: 69.6492, longitude: 18.9553, timezone: 'Europe/Oslo',
  options: { method: 'mwl', asrShadow: 1 },
};

const gunler = (input: ScheduleInput, n = 7) =>
  rangeSchedule(input, { year: 2026, month: 2, day: 15 }, n);

const saatlik = (over: Partial<Reminder> = {}): Reminder => ({
  id: 'r1', title: 'Kuran oku', trigger: { kind: 'time', hour: 21, minute: 0 },
  weekdays: [], enabled: true, ...over,
});

const vakitli = (over: Partial<Reminder> = {}): Reminder => ({
  id: 'r2', title: 'Salavat', trigger: { kind: 'prayer', slot: 'maghrib', offsetMinutes: -30 },
  weekdays: [], enabled: true, ...over,
});

const now = new Date('2026-03-15T00:00:00Z');

describe('özel hatırlatıcılar', () => {
  it('sabit saatli hatırlatıcı her gün planlanır', () => {
    const p = planReminders([saatlik()], gunler(istanbul), now);
    expect(p).toHaveLength(7);
  });

  it('kapalı hatırlatıcı planlanmaz', () => {
    expect(planReminders([saatlik({ enabled: false })], gunler(istanbul), now)).toEqual([]);
  });

  it('haftanın seçili günlerinde planlanır', () => {
    // 15 Mart 2026 pazar; yalnız cuma (5) seçilirse 7 günde bir kez düşer.
    const p = planReminders([saatlik({ weekdays: [5] })], gunler(istanbul), now);
    expect(p).toHaveLength(1);
  });

  it('vakte göre hatırlatıcı vaktin öncesine kurulur', () => {
    const g = gunler(istanbul, 1);
    const p = planReminders([vakitli()], g, now);
    const aksam = g[0]!.entries.find((e) => e.key === 'maghrib')!.at!;
    expect(p[0]!.at.getTime()).toBe(aksam.getTime() - 30 * 60000);
  });

  it('geçmiş anlar atlanır', () => {
    const g = gunler(istanbul, 2);
    const sonra = new Date('2026-03-15T23:00:00Z');
    const p = planReminders([saatlik()], g, sonra);
    for (const x of p) expect(x.at.getTime()).toBeGreaterThan(sonra.getTime());
  });

  it('plan zaman sırasındadır', () => {
    const p = planReminders([saatlik(), vakitli()], gunler(istanbul), now);
    for (let i = 1; i < p.length; i++) {
      expect(p[i]!.at.getTime()).toBeGreaterThanOrEqual(p[i - 1]!.at.getTime());
    }
  });

  it('sınır aşılmaz', () => {
    const p = planReminders([saatlik(), vakitli()], gunler(istanbul, 30), now, 10);
    expect(p).toHaveLength(10);
  });

  it('oluşmayan vakte bağlı hatırlatıcı kurulmaz', () => {
    const g = rangeSchedule(tromso, { year: 2026, month: 5, day: 18 }, 5);
    const p = planReminders(
      [vakitli({ trigger: { kind: 'prayer', slot: 'fajr', offsetMinutes: 0 } })],
      g,
      new Date('2026-06-18T00:00:00Z'),
    );
    expect(p).toEqual([]);
  });

  it('kimlikler tekildir', () => {
    const p = planReminders([saatlik(), vakitli()], gunler(istanbul), now);
    expect(new Set(p.map((x) => x.id)).size).toBe(p.length);
  });

  it('tetikleyici okunur biçimde anlatılır', () => {
    expect(describeTrigger({ kind: 'time', hour: 7, minute: 5 })).toBe('07:05');
    expect(describeTrigger({ kind: 'prayer', slot: 'isha', offsetMinutes: -15 })).toContain('-15');
  });
});
