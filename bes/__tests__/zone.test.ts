import { zoneOffset, zonedNow, wallClockToInstant, offsetForDay, safeOffset } from '@/lib/time/zone';

describe('saat dilimi', () => {
  const winter = new Date(Date.UTC(2026, 0, 15, 12));
  const summer = new Date(Date.UTC(2026, 6, 15, 12));

  it('yaz saati uygulayan dilimlerde fark mevsime göre değişir', () => {
    expect(zoneOffset('Europe/Berlin', winter)).toBe(1);
    expect(zoneOffset('Europe/Berlin', summer)).toBe(2);
    expect(zoneOffset('Europe/London', winter)).toBe(0);
    expect(zoneOffset('Europe/London', summer)).toBe(1);
    expect(zoneOffset('America/New_York', winter)).toBe(-5);
    expect(zoneOffset('America/New_York', summer)).toBe(-4);
  });

  it('yaz saati uygulamayan dilimlerde sabit kalır', () => {
    expect(zoneOffset('Europe/Istanbul', winter)).toBe(3);
    expect(zoneOffset('Europe/Istanbul', summer)).toBe(3);
  });

  it('yarım saatlik dilimleri doğru verir', () => {
    expect(zoneOffset('Asia/Kolkata', winter)).toBe(5.5);
  });

  it('geçersiz dilim adı uygulamayı düşürmez', () => {
    expect(() => safeOffset('Yok/Boyle/Bir/Yer', winter)).not.toThrow();
  });

  it('duvar saati -> mutlak an çevirisi', () => {
    // Berlin yazın UTC+2: yerel 13:00 = 11:00 UTC
    expect(wallClockToInstant(2026, 6, 15, 13, 2).getTime()).toBe(Date.UTC(2026, 6, 15, 11));
  });

  it('konumun "şimdi"si cihaz diliminden bağımsızdır', () => {
    const instant = new Date(Date.UTC(2026, 6, 15, 10, 0, 0));
    const ist = zonedNow('Europe/Istanbul', instant);
    expect(ist.hours).toBeCloseTo(13, 6);
    expect(ist.day).toBe(15);
    const ny = zonedNow('America/New_York', instant);
    expect(ny.hours).toBeCloseTo(6, 6);
  });

  it('gün gün ofset, yaz saati geçişini yakalar', () => {
    expect(offsetForDay('Europe/Berlin', 2026, 0, 15, 0)).toBe(1);
    expect(offsetForDay('Europe/Berlin', 2026, 6, 15, 0)).toBe(2);
    expect(offsetForDay(null, 2026, 6, 15, 3)).toBe(3);
  });
});
