import { planNotifications, coverageDays, defaultNotificationSettings, PLATFORM_LIMIT, type NotificationSettings } from '@/features/notifications/plan';
import { birlesikPlan, farkAl, bildirimImzasi, planImzasi, type KurulacakBildirim } from '@/features/notifications/coordinator';
import { reminderCoverageDays, type Reminder } from '@/features/notifications/reminders';
import type { PrayerKey } from '@/features/prayer/methods';
import { rangeSchedule, type ScheduleInput } from '@/features/prayer/schedule';

const istanbul: ScheduleInput = {
  latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul',
  options: { method: 'diyanet', asrShadow: 1 },
};
const tromso: ScheduleInput = {
  latitude: 69.6492, longitude: 18.9553, timezone: 'Europe/Oslo',
  options: { method: 'mwl', asrShadow: 1 },
};

const gunler = (input: ScheduleInput, y: number, m: number, d: number, n = 14) =>
  rangeSchedule(input, { year: y, month: m, day: d }, n);

describe('bildirim planı', () => {
  const now = new Date('2026-03-15T09:00:00Z'); // İstanbul 12:00

  it('kapalıyken hiçbir bildirim kurulmaz', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15), { ...defaultNotificationSettings, enabled: false }, now);
    expect(p).toEqual([]);
  });

  it('geçmiş anlar planlanmaz', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15), defaultNotificationSettings, now);
    expect(p.length).toBeGreaterThan(0);
    for (const n of p) expect(n.at.getTime()).toBeGreaterThan(now.getTime());
  });

  it('plan zaman sırasındadır', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15), defaultNotificationSettings, now);
    for (let i = 1; i < p.length; i++) {
      expect(p[i]!.at.getTime()).toBeGreaterThanOrEqual(p[i - 1]!.at.getTime());
    }
  });

  it('platform sınırı aşılmaz', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15, 30), defaultNotificationSettings, now);
    expect(p.length).toBeLessThanOrEqual(PLATFORM_LIMIT);
  });

  it('güneş varsayılan olarak bildirilmez', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15), defaultNotificationSettings, now);
    expect(p.some((n) => n.key === 'sunrise')).toBe(false);
  });

  it('kapatılan vakit planlanmaz', () => {
    const p = planNotifications(
      gunler(istanbul, 2026, 2, 15),
      { ...defaultNotificationSettings, perPrayer: { fajr: false } },
      now,
    );
    expect(p.some((n) => n.key === 'fajr')).toBe(false);
    expect(p.some((n) => n.key === 'dhuhr')).toBe(true);
  });

  it('erken uyarı vaktin tam N dakika öncesine kurulur', () => {
    const p = planNotifications(
      gunler(istanbul, 2026, 2, 15),
      { ...defaultNotificationSettings, beforeMinutes: 15, alsoAtTime: false },
      now,
    );
    for (const n of p) {
      expect(n.prayerAt.getTime() - n.at.getTime()).toBe(15 * 60000);
    }
  });

  it('erken uyarı açıkken vakit girişi de ayrı kimlikle bildirilir', () => {
    const p = planNotifications(
      gunler(istanbul, 2026, 2, 15),
      { ...defaultNotificationSettings, beforeMinutes: 15 },
      now,
    );
    const erken = p.filter((n) => n.beforeMinutes === 15);
    const vakit = p.filter((n) => n.beforeMinutes === 0);
    expect(erken.length).toBeGreaterThan(0);
    expect(vakit.length).toBe(erken.length);
    for (const n of vakit) expect(n.at.getTime()).toBe(n.prayerAt.getTime());
    expect(new Set(p.map((n) => n.id)).size).toBe(p.length);
  });

  it('çift bildirimde kapsama günü yarıya iner (64 sınırı)', () => {
    const tek = coverageDays({ ...defaultNotificationSettings, beforeMinutes: 15, alsoAtTime: false });
    const cift = coverageDays({ ...defaultNotificationSettings, beforeMinutes: 15 });
    expect(cift).toBe(Math.floor(64 / 10));
    expect(tek).toBe(Math.floor(64 / 5));
  });

  it('gece yarısını aşan yatsı doğru güne kurulur', () => {
    // Tromsø'da yaz ortasında yatsı gece yarısını aşar; bildirim anı
    // her zaman akşamdan sonra olmalı, aynı günün sabahına düşmemeli.
    const g = gunler(tromso, 2026, 4, 15, 7);
    const p = planNotifications(g, defaultNotificationSettings, new Date('2026-05-15T00:00:00Z'));
    for (const n of p.filter((x) => x.key === 'isha')) {
      const gun = g.find((d) => n.id.includes(`${d.year}${String(d.month + 1).padStart(2, '0')}${String(d.day).padStart(2, '0')}`));
      const aksam = gun?.entries.find((e) => e.key === 'maghrib')?.at;
      if (aksam) expect(n.prayerAt.getTime()).toBeGreaterThan(aksam.getTime());
    }
  });

  it('oluşmayan vakit için bildirim kurulmaz', () => {
    const g = gunler(tromso, 2026, 5, 18, 5);
    const p = planNotifications(g, { ...defaultNotificationSettings, includeSunrise: true }, new Date('2026-06-18T00:00:00Z'));
    expect(p.some((n) => n.key === 'fajr')).toBe(false);
    expect(p.length).toBeGreaterThan(0);
  });

  it('kimlikler tekildir ve aynı girdide aynı kalır', () => {
    const g = gunler(istanbul, 2026, 2, 15);
    const a = planNotifications(g, defaultNotificationSettings, now);
    const b = planNotifications(g, defaultNotificationSettings, now);
    expect(new Set(a.map((n) => n.id)).size).toBe(a.length);
    expect(a.map((n) => n.id)).toEqual(b.map((n) => n.id));
  });

  it('kapsama gün sayısı açık vakit sayısına göre hesaplanır', () => {
    expect(coverageDays(defaultNotificationSettings)).toBe(12);       // 5 vakit
    expect(coverageDays({ ...defaultNotificationSettings, includeSunrise: true })).toBe(10);
    expect(coverageDays({ ...defaultNotificationSettings, perPrayer: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false } })).toBe(0);
  });
});

