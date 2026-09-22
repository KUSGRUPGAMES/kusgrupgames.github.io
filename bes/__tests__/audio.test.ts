import {
  initialPlayback, setQueue, setSpeed, setRange, setSleepTimer, sleepExpired,
  advance, next, previous, toggle, current, MIN_SPEED, MAX_SPEED,
  type AyahRef,
} from '@/features/audio/playback';
import { summarize, formatBytes, bytesFreedBy, type DownloadItem } from '@/features/audio/downloads';

const kuyruk: AyahRef[] = [1, 2, 3, 4, 5].map((a) => ({ surah: 1, ayah: a }));

describe('kıraat oynatma mantığı', () => {
  it('kuyruk verilince ilk âyetten başlar', () => {
    const s = setQueue(initialPlayback(), kuyruk);
    expect(s.index).toBe(0);
    expect(current(s)).toEqual({ surah: 1, ayah: 1 });
  });

  it('istenen âyetten başlatılabilir', () => {
    const s = setQueue(initialPlayback(), kuyruk, { surah: 1, ayah: 3 });
    expect(current(s)).toEqual({ surah: 1, ayah: 3 });
  });

  it('boş kuyrukta çökmez', () => {
    const s = setQueue(initialPlayback(), []);
    expect(current(s)).toBeNull();
    expect(advance(s).playing).toBe(false);
    expect(next(s).index).toBe(-1);
    expect(previous(s).index).toBe(-1);
  });

  it('tekrar kapalıyken kuyruk sonunda durur', () => {
    let s = { ...setQueue(initialPlayback(), kuyruk), playing: true, index: 4 };
    s = advance(s);
    expect(s.playing).toBe(false);
  });

  it('âyet tekrarında konum değişmez', () => {
    const s = { ...setQueue(initialPlayback(), kuyruk), repeat: 'ayah' as const, index: 2 };
    expect(advance(s).index).toBe(2);
  });

  it('sure tekrarında kuyruk sonunda başa döner', () => {
    const s = { ...setQueue(initialPlayback(), kuyruk), repeat: 'surah' as const, index: 4 };
    expect(advance(s).index).toBe(0);
  });

  it('aralık tekrarı sayı dolunca durur', () => {
    let s = setQueue(initialPlayback(), kuyruk);
    s = setRange(s, { from: { surah: 1, ayah: 2 }, to: { surah: 1, ayah: 4 }, repeatCount: 2 });
    s = { ...s, repeat: 'range', index: 3, playing: true };

    s = advance(s);                       // 1. tur bitti, başa dön
    expect(s.index).toBe(1);
    expect(s.rangeCycles).toBe(1);
    expect(s.playing).toBe(true);

    s = { ...s, index: 3 };
    s = advance(s);                       // 2. tur bitti, dur
    expect(s.rangeCycles).toBe(2);
    expect(s.playing).toBe(false);
  });

  it('hız sınırlar içinde tutulur ve yuvarlanır', () => {
    expect(setSpeed(initialPlayback(), 0.1).speed).toBe(MIN_SPEED);
    expect(setSpeed(initialPlayback(), 5).speed).toBe(MAX_SPEED);
    expect(setSpeed(initialPlayback(), 1.23).speed).toBe(1.25);
    expect(setSpeed(initialPlayback(), Number.NaN).speed).toBe(1);
  });

  it('uyku zamanlayıcısı süresi dolunca çalmayı durdurur', () => {
    const t0 = 1_000_000;
    let s = { ...setQueue(initialPlayback(), kuyruk), playing: true };
    s = setSleepTimer(s, 10, t0);
    expect(sleepExpired(s, t0 + 9 * 60000)).toBe(false);
    expect(sleepExpired(s, t0 + 10 * 60000)).toBe(true);

    const sonra = advance(s, t0 + 11 * 60000);
    expect(sonra.playing).toBe(false);
    expect(sonra.sleepAt).toBeNull();
  });

  it('uyku zamanlayıcısı kapatılabilir', () => {
    const s = setSleepTimer(setSleepTimer(initialPlayback(), 5), null);
    expect(s.sleepAt).toBeNull();
    expect(sleepExpired(s)).toBe(false);
  });

  it('ileri geri sınırları aşmaz', () => {
    const s = setQueue(initialPlayback(), kuyruk);
    expect(previous(s).index).toBe(0);
    expect(next({ ...s, index: 4 }).index).toBe(4);
  });

  it('çalma durumu ancak kuyruk varken değişir', () => {
    expect(toggle(initialPlayback()).playing).toBe(false);
    expect(toggle(setQueue(initialPlayback(), kuyruk)).playing).toBe(true);
  });
});

describe('indirme yöneticisi', () => {
  const items: DownloadItem[] = [
    { id: 'a-1', reciterId: 'a', surah: 1, bytes: 1_000_000, downloadedAt: 1 },
    { id: 'a-2', reciterId: 'a', surah: 2, bytes: 3_000_000, downloadedAt: 2 },
    { id: 'b-1', reciterId: 'b', surah: 1, bytes: 500_000, downloadedAt: 3 },
  ];

  it('toplam ve okuyucu kırılımı doğru', () => {
    const s = summarize(items);
    expect(s.itemCount).toBe(3);
    expect(s.totalBytes).toBe(4_500_000);
    expect(s.byReciter[0]).toEqual({ reciterId: 'a', itemCount: 2, bytes: 4_000_000 });
  });

  it('boş listede sıfır döner', () => {
    expect(summarize([])).toEqual({ itemCount: 0, totalBytes: 0, byReciter: [] });
  });

  it('silinecek parçaların açacağı yer hesaplanır', () => {
    expect(bytesFreedBy(items, ['a-2'])).toBe(3_000_000);
    expect(bytesFreedBy(items, ['yok'])).toBe(0);
    expect(bytesFreedBy(items, ['a-1', 'b-1'])).toBe(1_500_000);
  });

  it('boyut biçimi okunur', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(900)).toBe('900 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.00 GB');
    expect(formatBytes(-5)).toBe('0 B');
  });
});
