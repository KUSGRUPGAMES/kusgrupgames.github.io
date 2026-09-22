/**
 * Ayar durumu — şartname §60.
 * Doğrulama `lib/storage/settings.ts` içindedir; burada yalnız durum ve
 * kalıcılık köprüsü vardır.
 */
import { create } from 'zustand';
import { defaultSettings, parseSettings, type Settings } from '@/lib/storage';

interface SettingsState {
  settings: Settings;
  hydrated: boolean;
  hydrate: (raw: unknown) => void;
  update: (patch: Partial<Settings>) => Settings;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  hydrated: false,

  hydrate: (raw) => set({ settings: parseSettings(raw), hydrated: true }),

  update: (patch) => {
    // Kısmi güncelleme de doğrulamadan geçer: geçersiz değer duruma giremez.
    const aday = { ...get().settings, ...patch };
    const dogrulanmis = parseSettings(aday);
    set({ settings: dogrulanmis });
    return dogrulanmis;
  },

  reset: () => set({ settings: defaultSettings }),
}));
