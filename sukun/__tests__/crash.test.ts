import {
  configureCrashReporter, recordCrash, getCrashRecords, clearCrashRecords,
  formatForSupport, MAX_RECORDS,
} from '@/lib/crash/reporter';
import { MASK } from '@/lib/log/redact';

describe('çökme raporlama', () => {
  beforeEach(() => {
    configureCrashReporter({ initial: [], persist: undefined });
    clearCrashRecords();
  });

  it('hata kaydedilir ve okunur', () => {
    recordCrash(new Error('bir şey patladı'), { version: '0.1.0' });
    const k = getCrashRecords();
    expect(k).toHaveLength(1);
    expect(k[0]!.message).toContain('patladı');
    expect(k[0]!.context.version).toBe('0.1.0');
  });

  it('kişisel veri rapora girmez', () => {
    recordCrash(new Error('kullanıcı a@b.com için başarısız'), {
      city: 'İstanbul',
      latitude: '41.0082',
      version: '0.1.0',
    });
    const s = JSON.stringify(getCrashRecords());
    expect(s).not.toContain('a@b.com');
    expect(s).not.toContain('41.0082');
    expect(s).not.toContain('İstanbul');
    expect(s).toContain(MASK);
  });

  it('en yeni kayıt başta durur', () => {
    recordCrash(new Error('birinci'));
    recordCrash(new Error('ikinci'));
    expect(getCrashRecords()[0]!.message).toBe('ikinci');
  });

  it('kayıt sayısı sınırlıdır', () => {
    for (let i = 0; i < MAX_RECORDS + 10; i++) recordCrash(new Error(`hata ${i}`));
    expect(getCrashRecords()).toHaveLength(MAX_RECORDS);
    expect(getCrashRecords()[0]!.message).toContain(String(MAX_RECORDS + 9));
  });

  it('kalıcılık geri çağrısı her kayıtta çalışır', () => {
    const yazilan: unknown[] = [];
    configureCrashReporter({ initial: [], persist: (r) => yazilan.push(r.length) });
    recordCrash(new Error('a'));
    recordCrash(new Error('b'));
    expect(yazilan).toEqual([1, 2]);
  });

  it('temizleme kalıcılığa da yansır', () => {
    let son = -1;
    configureCrashReporter({ initial: [], persist: (r) => { son = r.length; } });
    recordCrash(new Error('a'));
    clearCrashRecords();
    expect(getCrashRecords()).toHaveLength(0);
    expect(son).toBe(0);
  });

  it('destek metni okunabilir ve boşken boştur', () => {
    expect(formatForSupport([])).toBe('');
    recordCrash(new Error('çöktü'), { platform: 'ios' });
    const metin = formatForSupport();
    expect(metin).toContain('çöktü');
    expect(metin).toContain('platform=ios');
  });

  it('bileşen yığını kırpılır', () => {
    recordCrash(new Error('a'), {}, 'x'.repeat(5000));
    expect(getCrashRecords()[0]!.componentStack!.length).toBeLessThanOrEqual(2000);
  });
});
