/**
 * Kıraat çalar — şartname §32.
 *
 * `playback.ts` içindeki saf durum mantığını gerçek çalara bağlar. Ses
 * dosyaları CDN'den akar; cihazda tutulan kopya varsa o kullanılır.
 *
 * Cihazda görülen üç hata ve çözümleri:
 *
 * 1. **Âyet geçişinde takılma.** Âyet bitince yeni dosya `replace()` ile
 *    yükleniyor, hemen ardından `play()` çağrılıyordu; dosya henüz
 *    yüklenmemişken gelen `play()` iOS'ta bazen boşa düşüyor, ses
 *    "durdur-başlat" yapılana kadar bekliyordu. Şimdi **iki çalar** var:
 *    biri çalarken öbürü sıradaki âyeti önceden yükler; âyet bitince
 *    hazır olan çalar anında başlar. Yükleme yine de takılırsa bir bekçi
 *    zamanlayıcısı çalmayı yeniden dener.
 * 2. **Sayfadan çıkınca sürmesi.** Bekleyen "sonraki âyet" işi sayfa
 *    kapandıktan sonra da çalışıp yeni bir çalar açabiliyordu. Artık ekran
 *    odaktan çıktığı anda (geri, sekme değişimi) çalma durur ve bekleyen
 *    her iş geçersiz sayılır.
 * 3. **Kilit ekranında görünmemesi.** Çalan çalar kilit ekranı / Denetim
 *    Merkezi için etkin kılınır; sure ve âyet adı orada görünür,
 *    oradan durdurulup sürdürülebilir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '@/lib/log';
import { playbackAudioUrl } from './source';
import {
  initialPlayback, setQueue, advance, next, previous, setSpeed,
  type AyahRef, type PlaybackState, type RepeatMode,
} from './playback';

const log = logger('kiraat');

/** Yüklenip çalmaya başlamayan âyet için bekleme süresi. */
const BEKCI_MS = 9000;
/** Aynı âyette en fazla kaç kez yeniden denenir. */
const EN_FAZLA_DENEME = 2;

export interface NowPlayingInfo {
  title: string;
  artist?: string;
}

export interface RecitationOptions {
  reciterId: string;
  bitrate: number;
  /** Cihazda indirilmiş dosyanın yolu — yoksa CDN kullanılır. */
  localUri?: (globalAyah: number) => string | null;
  /** Kilit ekranında gösterilecek başlık. */
  describe?: (ref: AyahRef) => NowPlayingInfo;
}

export interface RecitationController {
  state: PlaybackState;
  current: AyahRef | null;
  playing: boolean;
  /** Kuyruk kurulmuş ama duraklatılmış (sürdürülebilir). */
  paused: boolean;
  /** Ses yükleniyor / ağ bekleniyor. */
  loading: boolean;
  error: boolean;
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
  const [state, setStateRaw] = useState<PlaybackState>(initialPlayback);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const durum = useRef<PlaybackState>(state);
  const setState = useCallback((s: PlaybackState) => { durum.current = s; setStateRaw(s); }, []);

  const secenek = useRef(options);
  secenek.current = options;

  const calarlar = useRef<[AudioPlayer, AudioPlayer] | null>(null);
  const aktif = useRef<0 | 1>(0);
  /** Pasif çalarda önceden yüklenmiş kuyruk konumu. */
  const hazir = useRef<number | null>(null);
  const numaralar = useRef<number[]>([]);
  const istek = useRef(0);
  const oynatBekliyor = useRef(false);
  const deneme = useRef(0);
  const bekci = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canli = useRef(true);

  const bekciTemizle = () => {
    if (bekci.current) { clearTimeout(bekci.current); bekci.current = null; }
  };

  const kaynak = useCallback(async (index: number): Promise<string | null> => {
    const global = numaralar.current[index];
    if (global === undefined) return null;
    const o = secenek.current;
    return playbackAudioUrl(o.reciterId, global, o.bitrate,
      o.localUri?.(global) ?? null,
      async (uri) => (await FileSystem.getInfoAsync(uri)).exists);
  }, []);

  const kilitEkrani = useCallback((p: AudioPlayer, index: number) => {
    const ref = durum.current.queue[index];
    const bilgi = ref ? secenek.current.describe?.(ref) : undefined;
    try {
      p.setActiveForLockScreen(true, {
        title: bilgi?.title ?? '',
        artist: bilgi?.artist ?? '',
        albumTitle: 'BEŞ',
      });
    } catch { /* Kilit ekranı desteklenmiyorsa (web) sessizce geçilir. */ }
  }, []);

