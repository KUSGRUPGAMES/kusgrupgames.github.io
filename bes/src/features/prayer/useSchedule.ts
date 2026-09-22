/**
 * Canlı vakit görünümü — şartname §14, §81.
 *
 * Pil kuralı: geri sayım saniyede bir ilerler, ama yalnız uygulama öndeyken;
 * arka plana geçince sayaç durur. Astronomik hesap saniyede bir yapılmaz:
 * gün çizelgesi yalnız **takvim günü ya da girdi değişince** yeniden
 * hesaplanır, saniyelik iş sadece bir çıkarmadır.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { zonedNow } from '@/lib/time/zone';
import { daySchedule, type DaySchedule, type ScheduleInput } from './schedule';
import { findNext, findCurrent } from './calc';
import type { PrayerKey } from './methods';

export interface LiveView {
  today: DaySchedule;
  tomorrow: DaySchedule;
  current: PrayerKey | null;
  next: { key: PrayerKey; at: Date; tomorrow: boolean } | null;
  secondsToNext: number;
  progress: number;
}

/** Saniyede bir ilerleyen "şimdi" — arka planda durur. */
function useTicker(tickMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const basla = () => {
      if (timer.current) return;
      setNow(new Date());
      timer.current = setInterval(() => setNow(new Date()), tickMs);
    };
    const durdur = () => {
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
    };
    basla();
    const sub = AppState.addEventListener('change', (s) => (s === 'active' ? basla() : durdur()));
    return () => { durdur(); sub.remove(); };
  }, [tickMs]);

  return now;
}

export function useLiveView(input: ScheduleInput | null, tickMs = 1000): LiveView | null {
  const now = useTicker(tickMs);

  // Konumun çerçevesindeki takvim günü — saniyelik değil, günlük değişir.
  const gun = useMemo(() => {
    if (!input) return null;
    const z = zonedNow(input.timezone, now);
    return { year: z.year, month: z.month, day: z.day };
    // `now` her saniye değişir ama sonuç gün içinde aynı kalır; asıl kazanç
    // aşağıdaki çizelge memo'sunun bu sabit anahtara bağlanmasıdır.
  }, [input, now]);

  const gunAnahtari = gun ? `${gun.year}-${gun.month}-${gun.day}` : null;

  const cizelgeler = useMemo(() => {
    if (!input || !gun) return null;
    const bugun = daySchedule(input, gun.year, gun.month, gun.day);
    const y = new Date(Date.UTC(gun.year, gun.month, gun.day + 1));
    const yarin = daySchedule(input, y.getUTCFullYear(), y.getUTCMonth(), y.getUTCDate());
    return { bugun, yarin };
    // Bilerek `gunAnahtari`ne bağlı: gün dönmedikçe astronomi tekrar çalışmaz.
     
  }, [input, gunAnahtari]);

  if (!input || !cizelgeler) return null;

  const z = zonedNow(input.timezone, now);
  const { bugun, yarin } = cizelgeler;
  const sonraki = findNext(bugun.times, yarin.times.fajr, z.hours);
  const current = findCurrent(bugun.times, z.hours);

  if (!sonraki) {
    return { today: bugun, tomorrow: yarin, current, next: null, secondsToNext: 0, progress: 0 };
  }

  const kaynak = sonraki.tomorrow ? yarin : bugun;
  const at = kaynak.entries.find((e) => e.key === sonraki.key)?.at ?? null;
  if (!at) {
    return { today: bugun, tomorrow: yarin, current, next: null, secondsToNext: 0, progress: 0 };
  }

  const oncekiSaat = current === null ? null : bugun.times[current];
  const ara = sonraki.at - (oncekiSaat ?? sonraki.at - 1);
  const gecen = z.hours - (oncekiSaat ?? z.hours);

  return {
    today: bugun,
    tomorrow: yarin,
    current,
    next: { key: sonraki.key, at, tomorrow: sonraki.tomorrow },
    secondsToNext: Math.max(0, Math.round((at.getTime() - now.getTime()) / 1000)),
    progress: ara > 0 ? Math.min(1, Math.max(0, gecen / ara)) : 0,
  };
}
