/**
 * Bağlantı durumu — şartname §82.
 *
 * "Bağlı" saymak için arayüzün ulaşılabilir olması da gerekir: Wi-Fi'ye bağlı
 * ama internete çıkamayan cihaz (otel portalı, kotası dolmuş hat) çevrimdışı
 * sayılır. Bu ayrım olmadan kullanıcı "neden eşitlenmiyor" diye bakakalır.
 */
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface OnlineState {
  online: boolean;
  /** İlk ölçüm gelene kadar true — açılışta yanlışlıkla "çevrimdışı" yazmamak için. */
  unknown: boolean;
}

export function useOnline(): OnlineState {
  const [state, setState] = useState<OnlineState>({ online: true, unknown: true });

  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => {
      const reachable = s.isInternetReachable;
      setState({
        online: Boolean(s.isConnected) && reachable !== false,
        unknown: false,
      });
    });
    return () => sub();
  }, []);

  return state;
}
