/**
 * Cihaz konumu — şartname §13, §81.
 *
 * Pil kuralı: konum **sürekli izlenmez**. Tek seferlik okuma yapılır, sonuç
 * en yakın yerleşik şehre eşlenir ve kaydedilir. Kullanıcı şehir değiştirene
 * kadar GPS'e bir daha dokunulmaz.
 */
import * as Location from 'expo-location';
import { logger } from '@/lib/log';
import { nearestPlace } from './search';
import type { Coordinates, Place } from './types';

const log = logger('location');

export type LocationOutcome =
  | { kind: 'ok'; place: Place; accuracyKm: number }
  | { kind: 'denied' }
  | { kind: 'unavailable' }
  /** Konum alındı ama listemizde yeterince yakın şehir yok. */
  | { kind: 'noMatch'; latitude: number; longitude: number };

/**
 * GPS hesabında il merkezi yerine cihazın gerçek koordinatını kullan.
 * En yakın kayıt yalnız saat dilimi/ülke için referanstır; adını GPS
 * konumunun adıymış gibi göstermek Gebze'yi Yalova yapıyordu.
 */
export function gpsPlace(point: Coordinates, reference: Place, address?: {
  subregion?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  isoCountryCode?: string | null;
} | null): Place {
  const name = address?.subregion?.trim() || address?.city?.trim()
    || address?.region?.trim() || 'GPS';
  return {
    id: 'gps-current',
    name,
    country: address?.country?.trim() || reference.country,
    countryCode: address?.isoCountryCode || reference.countryCode,
    timezone: reference.timezone,
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

export async function requestDeviceLocation(): Promise<LocationOutcome> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { kind: 'denied' };

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const { latitude, longitude } = position.coords;
    const reference = nearestPlace({ latitude, longitude });
    if (!reference) return { kind: 'noMatch', latitude, longitude };

    // Ters adres çözümlemesi bağlantı/servis olmadığında başarısız olabilir;
    // koordinatı koruyup nötr bir GPS adıyla devam et.
    const address = await Location.reverseGeocodeAsync({ latitude, longitude })
      .then((items) => items[0] ?? null)
      .catch(() => null);

    return {
      kind: 'ok',
      place: gpsPlace({ latitude, longitude }, reference, address),
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