  /** Pasif çalara sıradaki âyeti yükler — geçiş anında beklemesin diye. */
  const hazirla = useCallback(async (index: number) => {
    const c = calarlar.current;
    if (!c || index < 0 || index >= numaralar.current.length) { hazir.current = null; return; }
    const id = istek.current;
    const url = await kaynak(index);
    if (id !== istek.current || !url || !canli.current) return;
    const pasif = c[aktif.current === 0 ? 1 : 0];
    pasif.pause();
    pasif.replace({ uri: url });
    hazir.current = index;
  }, [kaynak]);

  const onYuklemeHedefi = (s: PlaybackState): number => {
    const i = s.index + 1;
    if (i < s.queue.length) return i;
    return s.repeat === 'surah' ? 0 : -1;
  };

  const cal = useCallback(async (hedef: PlaybackState) => {
    const c = calarlar.current;
    if (!c || !canli.current) return;
    const id = ++istek.current;
    bekciTemizle();
    setLoading(true);
    setError(false);
    setState({ ...hedef, playing: true });

    const eski = c[aktif.current];
    let p: AudioPlayer;
    if (hazir.current === hedef.index) {
      // Önceden yüklenmiş çalara geç: dosya hazır, bekleme yok.
      eski.pause();
      aktif.current = aktif.current === 0 ? 1 : 0;
      p = c[aktif.current];
      hazir.current = null;
    } else {
      const url = await kaynak(hedef.index);
      if (id !== istek.current || !canli.current) return;
      if (!url) {
        setLoading(false);
        setError(true);
        setState({ ...hedef, playing: false });
        return;
      }
      eski.pause();
      p = eski;
      p.replace({ uri: url });
    }

    oynatBekliyor.current = true;
    p.setPlaybackRate(hedef.speed);
    p.play();
    kilitEkrani(p, hedef.index);

    // Bekçi: dosya yüklenmiş ama çalma başlamamışsa yeniden dene.
    bekci.current = setTimeout(() => {
      if (id !== istek.current || !oynatBekliyor.current || !canli.current) return;
      if (deneme.current < EN_FAZLA_DENEME) {
        deneme.current += 1;
        log.warn('kıraat takıldı, yeniden deneniyor', { index: hedef.index });
        hazir.current = null;
        void cal(durum.current);
      } else {
        deneme.current = 0;
        setLoading(false);
        setError(true);
        setState({ ...durum.current, playing: false });
      }
    }, BEKCI_MS);

    void hazirla(onYuklemeHedefi(hedef));
  }, [kaynak, hazirla, kilitEkrani, setState]);

  const ilerle = useCallback(() => {
    const simdiki = durum.current;
    const sonraki = advance(simdiki);
    if (!sonraki.playing) {
      bekciTemizle();
      setLoading(false);
      calarlar.current?.[aktif.current].clearLockScreenControls();
      setState({ ...sonraki, playing: false });
      return;
    }
    deneme.current = 0;
    if (sonraki.index === simdiki.index) {
      // Âyet tekrarı: aynı dosyayı başa sar.
      const p = calarlar.current?.[aktif.current];
      if (!p) return;
      void p.seekTo(0).then(() => p.play());
      return;
    }
    void cal(sonraki);
  }, [cal, setState]);

  const durumGeldi = useCallback((hangisi: 0 | 1, s: AudioStatus) => {
    if (hangisi !== aktif.current || !canli.current) return;
    const d = durum.current;
    if (s.playbackState === 'failed') {
      bekciTemizle();
      if (deneme.current < EN_FAZLA_DENEME) {
        deneme.current += 1;
        hazir.current = null;
        void cal(d);
        return;
      }
      log.warn('kıraat yüklenemedi');
      setLoading(false);
      setError(true);
      setState({ ...d, playing: false });
      return;
    }
    if (s.didJustFinish) { ilerle(); return; }
    if (s.playing) {
      if (oynatBekliyor.current) { oynatBekliyor.current = false; bekciTemizle(); deneme.current = 0; }
      setLoading(false);
      // Kilit ekranından sürdürüldü.
      if (!d.playing) setState({ ...d, playing: true });
      return;
    }
    if (oynatBekliyor.current && s.isLoaded) {
      // Yüklendi ama çalmıyor: bekleyen çalma isteğini yinele.
      calarlar.current?.[hangisi].play();
      return;
    }
    // Kilit ekranından / Denetim Merkezi'nden duraklatıldı.
    if (!oynatBekliyor.current && s.timeControlStatus === 'paused' && d.playing) {
      setState({ ...d, playing: false });
    }
  }, [cal, ilerle, setState]);

