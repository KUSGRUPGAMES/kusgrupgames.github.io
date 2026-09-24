/**
 * Pusula — şartname §36, §81.
 *
 * Pil kuralı: manyetometre **yalnız kıble ekranı öndeyken** açılır. Bu kanca
 * sökülünce dinleyici kapanır; ekran arka plana geçince de kapanır. Pusulayı
 * açık unutmak, bu kategoride en sık görülen pil şikâyetinin sebebidir.
 */
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { accuracyFromLevel, circularSpread, type CompassAccuracy } from './calc';

export interface CompassState {
  /** Gerçek kuzeye göre yön (0–360). Okuma yoksa null. */
  heading: number | null;
  accuracy: CompassAccuracy;
  /** Manyetik girişim şüphesi: okuma çok oynak. */
  interference: boolean;
  available: boolean;
  /**
   * Konum izni reddedildi. iOS pusulayı (expo-location `watchDeviceHeading`)
   * konum izni olmadan **hiç başlatmıyor**; şehir elle seçilince izin hiç
   * istenmediği için ekran eskiden "bu cihazda pusula yok" diyordu.
   */
  permissionDenied: boolean;
}

const BASLANGIC: CompassState = {
  heading: null, accuracy: 'unreliable', interference: false, available: true, permissionDenied: false,
};

export function useCompass(enabled: boolean): CompassState {
  const [state, setState] = useState<CompassState>(BASLANGIC);
  const sonOkumalar = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) { setState(BASLANGIC); return; }

    let abone: Location.LocationSubscription | null = null;
    let canli = true;

    const ac = async () => {
      // Zaten açıkken tekrar açmak eski aboneliği kaybettirir: pusula arka
      // planda çalışmaya devam eder. AppState 'active' üst üste gelebilir.
      if (abone) return;
      try {
        const izin = await Location.requestForegroundPermissionsAsync();
        if (!canli) return;
        if (izin.status !== 'granted') {
          setState({ ...BASLANGIC, permissionDenied: true });
          return;
        }
        const yeni = await Location.watchHeadingAsync((h) => {
          if (!canli) return;
          // `trueHeading` yalnız konum izni varken gelir; yoksa manyetik kuzey.
          const yon = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;

          // Girişim sezgisi: son okumaların yayılımı çok genişse pusula
          // güvenilmezdir. Eşik, elde tutulan telefonun doğal salınımının
          // üstünde seçildi.
          const gecmis = sonOkumalar.current;
          gecmis.push(yon);
          if (gecmis.length > 8) gecmis.shift();
          const yayilim = gecmis.length >= 4 ? circularSpread(gecmis) : 0;

          setState({
            heading: yon,
            accuracy: accuracyFromLevel(h.accuracy),
            interference: yayilim > 45,
            available: true,
            permissionDenied: false,
          });
        }, () => {
          // Akış sırasında gelen hata sessizce yutulursa iğne donar kalırdı.
          if (canli) setState({ ...BASLANGIC, available: false });
        });
        // Abonelik kurulurken ekran kapandıysa hemen bırakılır; yoksa
        // "pusula yalnız bu ekran açıkken çalışır" sözü tutulmaz.
        if (!canli) { birak(yeni); return; }
        abone = yeni;
      } catch {
        // Manyetometresi olmayan cihaz ya da izin yok.
        if (canli) setState({ ...BASLANGIC, available: false });
      }
    };

    // Bazı platformlarda `remove()` içeriden patlar (web'de
    // `LocationEventEmitter.removeSubscription is not a function`). Temizlik
    // sırasında atılan hata React'in unmount'unu kırar, o yüzden yutulur.
    const birak = (s: Location.LocationSubscription | null) => {
      try { s?.remove(); } catch { /* aboneliği bırakamadık; sürdürülecek bir şey yok */ }
    };

    const kapat = () => { birak(abone); abone = null; };

    void ac();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void ac(); else kapat();
    });

    return () => { canli = false; kapat(); try { sub.remove(); } catch { /* yok sayılır */ } };
  }, [enabled]);

  return state;
}
