/**
 * Kur'an okuma kursunun sesleri — DECISIONS D26.
 *
 * - `speak`: harf adı ve hece, cihazın Arapça ses motoruyla.
 * - `playWord`: gerçek Kur'an kelimesi, hafızın sesiyle (akış, saklanmaz).
 * - `playAyah`: âyetin tamamı, kullanıcının seçtiği okuyucuyla.
 *
 * Aynı anda tek ses çalar; yenisi başlayınca öncekisi susar. Ekrandan
 * çıkınca (geri, sekme) her şey durur.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useFocusEffect } from 'expo-router';
import { logger } from '@/lib/log';
import { ayahAudioUrl } from '@/features/audio/source';
import { globalAyahNumber } from '@/features/quran/data';
import { useSettingsStore } from '@/store/settings';
import { wordAudioUrl, type QuranWord } from './words';

const log = logger('ders-ses');

export interface LearnAudio {
  /** Şu an çalan öğenin anahtarı (vurgulamak için). */
  active: string | null;
  /** Ağdan yükleniyor. */
  loading: boolean;
  /** Ses çalınamadı (çoğunlukla bağlantı yok). */
  failed: boolean;
  /** Cihazda Arapça ses var mı — `null`: henüz bilinmiyor. */
  ttsAvailable: boolean | null;
  speak: (text: string, key?: string) => void;
  playWord: (w: QuranWord) => void;
  playAyah: (surah: number, ayah: number) => void;
  stop: () => void;
}

export function useLearnAudio(): LearnAudio {
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null);
  const player = useRef<AudioPlayer | null>(null);
  const reciter = useSettingsStore((s) => s.settings.recitation);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => log.warn('ses kipi ayarlanamadı'));
    const p = createAudioPlayer(null, { updateInterval: 200 });
    player.current = p;
    const sub = p.addListener('playbackStatusUpdate', (s) => {
      if (s.playing) setLoading(false);
      if (s.playbackState === 'failed') { setLoading(false); setFailed(true); setActive(null); }
      if (s.didJustFinish) setActive(null);
    });
    Speech.getAvailableVoicesAsync()
      // Android ses motoru ilk çağrıda boş liste dönebiliyor; boş liste
      // "yok" değil "henüz bilinmiyor" demektir, yoksa uyarı boşuna çıkar.
      .then((v) => setTtsAvailable(v.length === 0 ? null : v.some((x) => x.language.toLowerCase().startsWith('ar'))))
      .catch(() => setTtsAvailable(false));
    return () => {
      sub.remove();
      void Speech.stop();
      p.remove();
      player.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    player.current?.pause();
    void Speech.stop();
    setActive(null);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => () => { stop(); }, [stop]));

  const url = useCallback((u: string, key: string) => {
    const p = player.current;
    if (!p) return;
    void Speech.stop();
    setFailed(false);
    setLoading(true);
    setActive(key);
    p.pause();
    p.replace({ uri: u });
    p.play();
  }, []);

  const speak = useCallback((text: string, key?: string) => {
    player.current?.pause();
    void Speech.stop();
    setActive(key ?? text);
    Speech.speak(text, {
      language: 'ar-SA',
      rate: 0.8,
      onDone: () => setActive(null),
      onStopped: () => setActive(null),
      onError: () => { setActive(null); setTtsAvailable(false); },
    });
  }, []);

  const playWord = useCallback((w: QuranWord) => {
    url(wordAudioUrl(w), `${w.surah}:${w.ayah}:${w.index}`);
  }, [url]);

  const playAyah = useCallback((surah: number, ayah: number) => {
    const global = globalAyahNumber(surah, ayah);
    const adres = global ? ayahAudioUrl(reciter.reciterId, global, reciter.bitrate) : null;
    if (adres) url(adres, `${surah}:${ayah}`);
  }, [url, reciter]);

  return { active, loading, failed, ttsAvailable, speak, playWord, playAyah, stop };
}
