/**
 * İbadet takibi — şartname §37, §38, §41, §42, §49.
 * Zikir oturumları, kaza sayaçları, ibadet defteri ve oruç kaydı.
 */
import { create } from 'zustand';
import type { DhikrSession } from '@/features/dhikr/stats';
import type { Reminder } from '@/features/notifications/reminders';

/** Kaza sayaçları beş farz + vitir (§41). */
export const QADA_SLOTS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'] as const;
export type QadaSlot = (typeof QADA_SLOTS)[number];

export type QadaCounters = Record<QadaSlot, number>;

export interface QadaEntry {
  id: string;
  slot: QadaSlot;
  delta: number;
  at: number;
}

/** İbadet defteri günlük kaydı (§42). */
export interface WorshipDay {
  /** 'YYYY-MM-DD' */
  date: string;
  /** Kılınan farzlar. */
  prayers: Partial<Record<Exclude<QadaSlot, 'witr'>, 'alone' | 'jamaah' | 'qada'>>;
  quranMinutes: number;
  note?: string;
}

export type FastKind = 'ramadan' | 'qada' | 'nafile' | 'kaffara';

/** Hatim/mukabele takibi (§48). */
export interface Khatm {
  id: string;
  title: string;
  startedOn: string;
  targetOn?: string;
  completedJuz: number[];
  active: boolean;
}

export interface FastDay {
  date: string;
  kind: FastKind;
  completed: boolean;
}

const bosSayac = (): QadaCounters => ({ fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 });

/** Depoya yazılan/okunan durum kesiti — kalıcılık katmanı bunu kullanır. */
export interface WorshipSnapshot {
  sessions?: DhikrSession[];
  khatms?: Khatm[];
  reminders?: Reminder[];
  qada?: Partial<QadaCounters>;
  qadaHistory?: QadaEntry[];
  days?: Record<string, WorshipDay>;
  fasts?: Record<string, FastDay>;
}

interface WorshipState {
  sessions: DhikrSession[];
  khatms: Khatm[];
  reminders: Reminder[];
  qada: QadaCounters;
  qadaHistory: QadaEntry[];
  days: Record<string, WorshipDay>;
  fasts: Record<string, FastDay>;
  hydrated: boolean;

  hydrate: (data: WorshipSnapshot) => void;

  addSession: (session: Omit<DhikrSession, 'id' | 'createdAt'>) => DhikrSession;
  removeSession: (id: string) => void;

  /** Kaza sayacını değiştirir. Sayaç asla eksiye düşmez. */
  adjustQada: (slot: QadaSlot, delta: number) => number;
  setQada: (slot: QadaSlot, value: number) => void;
  /** Toplu giriş: N ay/gün karşılığı ekleme (§41). */
  bulkQada: (days: number) => void;
  undoLastQada: () => void;

  setPrayer: (date: string, slot: Exclude<QadaSlot, 'witr'>, value: 'alone' | 'jamaah' | 'qada' | null) => void;
  setQuranMinutes: (date: string, minutes: number) => void;
  setDayNote: (date: string, note: string) => void;

  setFast: (date: string, kind: FastKind, completed: boolean) => void;
  clearFast: (date: string) => void;

  startKhatm: (title: string, startedOn: string, targetOn?: string) => Khatm;
  toggleJuz: (khatmId: string, juz: number) => void;
  finishKhatm: (khatmId: string) => void;
  removeKhatm: (khatmId: string) => void;
  activeKhatm: () => Khatm | null;

  addReminder: (reminder: Omit<Reminder, 'id'>) => Reminder;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
}

