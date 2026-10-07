/**
 * Ezan çalma durumu — D29. Tek oynatıcı uygulama genelinde (`EzanOkuyucu`);
 * başlatan yer (vakit bildirimi, ayarlardaki "Ezanı dinle") yalnız istek
 * bırakır.
 */
import { create } from 'zustand';

interface EzanState {
  /** Çalınıyor mu. */
  caliyor: boolean;
  /** Hangi vakit için (başlıkta gösterilir); önizlemede null. */
  vakit: string | null;
  /** Artan sayaç: her yeni istek oynatıcıya "baştan başla" der. */
  istek: number;
  baslat: (vakit: string | null) => void;
  durdur: () => void;
  /** Oynatıcı bittiğinde kendisi çağırır. */
  bitti: () => void;
}

export const useEzanStore = create<EzanState>((set, get) => ({
  caliyor: false,
  vakit: null,
  istek: 0,
  baslat: (vakit) => set({ caliyor: true, vakit, istek: get().istek + 1 }),
  durdur: () => set({ caliyor: false }),
  bitti: () => set({ caliyor: false }),
}));
