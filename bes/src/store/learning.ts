/**
 * Kur'an okuma kursu ilerlemesi — her ders için en iyi yıldız ve tarih.
 * Cihazda kalıcıdır (persistence.ts) ve yedeğe girer.
 */
import { create } from 'zustand';

export interface LessonResult {
  lessonId: string;
  /** En iyi sonuç (1–3). */
  stars: number;
  completedAt: number;
}

interface LearningState {
  results: LessonResult[];
  hydrated: boolean;
  hydrate: (results: LessonResult[]) => void;
  /** Sonucu kaydeder; daha düşük yıldız eskisini ezmez. */
  complete: (lessonId: string, stars: number) => void;
  reset: () => void;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  results: [],
  hydrated: false,

  hydrate: (results) => set({ results, hydrated: true }),

  complete: (lessonId, stars) => {
    const yildiz = Math.max(1, Math.min(3, Math.round(stars)));
    const mevcut = get().results.find((r) => r.lessonId === lessonId);
    const kayit: LessonResult = {
      lessonId,
      stars: Math.max(yildiz, mevcut?.stars ?? 0),
      completedAt: Date.now(),
    };
    set({ results: [kayit, ...get().results.filter((r) => r.lessonId !== lessonId)] });
  },

  reset: () => set({ results: [] }),
}));
