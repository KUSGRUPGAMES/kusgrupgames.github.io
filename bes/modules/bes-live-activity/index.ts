/**
 * BEŞ canlı etkinlik köprüsü — yalnız iOS 16.2+. Başka platformda ve yerel
 * modül yokken (Expo Go, web, test) her çağrı sessizce hiçbir şey yapmaz.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';

export interface VakitEtkinligi {
  city: string;
  title: string;
  name: string;
  /** Vakit anı, saniye (Unix). */
  target: number;
  hm: string;
  following: string;
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
