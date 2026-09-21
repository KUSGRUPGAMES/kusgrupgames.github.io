/**
 * Yerel yedek — DECISIONS D19.
 *
 * Bu modülün tek işi kullanıcının yıllarca biriktirdiği kaydı kaybetmemek.
 * Sınamaların önceliği de o: **birleştirme hiçbir kaydı silmez**. Yanında
 * bozuk/yabancı/daha yeni dosyaların uygulamayı çökertmediği denetlenir —
 * kullanıcı bir gün yanlışlıkla başka bir JSON seçecektir.
 */
import {
  BACKUP_FORMAT, BACKUP_VERSION, backupFileName, createBackup, parseBackup,
  restore, totalAdded, isFreshDevice, type BackupPayload,
} from '@/features/backup/backup';

const bosPayload = (): BackupPayload => ({
  settings: { language: 'tr' },
  locations: { locations: [], activeId: null },
  favorites: [],
  homeLayout: null,
  reading: { position: null, bookmarks: [] },
  worship: { sessions: [], khatms: [], reminders: [], qada: {}, qadaHistory: [], days: {}, fasts: {} },
});

const konum = (id: string, savedAt: number) => ({
  id, name: id, country: 'TR', countryCode: 'TR', timezone: 'Europe/Istanbul',
  latitude: 41, longitude: 29, label: id, isPrimary: false, origin: 'manual' as const, savedAt,
});

const yerImi = (id: string, createdAt: number, not?: string) => ({
  id, surah: 2, ayah: 255, color: 'gold', createdAt, ...(not ? { note: not } : {}),
});

describe('yedek dosyası', () => {
  it('yazılan yedek geri okunabiliyor', () => {
    const yedek = createBackup(bosPayload(), '1.0.0', 1_700_000_000_000);
    const sonuc = parseBackup(JSON.stringify(yedek));
    expect(sonuc.ok).toBe(true);
    if (sonuc.ok) {
      expect(sonuc.backup.format).toBe(BACKUP_FORMAT);
      expect(sonuc.backup.version).toBe(BACKUP_VERSION);
      expect(sonuc.backup.app).toBe('1.0.0');
    }
  });

  it('dosya adı tarihe göre sıralanabiliyor', () => {
    const ad = backupFileName(new Date(2026, 8, 21, 9, 5));
    expect(ad).toBe('bes-yedek-2026-09-21-0905.json');
    // Alfabetik sıra = zaman sırası olmalı.
    expect(backupFileName(new Date(2026, 8, 21, 9, 5)) < backupFileName(new Date(2026, 9, 1, 0, 0))).toBe(true);
  });

  it('bozuk, yabancı ve daha yeni dosyalar ayrı ayrı reddediliyor', () => {
    const bekle = (metin: string, sebep: string) => {
      const s = parseBackup(metin);
      expect({ metin: metin.slice(0, 24), ok: s.ok, sebep: s.ok ? null : s.reason })
        .toEqual({ metin: metin.slice(0, 24), ok: false, sebep });
    };
    bekle('bu json değil', 'json');
    bekle('"düz metin"', 'format');
    bekle(JSON.stringify({ hello: 'world' }), 'format');
    // Başka bir uygulamanın yedeği.
    bekle(JSON.stringify({ format: 'baska.app', version: 1 }), 'format');
    // Gelecekteki bir sürüm: yarım uygulamak veri kaybı demek.
    bekle(JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION + 1, app: '9', createdAt: 0, payload: {} }), 'version');
    // Doğru zarf, bozuk içerik.
    bekle(JSON.stringify({ format: BACKUP_FORMAT, version: 1, app: '1', createdAt: 0, payload: { locations: 5 } }), 'schema');
  });

  it('eski sürümden gelen yedek kabul ediliyor', () => {
    const eski = { format: BACKUP_FORMAT, version: 1, app: '0.9.0', createdAt: 1, payload: bosPayload() };
    expect(parseBackup(JSON.stringify(eski)).ok).toBe(true);
  });
});