  // Dinleyici bir kez kurulur; her zaman en güncel işleyiciyi çağırır.
  const isleyici = useRef(durumGeldi);
  isleyici.current = durumGeldi;

  useEffect(() => {
    canli.current = true;
    // Sessize alınmış telefonda da duyulsun, ekran kilitlenince sürsün.
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true })
      .catch(() => log.warn('ses kipi ayarlanamadı'));
    const a = createAudioPlayer(null, { updateInterval: 250 });
    const b = createAudioPlayer(null, { updateInterval: 250 });
    calarlar.current = [a, b];
    const s1 = a.addListener('playbackStatusUpdate', (s) => isleyici.current(0, s));
    const s2 = b.addListener('playbackStatusUpdate', (s) => isleyici.current(1, s));
    return () => {
      canli.current = false;
      istek.current++;
      bekciTemizle();
      s1.remove();
      s2.remove();
      try { a.clearLockScreenControls(); b.clearLockScreenControls(); } catch { /* yok */ }
      a.remove();
      b.remove();
      calarlar.current = null;
    };
    // Çalarlar ekran ömrü boyunca bir kez kurulur; dinleyici en güncel
    // işleyiciyi ref üzerinden çağırır.
  }, []);

  const stop = useCallback(() => {
    istek.current++;
    bekciTemizle();
    oynatBekliyor.current = false;
    hazir.current = null;
    setLoading(false);
    const c = calarlar.current;
    if (c) {
      c[0].pause();
      c[1].pause();
      try { c[aktif.current].clearLockScreenControls(); } catch { /* yok */ }
    }
    // Kuyruk da sıfırlanır: eskiden yalnız `playing: false` yapılıyordu,
    // konum (index) kaldığı için ekran bunu "duraklatıldı" sayıyor ve alttaki
    // çalma çubuğu kapanmıyordu — kapat (X) düğmesi hiçbir şey yapmıyor gibi
    // görünüyordu. Tekrar/hız ayarları korunur.
    setState({ ...durum.current, playing: false, queue: [], index: -1, rangeCycles: 0 });
  }, [setState]);

  // Ekrandan çıkıldığı anda (geri, sekme) çalma durur.
  useFocusEffect(useCallback(() => () => { stop(); }, [stop]));

  const start = useCallback((queue: AyahRef[], globalNumbers: number[], startAt?: AyahRef) => {
    numaralar.current = globalNumbers;
    hazir.current = null;
    deneme.current = 0;
    void cal(setQueue(durum.current, queue, startAt));
  }, [cal]);

  const toggle = useCallback(() => {
    const c = calarlar.current;
    const d = durum.current;
    if (!c || d.index < 0) return;
    const p = c[aktif.current];
    if (d.playing) {
      istek.current++;
      bekciTemizle();
      oynatBekliyor.current = false;
      p.pause();
      setLoading(false);
      setState({ ...d, playing: false });
    } else {
      if (!p.isLoaded) { void cal(d); return; }
      oynatBekliyor.current = true;
      p.play();
      kilitEkrani(p, d.index);
      setState({ ...d, playing: true });
    }
  }, [cal, kilitEkrani, setState]);

  const skipNext = useCallback(() => { deneme.current = 0; void cal(next(durum.current)); }, [cal]);
  const skipPrevious = useCallback(() => { deneme.current = 0; hazir.current = null; void cal(previous(durum.current)); }, [cal]);
  const setRepeat = useCallback((mode: RepeatMode) => {
    setState({ ...durum.current, repeat: mode });
  }, [setState]);
  const setRate = useCallback((speed: number) => {
    const yeni = setSpeed(durum.current, speed);
    calarlar.current?.[aktif.current].setPlaybackRate(yeni.speed);
    setState(yeni);
  }, [setState]);

  return {
    state,
    current: state.index >= 0 ? (state.queue[state.index] ?? null) : null,
    playing: state.playing,
    paused: !state.playing && state.index >= 0,
    loading,
    error,
    start, toggle, stop, skipNext, skipPrevious, setRepeat, setRate,
  };
}
