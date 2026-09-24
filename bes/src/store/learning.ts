/**
 * Kur'an okuma eğitimi ilerlemesi — harf ve harekelerden "öğrendim"
 * işaretlenenler. `favorites.ts` ile aynı basit desen.
 */
import { create } from 'zustand';

export type LearningKind = 'letter' | 'harake';

export interface LearningMark {
  kind: LearningKind;
  recordId: string;
  learnedAt: number;
}

interface LearningState {
  items: LearningMark[];
  hydrated: boolean;
  hydrate: (items: LearningMark[]) => void;
  toggle: (kind: LearningKind, recordId: string) => boolean;
  has: (kind: LearningKind, recordId: string) => boolean;
  countByKind: (kind: LearningKind) => number;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: (items) => set({ items, hydrated: true }),

  toggle: (kind, recordId) => {
    const varMi = get().items.some((i) => i.kind === kind && i.recordId === recordId);
    set({
      items: varMi
        ? get().items.filter((i) => !(i.kind === kind && i.recordId === recordId))
        : [{ kind, recordId, learnedAt: Date.now() }, ...get().items],
    });
    return !varMi;
  },

  has: (kind, recordId) => get().items.some((i) => i.kind === kind && i.recordId === recordId),
  countByKind: (kind) => get().items.filter((i) => i.kind === kind).length,
}));