describe('koordinatör — birleşik plan', () => {
  const now = new Date('2026-03-15T09:00:00Z');
  const gun30 = () => gunler(istanbul, 2026, 2, 15, 30);

  const metin = {
    vakitBaslik: () => 'Vakit',
    vakitGovde: (_k: PrayerKey, oncesi: number) => (oncesi > 0 ? `${oncesi} dk` : 'girdi'),
  };

  const hatirlatici = (id: string, hour: number): Reminder => ({
    id, title: `H${id}`, trigger: { kind: 'time', hour, minute: 0 }, weekdays: [], enabled: true,
  });

  it('64 sınırı iki listenin TOPLAMINA uygulanır', () => {
    // Hatırlatıcılar artık gerçekten kurulduğu için bütçe **birleşik**
    // listeye uygulanmalı. Ayrı ayrı 64 verilip ikisi de kurulsaydı cihaza
    // 128'e kadar kayıt giderdi ve iOS fazlasını sessizce atardı.
    //
    // Not: eski kodda bu bir hata DEĞİLDİ, çünkü hatırlatıcılar hiç
    // kurulmuyordu ve kurulan tek liste zaten 64'e kesiliyordu. Kusur, #1
    // düzeltilince doğuyor.
    const p = birlesikPlan({
      gunler: gun30(),
      bildirimAyari: defaultNotificationSettings,
      hatirlaticilar: [hatirlatici('a', 21), hatirlatici('b', 22), hatirlatici('c', 23)],
      metin,
    }, now);
    expect(p.length).toBe(PLATFORM_LIMIT);
  });

  it('hatırlatıcılar plana gerçekten giriyor', () => {
    // Eskiden `planReminders` yalnız önizleme listesinde çağrılıyordu;
    // hiçbir hatırlatıcı cihaza kurulmuyordu. Genel anahtar burada AÇIK —
    // yalnız vakit bildirimleri tek tek kapalı; izolasyon böyle sağlanır
    // (genel anahtar artık hatırlatıcıları da kapsıyor, bkz. aşağıki grup).
    const vakitsiz: NotificationSettings = {
      ...defaultNotificationSettings,
      perPrayer: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
      includeSunrise: false,
    };
    const p = birlesikPlan({
      gunler: gunler(istanbul, 2026, 2, 15, 2),
      bildirimAyari: vakitsiz,
      hatirlaticilar: [hatirlatici('a', 21)],
      metin,
    }, now);
    expect(p.length).toBeGreaterThan(0);
    expect(p.every((n) => n.tur === 'reminder')).toBe(true);
  });

  it('genel anahtar KAPALIYKEN ne vakit ne hatırlatıcı plana girer', () => {
    // Kullanıcının kendi ayrımı olmayan tek bir "Bildirimler" anahtarı var
    // (Ayarlar → Bildirimler). Eskiden bu anahtar yalnız vakit bildirimlerini
    // kapatıyordu; hatırlatıcılar anahtardan bağımsız kurulmaya devam
    // ediyordu.
    const p = birlesikPlan({
      gunler: gun30(),
      bildirimAyari: { ...defaultNotificationSettings, enabled: false },
      hatirlaticilar: [hatirlatici('a', 21), hatirlatici('b', 22)],
      metin,
    }, now);
    expect(p).toEqual([]);
  });

  it('bütçe dolduğunda en YAKIN anlar korunur', () => {
    const p = birlesikPlan({
      gunler: gun30(),
      bildirimAyari: defaultNotificationSettings,
      hatirlaticilar: [hatirlatici('a', 21)],
      metin,
    }, now);
    for (let i = 1; i < p.length; i++) {
      expect(p[i]!.at.getTime()).toBeGreaterThanOrEqual(p[i - 1]!.at.getTime());
    }
    // Kesilen kuyruk uzaktakiler olmalı: son eleman ilk elemandan sonra.
    expect(p[p.length - 1]!.at.getTime()).toBeGreaterThan(p[0]!.at.getTime());
  });

  it('erken uyarı varsa gövde "kaldı" metnini alır', () => {
    const p = birlesikPlan({
      gunler: gunler(istanbul, 2026, 2, 15, 2),
      bildirimAyari: { ...defaultNotificationSettings, beforeMinutes: 20 },
      hatirlaticilar: [],
      metin,
    }, now);
    expect(p.length).toBeGreaterThan(0);
    expect(p[0]!.body).toBe('20 dk');
  });
});

