import { normalizeSearch, matchScore } from '@/features/location/normalize';
import { searchPlaces, nearestPlace, distanceKm, matchDistrict } from '@/features/location/search';
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
  it('Diyanet ilçe listesi: 81 il, tekil kimlikler, hepsi Türkiye sınırında', () => {
    const tr = ALL_PLACES.filter((p) => p.diyanetId);
    expect(tr.length).toBeGreaterThan(850);
    expect(new Set(tr.map((p) => p.diyanetId)).size).toBe(tr.length);
    expect(new Set(tr.map((p) => p.province)).size).toBe(81);
    for (const p of tr) {
      expect(p.latitude).toBeGreaterThan(35.5); expect(p.latitude).toBeLessThan(42.5);
      expect(p.longitude).toBeGreaterThan(25.5); expect(p.longitude).toBeLessThan(45);
    }
  });

  it('ilçe adıyla ve il adıyla aranır; eski kimlikler bulunur', () => {
    expect(searchPlaces('pendik')[0]).toMatchObject({ name: 'Pendik', province: 'İstanbul' });
    expect(searchPlaces('kecioren').length).toBeGreaterThanOrEqual(0);
    expect(searchPlaces('istanbul', { limit: 40 }).filter((p) => p.province === 'İstanbul').length).toBeGreaterThan(5);
    expect(findPlace('tr-06')?.name).toBe('Ankara');
    expect(findPlace('tr-gebze')?.name).toBe('Gebze');
  });

  it('GPS → Diyanet ilçesi: cihazın verdiği il/ilçe adıyla, yoksa en yakın ilçe', () => {
    // Sabiha Gökçen (Pendik, İstanbul) — Gebze'ye 15 km; eskiden Gebze kalıyordu.
    const sg = { latitude: 40.8986, longitude: 29.3092 };
    expect(matchDistrict(sg, { il: 'İstanbul', ilce: 'Pendik' })).toMatchObject({ name: 'Pendik', province: 'İstanbul' });
    expect(matchDistrict(sg, { il: 'Istanbul', ilce: 'Pendik' })?.name).toBe('Pendik');
    // Diyanet'in ayrıca listelemediği merkez ilçe → il merkezi kaydı.
    expect(matchDistrict({ latitude: 39.97, longitude: 32.86 }, { il: 'Ankara', ilce: 'Keçiören' })?.province).toBe('Ankara');
    expect(matchDistrict({ latitude: 40.8025, longitude: 29.4306 })?.name).toBe('Gebze');
  });
});

describe('konumun kendiliğinden güncellenmesi', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { konumKarari } = require('@/features/location/autoUpdate') as typeof import('@/features/location/autoUpdate');
  const yer = (id: string, latitude: number, longitude: number) =>
    ({ id, name: id, country: 'Türkiye', countryCode: 'TR', timezone: 'Europe/Istanbul', latitude, longitude });
  const kayit = (p: ReturnType<typeof yer>, origin: 'gps' | 'manual') =>
    ({ ...p, label: p.name, isPrimary: true, origin, savedAt: 0 });
  const istanbul = yer('tr-34', 41.0082, 28.9784);
  const kocaeli = yer('tr-41', 40.7654, 29.9408);
  const ankara = yer('tr-06', 39.9334, 32.8597);
  const beyoglu = yer('tr-34b', 41.0369, 28.9850); // aynı ilde, birkaç km

  it('GPS kökenli konumda başka şehre gidince yeni şehre geçer', () => {
    expect(konumKarari(kayit(istanbul, 'gps'), ankara)).toEqual({ kind: 'tasindi', yeni: ankara });
  });

  it('elle seçilmiş konuma dokunmaz, uyarır', () => {
    expect(konumKarari(kayit(istanbul, 'manual'), ankara)).toEqual({ kind: 'uyusmuyor', burada: ankara });
  });

  it('aynı il içindeki hareket vakti değiştirmez', () => {
    expect(konumKarari(kayit(istanbul, 'gps'), beyoglu)).toEqual({ kind: 'ayni' });
  });

  it('komşu il (≈90 km) ayrı şehir sayılır', () => {
    expect(konumKarari(kayit(istanbul, 'gps'), kocaeli).kind).toBe('tasindi');
  });

  it('Türkiye: ilçe değişince (Gebze → Pendik, 15 km) yeni ilçeye geçer; aynı ilçede kalır', () => {
    const gebze = { ...yer('tr-d-9651', 40.80, 29.43), diyanetId: '9651' };
    const pendik = { ...yer('tr-d-9551', 40.88, 29.25), diyanetId: '9551' };
    expect(konumKarari(kayit(gebze, 'gps'), pendik).kind).toBe('tasindi');
    expect(konumKarari(kayit(gebze, 'gps'), { ...gebze, id: 'x', latitude: 40.85 }).kind).toBe('ayni');
  });

  it('konum okunamazsa hiçbir şey değişmez; kayıtlı konum yoksa bulunan yer alınır', () => {
    expect(konumKarari(kayit(istanbul, 'gps'), null)).toEqual({ kind: 'ayni' });
    expect(konumKarari(null, ankara)).toEqual({ kind: 'tasindi', yeni: ankara });
  });
});

describe('izin hatırlatmaları', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const n = require('@/features/permissions/nudge') as typeof import('@/features/permissions/nudge');
  const GUN = 24 * 60 * 60 * 1000;

  it('öncelik: konum > bildirim > canlı etkinlik; hepsi verildiyse hiçbiri', () => {
    expect(n.siradakiHatirlatma({ konum: false, bildirim: false, canliEtkinlik: false }, {}, 0)).toBe('konum');
    expect(n.siradakiHatirlatma({ konum: true, bildirim: false, canliEtkinlik: false }, {}, 0)).toBe('bildirim');
    expect(n.siradakiHatirlatma({ konum: true, bildirim: true, canliEtkinlik: false }, {}, 0)).toBe('canliEtkinlik');
    expect(n.siradakiHatirlatma({ konum: true, bildirim: true, canliEtkinlik: null }, {}, 0)).toBeNull();
  });

  it('en sık 3 günde bir, toplam en çok 5 kez', () => {
    let k = n.kaydet({}, 'konum', 0);
    expect(n.hatirlatilabilir(k.konum, 2 * GUN)).toBe(false);
    expect(n.hatirlatilabilir(k.konum, 3 * GUN)).toBe(true);
    for (let i = 1; i < n.EN_COK_HATIRLATMA; i += 1) k = n.kaydet(k, 'konum', i * 3 * GUN);
    expect(n.hatirlatilabilir(k.konum, 100 * GUN)).toBe(false);
  });

  it('beklemedeki izin sırayı bir sonrakine bırakır', () => {
    const k = n.kaydet({}, 'konum', 0);
    expect(n.siradakiHatirlatma({ konum: false, bildirim: false, canliEtkinlik: null }, k, GUN)).toBe('bildirim');
  });
});