export const useWorshipStore = create<WorshipState>((set, get) => ({
  sessions: [],
  khatms: [],
  reminders: [],
  qada: bosSayac(),
  qadaHistory: [],
  days: {},
  fasts: {},
  hydrated: false,

  hydrate: (data) => set({
    sessions: data.sessions ?? [],
    khatms: data.khatms ?? [],
    reminders: data.reminders ?? [],
    qada: { ...bosSayac(), ...(data.qada ?? {}) },
    qadaHistory: data.qadaHistory ?? [],
    days: data.days ?? {},
    fasts: data.fasts ?? {},
    hydrated: true,
  }),

  addSession: (session) => {
    const kayit: DhikrSession = {
      ...session,
      count: Math.max(0, Math.round(session.count)),
      id: `${session.onDate}-${Date.now()}`,
      createdAt: Date.now(),
    };
    set({ sessions: [kayit, ...get().sessions] });
    return kayit;
  },

  removeSession: (id) => set({ sessions: get().sessions.filter((s) => s.id !== id) }),

  adjustQada: (slot, delta) => {
    const mevcut = get().qada[slot];
    const yeni = Math.max(0, mevcut + Math.round(delta));
    const gercekDelta = yeni - mevcut;
    if (gercekDelta === 0) return mevcut;
    set({
      qada: { ...get().qada, [slot]: yeni },
      qadaHistory: [{ id: `${slot}-${Date.now()}`, slot, delta: gercekDelta, at: Date.now() }, ...get().qadaHistory].slice(0, 200),
    });
    return yeni;
  },

  setQada: (slot, value) => set({
    qada: { ...get().qada, [slot]: Math.max(0, Math.round(value)) },
  }),

  bulkQada: (days) => {
    const n = Math.max(0, Math.round(days));
    if (n === 0) return;
    const sayac = { ...get().qada };
    for (const slot of QADA_SLOTS) sayac[slot] = Math.max(0, sayac[slot] + n);
    set({
      qada: sayac,
      qadaHistory: [
        ...QADA_SLOTS.map((slot) => ({ id: `${slot}-bulk-${Date.now()}`, slot, delta: n, at: Date.now() })),
        ...get().qadaHistory,
      ].slice(0, 200),
    });
  },

  undoLastQada: () => {
    const [son, ...kalan] = get().qadaHistory;
    if (!son) return;
    set({
      qada: { ...get().qada, [son.slot]: Math.max(0, get().qada[son.slot] - son.delta) },
      qadaHistory: kalan,
    });
  },

  setPrayer: (date, slot, value) => {
    const gun = get().days[date] ?? { date, prayers: {}, quranMinutes: 0 };
    const prayers = { ...gun.prayers };
    if (value === null) delete prayers[slot];
    else prayers[slot] = value;
    set({ days: { ...get().days, [date]: { ...gun, prayers } } });
  },

  setQuranMinutes: (date, minutes) => {
    const gun = get().days[date] ?? { date, prayers: {}, quranMinutes: 0 };
    set({ days: { ...get().days, [date]: { ...gun, quranMinutes: Math.max(0, Math.round(minutes)) } } });
  },

  setDayNote: (date, note) => {
    const gun = get().days[date] ?? { date, prayers: {}, quranMinutes: 0 };
    set({ days: { ...get().days, [date]: { ...gun, note } } });
  },

  setFast: (date, kind, completed) => set({
    fasts: { ...get().fasts, [date]: { date, kind, completed } },
  }),

  clearFast: (date) => {
    const kopya = { ...get().fasts };
    delete kopya[date];
    set({ fasts: kopya });
  },

  startKhatm: (title, startedOn, targetOn) => {
    const kayit: Khatm = {
      id: `khatm-${Date.now()}`,
      title,
      startedOn,
      ...(targetOn ? { targetOn } : {}),
      completedJuz: [],
      active: true,
    };
    // Aynı anda tek etkin hatim olur; yenisi başlayınca eskisi pasifleşir.
    set({ khatms: [kayit, ...get().khatms.map((k) => ({ ...k, active: false }))] });
    return kayit;
  },

  toggleJuz: (khatmId, juz) => {
    if (juz < 1 || juz > 30) return;
    set({
      khatms: get().khatms.map((k) => {
        if (k.id !== khatmId) return k;
        const varMi = k.completedJuz.includes(juz);
        return {
          ...k,
          completedJuz: varMi
            ? k.completedJuz.filter((j) => j !== juz)
            : [...k.completedJuz, juz].sort((a, b) => a - b),
        };
      }),
    });
  },

  finishKhatm: (khatmId) => set({
    khatms: get().khatms.map((k) => (k.id === khatmId ? { ...k, active: false } : k)),
  }),

  removeKhatm: (khatmId) => set({ khatms: get().khatms.filter((k) => k.id !== khatmId) }),

  activeKhatm: () => get().khatms.find((k) => k.active) ?? null,

  addReminder: (reminder) => {
    const kayit: Reminder = { ...reminder, id: `rem-${Date.now()}` };
    set({ reminders: [kayit, ...get().reminders] });
    return kayit;
  },

  updateReminder: (id, patch) => set({
    reminders: get().reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  }),

  removeReminder: (id) => set({ reminders: get().reminders.filter((r) => r.id !== id) }),
}));
