/**
 * BEŞ canlı etkinlik köprüsü — yalnız iOS 16.2+. Başka platformda ve yerel
 * modül yokken (Expo Go, web, test) her çağrı sessizce hiçbir şey yapmaz.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

/** Önümüzdeki bir vakit: ad, an (saniye, Unix), "12:52". */
export interface VakitSlotu { n: string; t: number; hm: string }

export interface VakitEtkinligi {
  city: string;
  title: string;
  name: string;
  /** Vakit anı, saniye (Unix). */
  target: number;
  hm: string;
  following: string;
  /**
   * Sıradaki dahil önümüzdeki vakitler. Etkinlik uygulama uyurken bunlardan
   * sıradakine kendisi geçer (yerel modül ve widget görünümü).
   */
  upcoming: VakitSlotu[];
}

interface Yerel {
  isSupported(): boolean;
  startOrUpdate(p: VakitEtkinligi): Promise<boolean>;
  end(): Promise<void>;
}

const yerel = requireOptionalNativeModule<Yerel>('BesLiveActivity');

export const liveActivity = {
  supported: (): boolean => {
    try { return yerel?.isSupported() ?? false; } catch { return false; }
  },
  startOrUpdate: async (p: VakitEtkinligi): Promise<boolean> => {
    try { return (await yerel?.startOrUpdate(p)) ?? false; } catch { return false; }
  },
  end: async (): Promise<void> => {
    try { await yerel?.end(); } catch { /* yok */ }
  },
};