describe('koordinatör — fark alma', () => {
  const n = (id: string, ms: number, title = 't', body = 'b'): KurulacakBildirim =>
    ({ id, tur: 'prayer', at: new Date(ms), title, body });
  const k = (id: string, ms: number | null, imza: string | null) => ({ id, at: ms, imza });

  it('değişmeyen kayda dokunulmaz', () => {
    const f = farkAl([n('prayer-1', 1000)], [k('prayer-1', 1000, bildirimImzasi({ title: 't', body: 'b' }, true))], true);
    expect(f).toEqual({ kurulacak: [], iptalEdilecek: [], dokunulmayan: 1 });
  });

  it('zamanı değişen kayıt iptal edilip yeniden kurulur', () => {
    // Erken uyarı dakikası değişince kimlik aynı kalır, zaman değişir.
    const f = farkAl([n('prayer-1', 2000)], [k('prayer-1', 1000, bildirimImzasi({ title: 't', body: 'b' }, true))], true);
    expect(f.iptalEdilecek).toEqual(['prayer-1']);
    expect(f.kurulacak.map((x) => x.id)).toEqual(['prayer-1']);
    expect(f.dokunulmayan).toBe(0);
  });

  it('istenmeyen kayıt iptal edilir', () => {
    const f = farkAl([], [k('reminder-x-20260315', 1000, 'x')], true);
    expect(f.iptalEdilecek).toEqual(['reminder-x-20260315']);
    expect(f.kurulacak).toEqual([]);
  });

  it('BAŞKA kaynağın bildirimine dokunulmaz', () => {
    // Toptan silme tam olarak bu kuralı çiğniyordu.
    const f = farkAl([], [k('baska-uygulama-1', 1000, 'x')], true);
    expect(f.iptalEdilecek).toEqual([]);
  });

  it('zaman damgası okunamayan kayıt yeniden kurulur', () => {
    // Eski sürümden kalan, `data.at` taşımayan kayıtlar.
    const f = farkAl([n('prayer-1', 1000)], [k('prayer-1', null, null)], true);
    expect(f.kurulacak.map((x) => x.id)).toEqual(['prayer-1']);
    expect(f.iptalEdilecek).toEqual(['prayer-1']);
  });

  it('zaman AYNI ama başlık/gövde değişmişse kayıt yeniden kurulur', () => {
    // Dil değişimi: bildirim metni çeviriden gelir, saat değişmez. Yalnız
    // zaman karşılaştıran eski sürüm bu değişikliği kaçırıyordu.
    const eskiImza = bildirimImzasi({ title: 'Old title', body: 'Old body' }, true);
    const f = farkAl([n('prayer-1', 1000, 'Yeni başlık', 'Yeni gövde')], [k('prayer-1', 1000, eskiImza)], true);
    expect(f.kurulacak.map((x) => x.id)).toEqual(['prayer-1']);
    expect(f.iptalEdilecek).toEqual(['prayer-1']);
    expect(f.dokunulmayan).toBe(0);
  });

  it('zaman ve metin AYNI ama ses ayarı değişmişse kayıt yeniden kurulur', () => {
    const sesliImza = bildirimImzasi({ title: 't', body: 'b' }, true);
    const f = farkAl([n('prayer-1', 1000)], [k('prayer-1', 1000, sesliImza)], false);
    expect(f.kurulacak.map((x) => x.id)).toEqual(['prayer-1']);
    expect(f.iptalEdilecek).toEqual(['prayer-1']);
  });
});

