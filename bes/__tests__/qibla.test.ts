import { qiblaBearing, distanceToKaaba, headingDelta, isAligned, classifyAccuracy } from '@/features/qibla/calc';

describe('kıble', () => {
  it('bilinen şehirlerde açı doğru', () => {
    expect(qiblaBearing(41.0082, 28.9784)).toBeCloseTo(151.6, 0);   // İstanbul
    expect(qiblaBearing(39.9334, 32.8597)).toBeCloseTo(160.2, 0);   // Ankara
    expect(qiblaBearing(51.5074, -0.1278)).toBeCloseTo(119.0, 0);   // Londra
    expect(qiblaBearing(-6.2088, 106.8456)).toBeCloseTo(295.2, 0);  // Cakarta
  });

  it('Kâbe uzaklığı bilinen değere oturur', () => {
    expect(distanceToKaaba(41.0082, 28.9784)).toBeCloseTo(2405, -1);
  });

  it('açı her zaman 0-360 aralığında', () => {
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = -180; lon <= 180; lon += 30) {
        const b = qiblaBearing(lat, lon);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(360);
      }
    }
  });

  it('hizalanma farkı -180..180 aralığında ve simetrik', () => {
    expect(headingDelta(10, 350)).toBeCloseTo(20, 6);
    expect(headingDelta(350, 10)).toBeCloseTo(-20, 6);
    expect(isAligned(151.6, 151.6)).toBe(true);
    expect(isAligned(151.6, 120)).toBe(false);
  });

  it('pusula doğruluğu sınıflandırılır', () => {
    expect(classifyAccuracy(3)).toBe('high');
    expect(classifyAccuracy(12)).toBe('medium');
    expect(classifyAccuracy(25)).toBe('low');
    expect(classifyAccuracy(null)).toBe('unreliable');
  });
});
