/**
 * Vakit kaynağı soyutlaması — şartname §15, DECISIONS D7.
 *
 * **Birincil kaynak cihazdaki hesaptır.** Ağ sağlayıcısı isteğe bağlıdır ve
 * yalnız kullanıcı açıkça seçtiyse kullanılır; başarısız olursa sessizce
 * hesaba düşülür. Bu sıralama bilinçlidir: kategorinin en sık şikâyeti
 * "vakit gelmiyor / yanlış" ve bunun kaynağı sunucuya bağımlılıktır.
 */
import { logger } from '@/lib/log';
import { daySchedule, type DaySchedule, type ScheduleInput } from './schedule';

const log = logger('prayer');

export type ProviderId = 'local' | 'network';

export interface PrayerTimesProvider {
  id: ProviderId;
  /** Ağ gerektirir mi — çevrimdışıyken atlanır. */
  needsNetwork: boolean;
  getDay(input: ScheduleInput, year: number, month: number, day: number): Promise<DaySchedule>;
}

/** Cihazda astronomik hesap. Her zaman çalışır, internet istemez. */
export const localProvider: PrayerTimesProvider = {
  id: 'local',
  needsNetwork: false,
  async getDay(input, year, month, day) {
    return daySchedule(input, year, month, day);
  },
};

export interface ResolveOptions {
  /** Kullanıcının seçtiği kaynak. */
  preferred: ProviderId;
  /** Cihaz şu an çevrimiçi mi. */
  online: boolean;
  /** Ağ sağlayıcısı — yalnız 'network' seçiliyse gerekir. */
  network?: PrayerTimesProvider;
}

export interface ResolvedDay {
  schedule: DaySchedule;
  /** Sonucu hangi kaynak verdi — arayüzde şeffaflık için (§107). */
  source: ProviderId;
  /** Ağ kaynağı istenip de kullanılamadıysa true. */
  fellBack: boolean;
}

/**
 * Gün çizelgesini çözer. **Hiçbir koşulda boş dönmez**: ağ kaynağı seçili olsa
 * bile hata durumunda yerel hesap devreye girer.
 */
export async function resolveDay(
  input: ScheduleInput,
  year: number, month: number, day: number,
  options: ResolveOptions,
): Promise<ResolvedDay> {
  const { preferred, online, network } = options;

  if (preferred === 'network' && network && online) {
    try {
      const schedule = await network.getDay(input, year, month, day);
      return { schedule, source: 'network', fellBack: false };
    } catch {
      log.warn('ağ kaynağı başarısız, yerel hesaba düşüldü');
    }
  }

  const schedule = await localProvider.getDay(input, year, month, day);
  return {
    schedule,
    source: 'local',
    fellBack: preferred === 'network',
  };
}
