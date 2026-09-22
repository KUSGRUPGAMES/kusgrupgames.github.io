/**
 * Okuma durumu — şartname §29, §30.
 * Son okunan konum ve yer imleri. Kalıcılık `boot/persistence.ts` içinde.
 */
import { create } from 'zustand';

export interface ReadingPosition {
  surah: number;
  ayah: number;
  updatedAt: number;
}

export interface Bookmark {
  id: string;
  surah: number;
  ayah: number;
  color: string;
  label?: string;
  note?: string;
  createdAt: number;
}

export const BOOKMARK_COLORS = ['emerald', 'gold', 'rose', 'sky'] as const;
export type BookmarkColor = (typeof BOOKMARK_COLORS)[number];

interface ReadingState {
  position: ReadingPosition | null;
  bookmarks: Bookmark[];
  hydrated: boolean;

  hydrate: (position: ReadingPosition | null, bookmarks: Bookmark[]) => void;
  setPosition: (surah: number, ayah: number) => void;
  addBookmark: (surah: number, ayah: number, options?: { color?: BookmarkColor; label?: string; note?: string }) => Bookmark;
  removeBookmark: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  bookmarkAt: (surah: number, ayah: number) => Bookmark | undefined;
}

const anahtar = (s: number, a: number) => `${s}:${a}`;

export const useReadingStore = create<ReadingState>((set, get) => ({
  position: null,
  bookmarks: [],
  hydrated: false,

  hydrate: (position, bookmarks) => set({ position, bookmarks, hydrated: true }),

  setPosition: (surah, ayah) => set({ position: { surah, ayah, updatedAt: Date.now() } }),

  addBookmark: (surah, ayah, options = {}) => {
    const mevcut = get().bookmarks.find((b) => b.surah === surah && b.ayah === ayah);
    // Aynı âyete ikinci yer imi açılmaz; var olan güncellenir.
    const kayit: Bookmark = {
      id: mevcut?.id ?? anahtar(surah, ayah),
      surah,
      ayah,
      color: options.color ?? mevcut?.color ?? 'emerald',
      ...(options.label !== undefined ? { label: options.label } : mevcut?.label !== undefined ? { label: mevcut.label } : {}),
      ...(options.note !== undefined ? { note: options.note } : mevcut?.note !== undefined ? { note: mevcut.note } : {}),
      createdAt: mevcut?.createdAt ?? Date.now(),
    };
    set({ bookmarks: [kayit, ...get().bookmarks.filter((b) => b.id !== kayit.id)] });
    return kayit;
  },

  removeBookmark: (id) => set({ bookmarks: get().bookmarks.filter((b) => b.id !== id) }),

  updateNote: (id, note) => set({
    bookmarks: get().bookmarks.map((b) => (b.id === id ? { ...b, note } : b)),
  }),

  bookmarkAt: (surah, ayah) => get().bookmarks.find((b) => b.surah === surah && b.ayah === ayah),
}));
