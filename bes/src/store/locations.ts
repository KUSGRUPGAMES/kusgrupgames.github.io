/**
 * Konum durumu — şartname §13.
 * Çoklu kayıtlı konum, aralarında geçiş, birincil konum.
 * Kalıcılık dışarıdan verilen `persist` geri çağrısıyla yapılır; bu dosya
 * depolama teknolojisine bağlanmaz.
 */
import { create } from 'zustand';
import type { Place, SavedLocation } from '@/features/location/types';

interface LocationState {
  locations: SavedLocation[];
  activeId: string | null;
  hydrated: boolean;

  hydrate: (locations: SavedLocation[], activeId: string | null) => void;
  add: (place: Place, options?: { label?: string; origin?: 'gps' | 'manual'; makePrimary?: boolean }) => SavedLocation;
  remove: (id: string) => void;
  setActive: (id: string) => void;
  setPrimary: (id: string) => void;
  active: () => SavedLocation | null;
}

function normalizePrimary(list: SavedLocation[]): SavedLocation[] {
  if (list.length === 0) return list;
  const birincil = list.find((l) => l.isPrimary);
  if (birincil) return list;
  // Birincil kalmadıysa ilki birincil olur; "hiç birincil yok" durumu olamaz.
  return list.map((l, i) => ({ ...l, isPrimary: i === 0 }));
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: [],
  activeId: null,
  hydrated: false,

  hydrate: (locations, activeId) => set({
    locations: normalizePrimary(locations),
    activeId: activeId ?? locations.find((l) => l.isPrimary)?.id ?? locations[0]?.id ?? null,
    hydrated: true,
  }),

  add: (place, options = {}) => {
    const mevcut = get().locations;
    const kayit: SavedLocation = {
      ...place,
      label: options.label ?? place.name,
      origin: options.origin ?? 'manual',
      isPrimary: options.makePrimary ?? mevcut.length === 0,
      savedAt: Date.now(),
    };
    // Aynı yer iki kez eklenmez; yenisi eskisinin üzerine yazar.
    const kalanlar = mevcut.filter((l) => l.id !== place.id);
    const liste = normalizePrimary(
      kayit.isPrimary
        ? [kayit, ...kalanlar.map((l) => ({ ...l, isPrimary: false }))]
        : [...kalanlar, kayit],
    );
    set({ locations: liste, activeId: kayit.id });
    return kayit;
  },

  remove: (id) => {
    const liste = normalizePrimary(get().locations.filter((l) => l.id !== id));
    const aktif = get().activeId === id
      ? (liste.find((l) => l.isPrimary)?.id ?? liste[0]?.id ?? null)
      : get().activeId;
    set({ locations: liste, activeId: aktif });
  },

  setActive: (id) => {
    if (get().locations.some((l) => l.id === id)) set({ activeId: id });
  },

  setPrimary: (id) => set({
    locations: get().locations.map((l) => ({ ...l, isPrimary: l.id === id })),
  }),

  active: () => {
    const { locations, activeId } = get();
    return locations.find((l) => l.id === activeId)
      ?? locations.find((l) => l.isPrimary)
      ?? locations[0]
      ?? null;
  },
}));
