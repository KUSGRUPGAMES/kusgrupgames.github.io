/**
 * Widget verisi ve Swift tarafının sözleşmesi — D30.
 * Swift derleyicisi burada yok; alan adları kayarsa widget sessizce boş
 * kalırdı. Bu sınama iki tarafı metin olarak karşılaştırır.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildWidgetPayload, nextTwo, WIDGET_KEY } from '@/features/widget/payload';
import { rangeSchedule } from '@/features/prayer/schedule';

const KOK = join(__dirname, '..');
const swift = (ad: string) => readFileSync(join(KOK, 'targets', 'widget', ad), 'utf8');

/** Bir Swift struct'ının `let` alan adları. */
function alanlar(kaynak: string, yapi: string): string[] {
  const m = new RegExp(`struct ${yapi}[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(kaynak);
  if (!m) throw new Error(`${yapi} bulunamadı`);
  return [...m[1]!.matchAll(/^\s+let (\w+):/gm)].map((x) => x[1]!).sort();
}

const istanbul = {
  latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul',
  options: { method: 'diyanet' as const, asrShadow: 1 as const, adjustments: {} },
};

describe('widget verisi', () => {
  const gunler = rangeSchedule(istanbul, { year: 2026, month: 8, day: 25 }, 2);
  const veri = buildWidgetPayload({
    city: 'İstanbul', days: gunler, label: (k) => k,
    labels: { next: 'Sıradaki vakit', openApp: 'aç', verseOfDay: 'âyet', duaOfDay: 'dua', times: 'vakitler' },
    daily: [{ d: '2026-09-25', ar: 'ا', tr: 't', ref: 'r', duaTitle: 'b', dua: 'd' }],
  });

  it('vakitler sıralı, iki günde on iki vakit, saat biçimi SS:DD', () => {
    expect(veri.times).toHaveLength(12);
    for (let i = 1; i < veri.times.length; i++) expect(veri.times[i]!.t).toBeGreaterThan(veri.times[i - 1]!.t);
    for (const v of veri.times) expect(v.hm).toMatch(/^\d{2}:\d{2}$/);
    expect(veri.times[0]!.d).toBe('2026-09-25');
  });

  it('sıradaki iki vakit', () => {
    const [a, b] = nextTwo(veri.times, veri.times[2]!.t - 1)!;
    expect(a).toBe(veri.times[2]);
    expect(b).toBe(veri.times[3]);
    expect(nextTwo(veri.times, veri.times[11]!.t + 1)).toBeNull();
  });

  it('Swift Codable alanları JSON anahtarlarıyla birebir', () => {
    const k = swift('Paylasilan.swift');
    expect(alanlar(k, 'BesVeri')).toEqual(Object.keys(veri).sort());
    expect(alanlar(k, 'BesVakit')).toEqual(Object.keys(veri.times[0]!).sort());
    expect(alanlar(k, 'BesGunluk')).toEqual(Object.keys(veri.daily[0]!).sort());
    expect(alanlar(k, 'BesEtiketler')).toEqual(Object.keys(veri.labels).sort());
    expect(k).toContain(`"${WIDGET_KEY}"`);
  });

  it('canlı etkinlik türü iki hedefte aynı', () => {
    const govde = (s: string) => /struct BesVakitAttributes: ActivityAttributes \{([\s\S]*?)\n\}/.exec(s)?.[1]?.replace(/\s+/g, ' ');
    const widget = govde(swift('VakitAktivitesi.swift'));
    const modul = govde(readFileSync(join(KOK, 'modules', 'bes-live-activity', 'ios', 'BesLiveActivityModule.swift'), 'utf8'));
    expect(widget).toBeTruthy();
    expect(modul).toBe(widget);
  });
});
