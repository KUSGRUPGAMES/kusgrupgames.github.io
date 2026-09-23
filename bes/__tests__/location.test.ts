import { normalizeSearch, matchScore } from '@/features/location/normalize';
import { searchPlaces, nearestPlace, distanceKm } from '@/features/location/search';
import { TURKEY_PROVINCES, TURKEY_DISTRICTS, WORLD_CITIES, ALL_PLACES, findPlace } from '@/features/location/places';
import { isValidCoordinates } from '@/features/location/types';

describe('Türkçe arama normalizasyonu', () => {
  it('büyük İ ve noktasız ı doğru eşlenir', () => {
    expect(normalizeSearch('İSTANBUL')).toBe('istanbul');
    expect(normalizeSearch('Istanbul')).toBe('istanbul');
    expect(normalizeSearch('ısparta')).toBe('isparta');
    expect(normalizeSearch('İzmir')).toBe('izmir');
  });

  it('şapkalı ve özel harfler sadeleşir', () => {
    expect(normalizeSearch('Şanlıurfa')).toBe('sanliurfa');
    expect(normalizeSearch('Çanakkale')).toBe('canakkale');
    expect(normalizeSearch('Gümüşhane')).toBe('gumushane');
    expect(normalizeSearch('Hakkâri')).toBe('hakkari');
  });

  it('Arapça harekeler atılır', () => {
    expect(normalizeSearch('بَسْم')).toBe('بسم');
  });

  it('eşleşme puanı: tam > baş > içerik', () => {
    expect(matchScore('Ankara', 'ankara')).toBe(3);
    expect(matchScore('Ankara', 'ank')).toBe(2);
    expect(matchScore('Kahramanmaraş', 'maras')).toBe(1);
    expect(matchScore('Ankara', 'xyz')).toBe(0);
  });
});

describe('yer listesi', () => {
  it('81 il eksiksizdir ve kimlikleri tekildir', () => {
    expect(TURKEY_PROVINCES).toHaveLength(81);
    const ids = new Set(TURKEY_PROVINCES.map((p) => p.id));
    expect(ids.size).toBe(81);
  });

  it('bütün yerlerin koordinatı ve saat dilimi geçerlidir', () => {
    for (const p of ALL_PLACES) {
      expect(isValidCoordinates(p)).toBe(true);
      expect(p.timezone).toMatch(/^[A-Za-z]+\/[A-Za-z_]+$/);
      // Saat dilimi adı gerçekten tanınıyor mu — yanlış yazım burada yakalanır.
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: p.timezone })).not.toThrow();
    }
  });

  it('Türkiye illerinin hepsi Europe/Istanbul', () => {
    for (const p of TURKEY_PROVINCES) expect(p.timezone).toBe('Europe/Istanbul');
  });

  it('Türkiye illerinin koordinatları ülke sınırları içindedir', () => {
    for (const p of TURKEY_PROVINCES) {
      expect(p.latitude).toBeGreaterThan(35.5);
      expect(p.latitude).toBeLessThan(42.5);
      expect(p.longitude).toBeGreaterThan(25.5);
      expect(p.longitude).toBeLessThan(45);
    }
  });

  it('Mekke koordinatı Kâbe ile tutarlıdır', () => {
    const mekke = findPlace('world-mekke');
    expect(mekke).toBeDefined();
    expect(distanceKm(mekke!, { latitude: 21.4225, longitude: 39.8262 })).toBeLessThan(1);
  });

  it('dünya şehirleri kimlikleri tekildir', () => {
    expect(new Set(WORLD_CITIES.map((p) => p.id)).size).toBe(WORLD_CITIES.length);
  });

  it('büyük ilçe listesi kimlikleri tekildir ve il listesiyle çakışmaz', () => {
    const ilceKimlikleri = new Set(TURKEY_DISTRICTS.map((p) => p.id));
    expect(ilceKimlikleri.size).toBe(TURKEY_DISTRICTS.length);
    const ilKimlikleri = new Set(TURKEY_PROVINCES.map((p) => p.id));
    for (const id of ilceKimlikleri) expect(ilKimlikleri.has(id)).toBe(false);
  });
});

describe('arama ve en yakın şehir', () => {
  it('şapkasız yazım şehri bulur', () => {
    expect(searchPlaces('sanliurfa')[0]?.name).toBe('Şanlıurfa');
    expect(searchPlaces('ISTANBUL')[0]?.name).toBe('İstanbul');
    expect(searchPlaces('izmır')[0]?.name).toBe('İzmir');
  });

  it('şehir adıyla eşleşenler ülke adıyla eşleşenlerin üstünde', () => {
    // "İs" yazıldığında İstanbul ile Isparta önde gelmeli; Kahire (Mısır)
    // ve Karaçi (Pakistan) yalnız ülke adında "is" geçtiği için listede.
    const r = searchPlaces('İs', { limit: 6 }).map((p) => p.name);
    expect(r.slice(0, 2).sort()).toEqual(['Isparta', 'İstanbul']);
    for (const ulkeEslesmesi of ['Kahire', 'Karaçi', 'Kudüs']) {
      const sira = r.indexOf(ulkeEslesmesi);
      expect({ ad: ulkeEslesmesi, ilkAltida: sira }).toEqual({ ad: ulkeEslesmesi, ilkAltida: -1 });
    }
  });

  it('ülke adıyla da aranabilir', () => {
    const r = searchPlaces('Almanya');
    expect(r.length).toBeGreaterThan(3);
    expect(r.every((p) => p.countryCode === 'DE')).toBe(true);
  });

  it('boş sorgu liste döndürür, patlamaz', () => {
    expect(searchPlaces('').length).toBeGreaterThan(0);
  });

  it('GPS noktasından en yakın şehir çevrimdışı bulunur', () => {
    expect(nearestPlace({ latitude: 41.02, longitude: 28.95 })?.name).toBe('İstanbul');
    expect(nearestPlace({ latitude: 39.93, longitude: 32.86 })?.name).toBe('Ankara');
    expect(nearestPlace({ latitude: 21.43, longitude: 39.83 })?.name).toBe('Mekke');
  });

  it('listeye çok uzak bir noktada null döner — yanlış şehir uydurulmaz', () => {
    // Güney Pasifik, en yakın kayıtlı şehre binlerce km.
    expect(nearestPlace({ latitude: -40, longitude: -120 })).toBeNull();
  });

  it('Gebze GPS noktası Kocaeli değil Gebze döner', () => {
    // Gerçek hata: yalnız 81 il merkezi varken Gebze (Kocaeli'nin en büyük
    // ilçesi, il merkezinden bile kalabalık) kuş uçuşu körfezin karşı
    // kıyısındaki Yalova'ya daha yakın çıkıyor, kullanıcı "konumumu kullan"
    // dediğinde yanlışlıkla Yalova'ya düşüyordu.
    const gebze = nearestPlace({ latitude: 40.8025, longitude: 29.4306 });
    expect(gebze?.name).toBe('Gebze');
    expect(gebze?.name).not.toBe('Yalova');
  });
});