describe('koordinatör — kanca tetikleyici imzası (planImzasi)', () => {
  const n = (id: string, ms: number, title = 't', body = 'b'): KurulacakBildirim =>
    ({ id, tur: 'prayer', at: new Date(ms), title, body });

  it('kimlik ve zaman AYNI ama başlık/gövde değişince imza değişir', () => {
    // Bu, useNotificationSync'in kendi eşitleme tetikleyicisi. `id@zaman`
    // yeterli olsaydı, bir hatırlatıcının metni güncellenince (zamanı
    // değişmeden) kanca farkı hiç fark etmez, `esitle()` hiç çağrılmaz,
    // farkAl'ın içerik karşılaştırması devreye bile girmezdi.
    const eski = planImzasi([n('reminder-x', 1000, 'Eski başlık', 'Eski gövde')], true);
    const yeni = planImzasi([n('reminder-x', 1000, 'Yeni başlık', 'Yeni gövde')], true);
    expect(eski).not.toBe(yeni);
  });

  it('kimlik ve zaman AYNI ama ses ayarı değişince imza değişir', () => {
    const sessiz = planImzasi([n('prayer-1', 1000)], false);
    const sesli = planImzasi([n('prayer-1', 1000)], true);
    expect(sessiz).not.toBe(sesli);
  });

  it('hiçbir şey değişmezse imza aynı kalır', () => {
    const a = planImzasi([n('prayer-1', 1000, 'x', 'y')], true);
    const b = planImzasi([n('prayer-1', 1000, 'x', 'y')], true);
    expect(a).toBe(b);
  });
});

describe('koordinatör — yalnız hatırlatıcı açıkken gün sayısı', () => {
  it('vakit bildirimlerinin tamamı kapalıyken hatırlatıcı formülü devreye girer', () => {
    // coverageDays, tüm vakit bildirimleri kapalıyken 0 döner. Gün aralığı
    // yalnız ona dayansaydı (+1 ile tek gün) hatırlatıcılara neredeyse hiç
    // gelecek gün bırakmıyordu.
    const vakitsiz: NotificationSettings = {
      ...defaultNotificationSettings,
      perPrayer: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
      includeSunrise: false,
    };
    expect(coverageDays(vakitsiz)).toBe(0);
    expect(reminderCoverageDays([{ enabled: true }])).toBeGreaterThan(1);
  });

  it('hatırlatıcı yokken formül 0 döner — gereksiz gün üretmez', () => {
    expect(reminderCoverageDays([])).toBe(0);
    expect(reminderCoverageDays([{ enabled: false }])).toBe(0);
  });

  it('daha çok etkin hatırlatıcı daha az gün üretir (bütçe sabit)', () => {
    const bir = reminderCoverageDays([{ enabled: true }]);
    const dort = reminderCoverageDays([{ enabled: true }, { enabled: true }, { enabled: true }, { enabled: true }]);
    expect(dort).toBeLessThan(bir);
    expect(dort).toBeGreaterThan(0);
  });
});

describe('bildirim metinleri', () => {
  it('her vaktin kendi başlığı ve cümlesi var (beş dilde)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const diller = ['tr', 'en', 'ar', 'de', 'fr'].map((l) => require(`@/lib/i18n/strings/${l}`)[l] as Record<string, string>);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PRAYER_KEYS } = require('@/features/prayer/methods') as { PRAYER_KEYS: readonly string[] };
    for (const tablo of diller) {
      for (const k of PRAYER_KEYS) {
        expect(tablo[`notify.title.${k}`]).toBeTruthy();
        expect(tablo[`notify.body.${k}`]).toBeTruthy();
      }
    }
    expect(diller[0]!['notify.title.fajr']).toBe('İmsak vakti girdi');
  });
});

describe('vakitte ezan', () => {
  it('ezan yalnız namaz vaktinin girişinde; önceden uyarıda ve güneşte yok', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { birlesikPlan } = require('@/features/notifications/coordinator') as typeof import('@/features/notifications/coordinator');
    const metin = { vakitBaslik: () => 'b', vakitGovde: () => 'g' };
    const p = birlesikPlan({
      gunler: gunler(istanbul, 2026, 2, 15, 2),
      bildirimAyari: { ...defaultNotificationSettings, beforeMinutes: 10, includeSunrise: true },
      hatirlaticilar: [], metin, ezan: true,
    }, new Date('2026-03-15T00:00:00Z'));
    const ezanli = p.filter((n) => n.ezan);
    expect(ezanli.length).toBeGreaterThan(0);
    for (const n of ezanli) {
      expect(n.id.endsWith('-vakit')).toBe(true);
      expect(n.id.includes('sunrise')).toBe(false);
    }
    const kapali = birlesikPlan({
      gunler: gunler(istanbul, 2026, 2, 15, 2), bildirimAyari: defaultNotificationSettings,
      hatirlaticilar: [], metin, ezan: false,
    }, new Date('2026-03-15T00:00:00Z'));
    expect(kapali.some((n) => n.ezan)).toBe(false);
  });
});
