import { buildRecord, configureLogging, shouldLog, logger, redact, MASK } from '@/lib/log';
import type { LogRecord } from '@/lib/log';

describe('günlükleme', () => {
  afterEach(() => configureLogging({ minLevel: 'debug', sink: null }));

  it('e-posta, telefon, jeton ve JWT maskelenir', () => {
    const r = buildRecord('info', 'test', 'kullanici a@b.com telefon +90 532 111 22 33');
    expect(r.message).not.toContain('a@b.com');
    expect(r.message).not.toContain('532');
    const d = redact({ authorization: 'Bearer abc', note: 'gizli' }) as Record<string, unknown>;
    expect(d.authorization).toBe(MASK);
    expect(d.note).toBe(MASK);
    expect(redact('eyJhbGciOi.eyJzdWIi.sig')).toBe(MASK);
  });

  it('konum alanları hiçbir derinlikte sızmaz', () => {
    const d = redact({ user: { location: { latitude: 41.0, longitude: 28.9, city: 'İstanbul' } } });
    const s = JSON.stringify(d);
    expect(s).not.toContain('41');
    expect(s).not.toContain('28.9');
    expect(s).not.toContain('İstanbul');
  });

  it('döngüsel nesne çökertmez', () => {
    const a: Record<string, unknown> = { ad: 'x' };
    a.kendisi = a;
    expect(() => redact(a)).not.toThrow();
    expect(JSON.stringify(redact(a))).toContain('döngü');
  });

  it('Error nesnesi mesajı temizlenerek taşınır', () => {
    const r = redact(new Error('hata: a@b.com')) as { name: string; message: string };
    expect(r.name).toBe('Error');
    expect(r.message).not.toContain('a@b.com');
  });

  it('üretim seviyesinde debug ve info yazılmaz', () => {
    configureLogging({ minLevel: 'warn' });
    expect(shouldLog('debug')).toBe(false);
    expect(shouldLog('info')).toBe(false);
    expect(shouldLog('warn')).toBe(true);
    expect(shouldLog('error')).toBe(true);
  });

  it('sink takılıysa konsola değil ona gider ve veri temizlenmiştir', () => {
    const kayitlar: LogRecord[] = [];
    configureLogging({ minLevel: 'debug', sink: (r) => kayitlar.push(r) });
    logger('agri').error('istek basarisiz', { email: 'a@b.com', status: 500 });
    expect(kayitlar).toHaveLength(1);
    const d = kayitlar[0]?.data as Record<string, unknown>;
    expect(d.email).toBe(MASK);
    expect(d.status).toBe(500);
  });
});