describe('birleştirme — hiçbir kayıt kaybolmaz', () => {
  it('iki taraftaki farklı kayıtların hepsi kalıyor', () => {
    const cihaz = bosPayload();
    cihaz.locations.locations = [konum('istanbul', 10)];
    cihaz.reading.bookmarks = [yerImi('a', 10)];
    cihaz.favorites = [{ kind: 'dua', recordId: 'd1', createdAt: 10 }];

    const yedek = bosPayload();
    yedek.locations.locations = [konum('ankara', 20)];
    yedek.reading.bookmarks = [yerImi('b', 20)];
    yedek.favorites = [{ kind: 'ayah', recordId: '2:255', createdAt: 5 }];

    const { payload, report } = restore(cihaz, yedek, 'merge');
    expect(payload.locations.locations.map((l) => l.id).sort()).toEqual(['ankara', 'istanbul']);
    expect(payload.reading.bookmarks.map((b) => b.id).sort()).toEqual(['a', 'b']);
    expect(payload.favorites).toHaveLength(2);
    expect(totalAdded(report)).toBe(3);
  });

  it('aynı yer iminin yeni sürümü kazanıyor, eskisi geri gelmiyor', () => {
    const cihaz = bosPayload();
    cihaz.reading.bookmarks = [yerImi('a', 50, 'yeni not')];
    const yedek = bosPayload();
    yedek.reading.bookmarks = [yerImi('a', 10, 'eski not')];

    const { payload, report } = restore(cihaz, yedek, 'merge');
    expect(payload.reading.bookmarks).toHaveLength(1);
    expect((payload.reading.bookmarks[0] as { note?: string }).note).toBe('yeni not');
    expect(report.added.bookmarks).toBe(0);
  });

  it('favorinin ilk eklenme anı korunuyor', () => {
    const cihaz = bosPayload();
    cihaz.favorites = [{ kind: 'dua', recordId: 'd1', createdAt: 900 }];
    const yedek = bosPayload();
    yedek.favorites = [{ kind: 'dua', recordId: 'd1', createdAt: 100 }];
    const { payload } = restore(cihaz, yedek, 'merge');
    expect(payload.favorites).toEqual([{ kind: 'dua', recordId: 'd1', createdAt: 100 }]);
  });

  it('hatimde okunan cüzler birleşiyor — "son yazan kazanır" burada yanlış', () => {
    const cihaz = bosPayload();
    cihaz.worship.khatms = [{ id: 'k1', title: 'Hatim', startedOn: '2026-01-01', completedJuz: [1, 2], active: true }];
    const yedek = bosPayload();
    yedek.worship.khatms = [{ id: 'k1', title: 'Hatim', startedOn: '2026-01-01', completedJuz: [3], active: false }];

    const { payload } = restore(cihaz, yedek, 'merge');
    expect(payload.worship.khatms?.[0]?.completedJuz).toEqual([1, 2, 3]);
    expect(payload.worship.khatms?.[0]?.active).toBe(true);
  });

  it('ibadet defteri gün gün birleşiyor', () => {
    const cihaz = bosPayload();
    cihaz.worship.days = {
      '2026-01-01': { date: '2026-01-01', prayers: { fajr: 'jamaah' }, quranMinutes: 10 },
    };
    const yedek = bosPayload();
    yedek.worship.days = {
      '2026-01-01': { date: '2026-01-01', prayers: { isha: 'alone' }, quranMinutes: 25, note: 'yedekten' },
      '2026-01-02': { date: '2026-01-02', prayers: {}, quranMinutes: 5 },
    };

    const { payload, report } = restore(cihaz, yedek, 'merge');
    const gun = payload.worship.days?.['2026-01-01'];
    expect(gun?.prayers).toEqual({ fajr: 'jamaah', isha: 'alone' });
    // Okuma süresi ikisinin büyüğü: bir cihazdaki dakika yutulmaz.
    expect(gun?.quranMinutes).toBe(25);
    // Cihazda not yoktu, yedekten geldi.
    expect(gun?.note).toBe('yedekten');
    expect(report.added.days).toBe(1);
  });

  it('cihazdaki not yedeğinkiyle ezilmiyor', () => {
    const cihaz = bosPayload();
    cihaz.worship.days = { g: { date: 'g', prayers: {}, quranMinutes: 0, note: 'benim notum' } };
    const yedek = bosPayload();
    yedek.worship.days = { g: { date: 'g', prayers: {}, quranMinutes: 0, note: 'eski not' } };
    const { payload } = restore(cihaz, yedek, 'merge');
    expect(payload.worship.days?.g?.note).toBe('benim notum');
  });
});

