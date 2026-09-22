/**
 * Birleşik favoriler — şartname §31, §63.
 * Tek bir liste: âyet, hadis, dua, esmâ, makale hepsi burada toplanır.
 */
import { create } from 'zustand';

export type FavoriteKind = 'dua' | 'name' | 'article' | 'ayah' | 'hadith';

export interface Favorite {
  kind: FavoriteKind;
  recordId: string;
  createdAt: number;
}

interface FavoriteState {
  items: Favorite[];
  hydrated: boolean;
  hydrate: (items: Favorite[]) => void;
  toggle: (kind: FavoriteKind, recordId: string) => boolean;
  has: (kind: FavoriteKind, recordId: string) => boolean;
  byKind: (kind: FavoriteKind) => Favorite[];
  clear: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: (items) => set({ items, hydrated: true }),

  toggle: (kind, recordId) => {
    const varMi = get().items.some((f) => f.kind === kind && f.recordId === recordId);
    set({
      items: varMi
        ? get().items.filter((f) => !(f.kind === kind && f.recordId === recordId))
        : [{ kind, recordId, createdAt: Date.now() }, ...get().items],
    });
    return !varMi;
  },

  has: (kind, recordId) => get().items.some((f) => f.kind === kind && f.recordId === recordId),
  byKind: (kind) => get().items.filter((f) => f.kind === kind),
  clear: () => set({ items: [] }),
}));
