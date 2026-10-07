/**
 * Cihaz konumu — şartname §13, §81.
 *
 * Pil kuralı: konum **arka planda sürekli izlenmez**. Okuma, sonuç en yakın
 * yerleşik şehre eşlenerek yapılır. Uygulama öne geldikçe (en sık 20 dakikada
 * bir) izin varsa sessizce yeniden bakılır; başka şehre geçildiyse konum
 * güncellenir (`autoUpdate.ts`, `permissions/HomeNotices.tsx`).
 */
import * as Location from 'expo-location';
import { logger } from '@/lib/log';
import { matchDistrict, nearestPlace } from './search';
import type { Place } from './types';

const log = logger('location');

export type LocationOutcome =
  | { kind: 'ok'; place: Place; accuracyKm: number }
  | { kind: 'denied' }
  | { kind: 'unavailable' }
  /** Konum alındı ama listemizde yeterince yakın şehir yok. */
  | { kind: 'noMatch'; latitude: number; longitude: number };

export async function requestDeviceLocation(): Promise<LocationOutcome> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { kind: 'denied' };

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = position.coords;
    const place = await yeriBul({ latitude, longitude });
    if (!place) return { kind: 'noMatch', latitude, longitude };

    return {
      kind: 'ok',
      place,
      accuracyKm: (position.coords.accuracy ?? 0) / 1000,
    };
  } catch (e) {
    // Konum kapalı, cihaz desteklemiyor ya da zaman aşımı — hepsi aynı
    // kullanıcı deneyimine çıkar: elle şehir seçimi önerilir.
    log.warn('cihaz konumu alınamadı', { error: e });
    return { kind: 'unavailable' };
  }
}

/** İzin durumunu istemeden sorgular (ayar ekranında göstermek için). */
export async function locationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/**
 * İzin **istemeden** konumu okur (konumun kendiliğinden güncellenmesi için).
 * İzin yoksa, konum kapalıysa ya da okunamazsa null — hiçbir pencere açılmaz.
 * Önce son bilinen konuma bakılır (anında, pil harcamaz); yoksa düşük
 * doğrulukla tek okuma yapılır: şehir bulmak için kilometre düzeyi yeter.
 */
export async function readDeviceLocationSilently(): Promise<Place | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const son = await Location.getLastKnownPositionAsync({ maxAge: 15 * 60 * 1000, requiredAccuracy: 5000 });
    const konum = son ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    return await yeriBul({ latitude: konum.coords.latitude, longitude: konum.coords.longitude });
  } catch (e) {
    log.info('sessiz konum okunamadı', { error: e });
    return null;
  }
}

/** İzin penceresi yeniden açılabilir mi, yoksa yalnız Ayarlar'dan mı verilebilir. */
export async function locationCanAskAgain(): Promise<boolean> {
  try {
    return (await Location.getForegroundPermissionsAsync()).canAskAgain;
  } catch {
    return false;
  }
}

/**
 * GPS → yer. Türkiye'deyse cihazın ters coğrafi kodlamasıyla il/ilçe adı
 * alınır (Apple/Google haritaları; çevrimdışıysa yalnız en yakın ilçe).
 * Gebze → Sabiha Gökçen gibi il değiştiren ama 25 km'yi aşmayan hareketler
 * eskiden "aynı yer" sayılıp Gebze'de kalıyordu (5 Ekim).
 */
async function yeriBul(n: { latitude: number; longitude: number }): Promise<Place | null> {
  const enYakin = nearestPlace(n);
  if (enYakin && enYakin.countryCode !== 'TR') return enYakin;
  let adres: { il?: string | null; ilce?: string | null } = {};
  try {
    const [a] = await Location.reverseGeocodeAsync(n);
    if (a && (a.isoCountryCode ?? 'TR') === 'TR') adres = { il: a.region, ilce: a.subregion ?? a.district ?? a.city };
  } catch (e) {
    log.info('ters coğrafi kodlama yok', { error: e });
  }
  return matchDistrict(n, adres) ?? enYakin;
}