describe('kaza sayaçları ve ayarlar', () => {
  // Sayaçlar birleştirilemez: ortak ata yok. İki telefonda da kaza kılınmışsa
  // "topla" da "en büyüğü al" da yanlış sonuç verir. Kural açık ve
  // anlatılabilir olmalı.
  it('boş cihaza geri yüklenirken yedekten alınıyor', () => {
    const cihaz = bosPayload();
    const yedek = bosPayload();
    yedek.worship.qada = { fajr: 120 };
    yedek.settings = { language: 'en' };

    expect(isFreshDevice(cihaz)).toBe(true);
    const { payload, report } = restore(cihaz, yedek, 'merge');
    expect(payload.worship.qada).toEqual({ fajr: 120 });
    expect(payload.settings).toEqual({ language: 'en' });
    expect(report.countersFromBackup).toBe(true);
  });

  it('kullanılmış cihazda cihazınki korunuyor ve raporda söyleniyor', () => {
    const cihaz = bosPayload();
    cihaz.worship.qada = { fajr: 30 };
    cihaz.worship.qadaHistory = [{ id: 'x', slot: 'fajr', delta: -1, at: 5 }];
    const yedek = bosPayload();
    yedek.worship.qada = { fajr: 500 };

    expect(isFreshDevice(cihaz)).toBe(false);
    const { payload, report } = restore(cihaz, yedek, 'merge');
    // Eski yedek yüzünden kılınmış 470 namaz geri gelmemeli.
    expect(payload.worship.qada).toEqual({ fajr: 30 });
    expect(report.countersFromBackup).toBe(false);
    expect(report.settingsFromBackup).toBe(false);
  });

  it('kaza geçmişi birleşiyor ve 200 kayıtla sınırlı kalıyor', () => {
    const cihaz = bosPayload();
    cihaz.worship.qadaHistory = Array.from({ length: 150 }, (_, i) => ({ id: `a${i}`, slot: 'fajr' as const, delta: -1, at: i }));
    const yedek = bosPayload();
    yedek.worship.qadaHistory = Array.from({ length: 150 }, (_, i) => ({ id: `b${i}`, slot: 'isha' as const, delta: -1, at: 1000 + i }));

    const { payload } = restore(cihaz, yedek, 'merge');
    expect(payload.worship.qadaHistory).toHaveLength(200);
    // En yeniler tutulur.
    expect(payload.worship.qadaHistory?.[0]?.at).toBe(1149);
  });
});

describe('yerine koyma kipi', () => {
  it('yedek olduğu gibi yazılıyor', () => {
    const cihaz = bosPayload();
    cihaz.worship.qada = { fajr: 30 };
    cihaz.reading.bookmarks = [yerImi('a', 10)];
    const yedek = bosPayload();
    yedek.worship.qada = { isha: 7 };

    const { payload, report } = restore(cihaz, yedek, 'replace');
    expect(payload).toBe(yedek);
    expect(payload.reading.bookmarks).toEqual([]);
    expect(report.mode).toBe('replace');
    expect(report.countersFromBackup).toBe(true);
  });
});

describe('gidiş-dönüş', () => {
  it('yedek al → boş cihaza yükle → veri birebir aynı', () => {
    const asil = bosPayload();
    asil.locations = { locations: [konum('istanbul', 10)], activeId: 'istanbul' };
    asil.favorites = [{ kind: 'name', recordId: 'n1', createdAt: 3 }];
    asil.reading = { position: { surah: 18, ayah: 10, updatedAt: 77 }, bookmarks: [yerImi('a', 10)] };
    asil.worship = {
      sessions: [{ id: 's1', title: 'Sübhânallah', count: 33, target: 33, onDate: '2026-01-01', createdAt: 1 }],
      khatms: [], reminders: [], qada: { asr: 4 }, qadaHistory: [],
      days: { '2026-01-01': { date: '2026-01-01', prayers: { asr: 'alone' }, quranMinutes: 12 } },
      fasts: { '2026-03-01': { date: '2026-03-01', kind: 'ramadan', completed: true } },
    };

    const metin = JSON.stringify(createBackup(asil, '1.0.0'));
    const okunan = parseBackup(metin);
    expect(okunan.ok).toBe(true);
    if (!okunan.ok) return;

    const { payload } = restore(bosPayload(), okunan.backup.payload, 'merge');
    expect(payload.locations.activeId).toBe('istanbul');
    expect(payload.reading.position).toEqual({ surah: 18, ayah: 10, updatedAt: 77 });
    expect(payload.worship.qada).toEqual({ asr: 4 });
    expect(payload.worship.sessions).toHaveLength(1);
    expect(payload.worship.fasts?.['2026-03-01']?.completed).toBe(true);
  });

  it('etkin konum silinmişse geçerli bir konuma düşüyor', () => {
    const cihaz = bosPayload();
    cihaz.locations = { locations: [], activeId: 'yok' };
    const yedek = bosPayload();
    yedek.locations = { locations: [konum('bursa', 1)], activeId: 'bursa' };
    const { payload } = restore(cihaz, yedek, 'merge');
    expect(payload.locations.activeId).toBe('bursa');
  });
});
