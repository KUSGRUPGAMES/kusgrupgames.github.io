/**
 * Kıraat oynatma mantığı — şartname §32.
 *
 * ⛔B4: kıraat kayıtları için lisans yok. Bu dosya **ses dosyası olmadan**
 * çalışan saf durum mantığıdır: kuyruk, tekrar kipleri, aralık, hız ve uyku
 * zamanlayıcısı. Lisans geldiğinde yalnız bir "çalar" bağlanacak; bu mantık
 * değişmeyecek ve şimdiden sınanmış olacak.
 *
 * Neden şimdi yazıldı: §104 — dış engel diğer geliştirmeyi durdurmaz.
 */

export type RepeatMode = 'off' | 'ayah' | 'range' | 'surah';

export interface AyahRef {
  surah: number;
  ayah: number;
}

export interface PlaybackRange {
  from: AyahRef;
  to: AyahRef;
  /** Aralık kaç kez tekrarlanacak (1 = bir kez). */
  repeatCount: number;
}

export interface PlaybackState {
  queue: AyahRef[];
  /** Kuyruktaki konum; -1 = başlanmadı. */
  index: number;
  playing: boolean;
  repeat: RepeatMode;
  /** 0.5–2.0 arası. */
  speed: number;
  range: PlaybackRange | null;
  /** Aralık kaç kez tamamlandı. */
  rangeCycles: number;
  /** Uyku zamanlayıcısı bitiş anı (ms) — null ise kapalı. */
  sleepAt: number | null;
}

export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2;

export function initialPlayback(): PlaybackState {
  return {
    queue: [], index: -1, playing: false, repeat: 'off',
    speed: 1, range: null, rangeCycles: 0, sleepAt: null,
  };
}

export function sameAyah(a: AyahRef, b: AyahRef): boolean {
  return a.surah === b.surah && a.ayah === b.ayah;
}

export function setQueue(state: PlaybackState, queue: AyahRef[], startAt?: AyahRef): PlaybackState {
  const index = startAt ? queue.findIndex((a) => sameAyah(a, startAt)) : 0;
  return { ...state, queue, index: queue.length === 0 ? -1 : Math.max(0, index), rangeCycles: 0 };
}

export function setSpeed(state: PlaybackState, speed: number): PlaybackState {
  const s = Number.isFinite(speed) ? speed : 1;
  return { ...state, speed: Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(s * 20) / 20)) };
}

export function setRange(state: PlaybackState, range: PlaybackRange | null): PlaybackState {
  return { ...state, range, rangeCycles: 0 };
}

/** Uyku zamanlayıcısı: N dakika sonra çalma durur. */
export function setSleepTimer(state: PlaybackState, minutes: number | null, now = Date.now()): PlaybackState {
  if (minutes === null || minutes <= 0) return { ...state, sleepAt: null };
  return { ...state, sleepAt: now + Math.round(minutes) * 60000 };
}

/** Zamanlayıcı doldu mu — her ilerlemede kontrol edilir. */
export function sleepExpired(state: PlaybackState, now = Date.now()): boolean {
  return state.sleepAt !== null && now >= state.sleepAt;
}

export function current(state: PlaybackState): AyahRef | null {
  return state.index >= 0 ? (state.queue[state.index] ?? null) : null;
}

/**
 * Bir âyet bittiğinde sıradaki duruma geçer.
 * Tekrar kipleri:
 * - `ayah`  : aynı âyet baştan.
 * - `range` : aralığın sonunda başa döner, sayaç dolunca durur.
 * - `surah` : kuyruk sonunda başa döner.
 * - `off`   : kuyruk sonunda durur.
 */
export function advance(state: PlaybackState, now = Date.now()): PlaybackState {
  if (state.index < 0 || state.queue.length === 0) return { ...state, playing: false };
  if (sleepExpired(state, now)) return { ...state, playing: false, sleepAt: null };

  if (state.repeat === 'ayah') return state;

  const sonraki = state.index + 1;

  if (state.repeat === 'range' && state.range) {
    const bitis = state.queue.findIndex((a) => sameAyah(a, state.range!.to));
    if (bitis >= 0 && state.index >= bitis) {
      const tur = state.rangeCycles + 1;
      if (tur >= state.range.repeatCount) {
        return { ...state, playing: false, rangeCycles: tur };
      }
      const bas = state.queue.findIndex((a) => sameAyah(a, state.range!.from));
      return { ...state, index: Math.max(0, bas), rangeCycles: tur };
    }
  }

  if (sonraki >= state.queue.length) {
    if (state.repeat === 'surah') return { ...state, index: 0 };
    return { ...state, playing: false };
  }

  return { ...state, index: sonraki };
}

export function next(state: PlaybackState): PlaybackState {
  if (state.queue.length === 0) return state;
  return { ...state, index: Math.min(state.queue.length - 1, state.index + 1) };
}

export function previous(state: PlaybackState): PlaybackState {
  if (state.queue.length === 0) return state;
  return { ...state, index: Math.max(0, state.index - 1) };
}

export function toggle(state: PlaybackState): PlaybackState {
  if (state.index < 0) return state;
  return { ...state, playing: !state.playing };
}
