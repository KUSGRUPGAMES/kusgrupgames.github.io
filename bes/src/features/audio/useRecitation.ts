/**
 * Kıraat çalar — şartname §32.
 *
 * `playback.ts` içindeki saf durum mantığını gerçek çalara bağlar. Ses
 * dosyaları CDN'den akar; cihazda tutulan kopya varsa o kullanılır.
 *
 * Arka planda çalma ve kilit ekranı kontrolleri `app.config.ts` içindeki
 * `staysActiveInBackground` ayarıyla açılır.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { logger } from '@/lib/log';
import { ayahAudioUrl } from './source';
import {
  initialPlayback, setQueue, advance, next, previous, setSpeed,
  type AyahRef, type PlaybackState, type RepeatMode,
} from './playback';

const log = logger('kiraat');

export interface RecitationOptions {
  reciterId: string;
  bitrate: number;
  /** Cihazda indirilmiş dosyanın yolu — yoksa CDN kullanılır. */
  localUri?: (globalAyah: number) => string | null;
}

export interface RecitationController {
  state: PlaybackState;
  current: AyahRef | null;
  playing: boolean;
  /** Bir âyetten başlayarak kuyruğu çalar. */
  start: (queue: AyahRef[], globalNumbers: number[], startAt?: AyahRef) => void;
  toggle: () => void;
  stop: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  setRepeat: (mode: RepeatMode) => void;
  setRate: (speed: number) => void;
}

export function useRecitation(options: RecitationOptions): RecitationController {
  const [state, setState] = useState<PlaybackState>(initialPlayback);
  const player = useRef<AudioPlayer | null>(null);
  const numaralar = useRef<number[]>([]);

  useEffect(() => {
    // Sessize alınmış telefonda da duyulsun ve arka planda sürsün.
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true })
      .catch(() => log.warn('ses kipi ayarlanamadı'));
    return () => {
      player.current?.remove();
      player.current = null;
    };
  }, []);

  const kaynak = useCallback((index: number): string | null => {
    const global = numaralar.current[index];
    if (global === undefined) return null;
    const yerel = options.localUri?.(global);
    return yerel ?? ayahAudioUrl(options.reciterId, global, options.bitrate);
  }, [options]);

  const cal = useCallback((durum: PlaybackState) => {
    const url = kaynak(durum.index);
    if (!url) { setState({ ...durum, playing: false }); return; }
    try {
      if (!player.current) player.current = createAudioPlayer({ uri: url });
      else player.current.replace({ uri: url });
      player.current.setPlaybackRate(durum.speed);
      player.current.play();
      setState({ ...durum, playing: true });
    } catch (e) {
      // Ağ yoksa ya da dosya gelmezse sessizce durulur; çökme olmaz.
      log.warn('kıraat çalınamadı', { error: e });
      setState({ ...durum, playing: false });
    }
  }, [kaynak]);

  // Âyet bitince kuyruk ilerler.
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const sub = p.addListener('playbackStatusUpdate', (durum) => {
      if (durum.didJustFinish) {
        setState((onceki) => {
          const sonraki = advance(onceki);
          if (sonraki.playing && sonraki.index !== onceki.index) {
            // Bir sonraki âyet: çalmayı yeni durumla sürdür.
            setTimeout(() => cal(sonraki), 0);
            return sonraki;
          }
          if (sonraki.repeat === 'ayah') {
            setTimeout(() => cal(sonraki), 0);
            return sonraki;
          }
          return { ...sonraki, playing: false };
        });
      }
    });
    return () => sub.remove();
  }, [cal, state.index]);

  const start = useCallback((queue: AyahRef[], globalNumbers: number[], startAt?: AyahRef) => {
    numaralar.current = globalNumbers;
    const yeni = setQueue(state, queue, startAt);
    cal(yeni);
  }, [state, cal]);

  const toggle = useCallback(() => {
    const p = player.current;
    if (!p || state.index < 0) return;
    if (state.playing) { p.pause(); setState({ ...state, playing: false }); }
    else { p.play(); setState({ ...state, playing: true }); }
  }, [state]);

  const stop = useCallback(() => {
    player.current?.pause();
    setState({ ...state, playing: false });
  }, [state]);

  const skipNext = useCallback(() => cal(next(state)), [state, cal]);
  const skipPrevious = useCallback(() => cal(previous(state)), [state, cal]);
  const setRepeat = useCallback((mode: RepeatMode) => setState((s) => ({ ...s, repeat: mode })), []);
  const setRate = useCallback((speed: number) => {
    setState((s) => {
      const yeni = setSpeed(s, speed);
      player.current?.setPlaybackRate(yeni.speed);
      return yeni;
    });
  }, []);

  return {
    state,
    current: state.index >= 0 ? (state.queue[state.index] ?? null) : null,
    playing: state.playing,
    start, toggle, stop, skipNext, skipPrevious, setRepeat, setRate,
  };
}
