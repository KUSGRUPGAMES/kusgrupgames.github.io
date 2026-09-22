/**
 * Ana sayfa düzeni — şartname §21.
 * Kullanıcı kartları gizleyip gösterebilir ve sırasını değiştirebilir.
 *
 * Kural: yeni bir kart eklendiğinde eski kullanıcının düzeni bozulmaz —
 * bilinmeyen kart listenin sonuna, görünür olarak eklenir. Eksik kart
 * tanımı ise sessizce atılır (sürüm düşürme durumu).
 */
import { create } from 'zustand';

export type HomeCardId =
  | 'nextPrayer' | 'todayTimes' | 'friday' | 'ramadan' | 'hijriDate'
  | 'dailyAyah' | 'dailyDua' | 'dailyKnowledge' | 'dailyName' | 'religiousDay' | 'moon';

export const HOME_CARDS: readonly HomeCardId[] = [
  'nextPrayer', 'todayTimes', 'friday', 'ramadan', 'hijriDate',
  'dailyAyah', 'dailyDua', 'dailyKnowledge', 'dailyName', 'religiousDay', 'moon',
];

/** Kapatılamayan kartlar: bunlar olmadan ana sayfa boş kalır. */
export const PINNED_CARDS: readonly HomeCardId[] = ['nextPrayer'];

export interface HomeCardState {
  id: HomeCardId;
  visible: boolean;
}

interface HomeLayoutState {
  cards: HomeCardState[];
  hydrated: boolean;
  hydrate: (stored: unknown) => void;
  toggle: (id: HomeCardId) => void;
  move: (id: HomeCardId, delta: number) => void;
  reset: () => void;
  visibleCards: () => HomeCardId[];
}

const varsayilan = (): HomeCardState[] => HOME_CARDS.map((id) => ({ id, visible: true }));

/** Depodan gelen düzeni bilinen kartlarla uzlaştırır. */
export function reconcile(stored: unknown): HomeCardState[] {
  if (!Array.isArray(stored)) return varsayilan();
  const bilinen = new Set<HomeCardId>(HOME_CARDS);
  const out: HomeCardState[] = [];
  const gorulen = new Set<HomeCardId>();

  for (const item of stored) {
    if (typeof item !== 'object' || item === null) continue;
    const id = (item as { id?: unknown }).id;
    if (typeof id !== 'string' || !bilinen.has(id as HomeCardId)) continue;
    if (gorulen.has(id as HomeCardId)) continue;
    gorulen.add(id as HomeCardId);
    const visible = (item as { visible?: unknown }).visible;
    out.push({
      id: id as HomeCardId,
      // Sabit kart kapatılamaz: depoda kapalı görünse bile açılır.
      visible: PINNED_CARDS.includes(id as HomeCardId) ? true : visible !== false,
    });
  }

  for (const id of HOME_CARDS) {
    if (!gorulen.has(id)) out.push({ id, visible: true });
  }
  return out;
}

export const useHomeLayoutStore = create<HomeLayoutState>((set, get) => ({
  cards: varsayilan(),
  hydrated: false,

  hydrate: (stored) => set({ cards: reconcile(stored), hydrated: true }),

  toggle: (id) => {
    if (PINNED_CARDS.includes(id)) return;
    set({ cards: get().cards.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)) });
  },

  move: (id, delta) => {
    const cards = [...get().cards];
    const i = cards.findIndex((c) => c.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= cards.length) return;
    const a = cards[i]!;
    cards[i] = cards[j]!;
    cards[j] = a;
    set({ cards });
  },

  reset: () => set({ cards: varsayilan() }),

  visibleCards: () => get().cards.filter((c) => c.visible).map((c) => c.id),
}));
