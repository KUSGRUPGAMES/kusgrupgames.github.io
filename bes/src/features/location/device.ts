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
    const place = nearestPlace({ latitude, longitude });
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
